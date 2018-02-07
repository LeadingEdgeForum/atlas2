/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './single-workspace-constants';
import $ from 'jquery';

const ActionTypes = Constants.ACTION_TYPES;

export default class SingleWorkspaceStore extends Store {

  constructor(workspaceID) {
      super();
      this.workspaceID = workspaceID;
      this.workspace = null;

      this.editWorkspaceDialog = {
          open : false,
          workspaceID : this.workspaceID
      };

      this.inviteDialog = {
          open : false
      };

      this.newMapDialog = {
          open : false
      };

      this.io = require('socket.io-client')();

      this.io.on('workspacechange', this.reloadOnSocketMessage);
      this.dispatchToken = null;
      this.redispatch();
  }

  reloadOnSocketMessage(msg){
    this.serverRequest = $.get('/api/workspace/' + msg.id, function(result) {
      //only reload if my workspace is affected
      if(this.workspaceID === msg.id){
        this.fetchSingleWorkspaceInfo(msg.id);
        this.emitChange();
      }
    }.bind(this));
  }

  cleanUp(){
    this.io.removeListener('workspacechange', this.reloadOnSocketMessage);
  }

  redispatch(){
    if(this.dispatchToken){
      return;
    }
    this.dispatchToken = Dispatcher.register(action => {
        switch (action.actionType) {
            case ActionTypes.MAP_OPEN_NEW_MAP_DIALOG:
                this.newMapDialog.open = true;
                this.emitChange();
                break;
            case ActionTypes.MAP_CLOSE_NEW_MAP_DIALOG:
                this.newMapDialog.open = false;
                this.emitChange();
                break;
            case ActionTypes.MAP_CLOSE_SUBMIT_NEW_MAP_DIALOG:
                this.submitNewMapDialog(action.data);
                break;
            case ActionTypes.MAP_DELETE:
                this.deleteMap(action.data);
                break;
            case ActionTypes.WORKSPACE_OPEN_INVITE_DIALOG:
                this.inviteDialog.open = true;
                this.emitChange();
                break;
            case ActionTypes.WORKSPACE_CLOSE_INVITE_DIALOG:
                this.inviteDialog.open = false;
                this.emitChange();
                break;
            case ActionTypes.WORKSPACE_SUBMIT_INVITE_DIALOG:
                this.inviteEditor(action.data);
                break;
            case ActionTypes.WORKSPACE_DELETE_USER:
                this.removeEditor(action.data);
                break;
            case ActionTypes.WORKSPACE_OPEN_EDIT_WORKSPACE_DIALOG:
                this.editWorkspaceDialog.open = true;
                this.editWorkspaceDialog.name = this.workspace.workspace.name;
                this.editWorkspaceDialog.description = this.workspace.workspace.description;
                this.editWorkspaceDialog.purpose = this.workspace.workspace.purpose;
                this.emitChange();
                break;
            case ActionTypes.WORKSPACE_CLOSE_EDIT_WORKSPACE_DIALOG:
                this.editWorkspaceDialog.open = false;
                this.emitChange();
                break;
            case ActionTypes.WORKSPACE_SUBMIT_EDIT_WORKSPACE_DIALOG:
                this.submitNewWorkspaceDialog(action.data);
                //no change, because it will go only after the submission is successful
                break;
            case ActionTypes.UPLOAD_A_MAP:
              this.uploadAMap(action.data);
              break;
            default:
                return;
        }
    });
  }

  undispatch(){
    if(this.dispatchToken){
      Dispatcher.unregister(this.dispatchToken);
      this.dispatchToken = null;
    }
  }

  emitChange() {
    super.emitChange();
  }

  getNewMapDialogState(){
    return this.newMapDialog;
  }

  getWorkspaceEditDialogState(){
    return this.editWorkspaceDialog;
  }

  getInviteNewUserDialogState(){
    return this.inviteDialog;
  }

  getWorkspaceId(){
    return this.workspaceID;
  }

  fetchSingleWorkspaceInfo() {
    this.serverRequest = $.get('/api/workspace/' + this.workspaceID)
      .done(function(result) {
        this.errorCode = null;
        this.workspace = result;
        this.emitChange();
      }.bind(this))
      .fail(function(error) {
        this.errorCode = error.status;
        this.emitChange();
      }.bind(this));
  }

  getErrorCode(){
    return this.errorCode;
  }

  getWorkspaceInfo() {
    if (!this.workspace && !this.errorCode) {
      this.fetchSingleWorkspaceInfo();
      return {
        workspace: {
          name: "Loading...",
          maps: [],
          capabilityCategories : []
        },
        loading: true
      };
    }
    return this.workspace;
  }

  submitNewWorkspaceDialog(data){
    if(data.workspaceID !== this.workspaceID){
      console.error('workspaceID mismatch, aborting');
      return;
    }
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + data.workspaceID,
      dataType: 'json',
      data: data,
      success: function(data) {
        this.workspace = data;
        this.editWorkspaceDialog.open = false;
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }

  inviteEditor(data){
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + this.workspaceID + '/editor/' + data.email,
      success: function(data) {
        this.workspace = data;
        this.inviteDialog.open = false;
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }

  removeEditor(data){
    $.ajax({
      type: 'DELETE',
      url: '/api/workspace/' + this.workspaceID + '/editor/' + data.email,
      success: function(data) {
        this.workspace = data;
        this.inviteDialog.open = false;
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }

  submitNewMapDialog(data) {
    if(data.workspaceID === this.getWorkspaceId()){
      let url = '/api/workspace/' + this.getWorkspaceId() + '/map';
      $.ajax({
        type: 'POST',
        url: url,
        dataType: 'json',
        data: data,
        success: function(data) {
          this.fetchSingleWorkspaceInfo(); // create new map should return map, so we have to refetch workspace here
          this.newMapDialog.open = false;
          this.emitChange();
          this.io.emit('workspace', {
            type: 'change',
            id: data.workspaceID
          });
        }.bind(this)
      });
    }
  }

  deleteMap(data){
    let workspaceId = this.getWorkspaceId();
    $.ajax({
      type: 'DELETE',
      url: '/api/workspace/' + workspaceId + '/map/' + data.mapID,
      success: function(data) {
        this.workspace = data;
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
        // null maps of every person who was editing it
        this.io.emit('map', {
          type: 'change',
          id: data.mapID
        });
      }.bind(this)
    });
  }

  uploadAMap(data){
    $.ajax({
      type: 'POST',
      url: '/api/map/json',
      data: {
        workspaceID : data.workspaceId,
        map : data.mapJSON
      },
      success: function(response) {
        console.log('about to emit change', data);
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceId
        });
        this.fetchSingleWorkspaceInfo();
      }.bind(this)
    });
  }
}
