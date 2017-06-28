/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './single-workspace-constants';
import $ from 'jquery';
var io = require('socket.io-client')();

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

      this.newVariantDialog = {
          open : false
      };

      this.editVariantDialog = {
          open : false
      };

      this.io = require('socket.io-client')();

      this.io.on('workspacechange', function(msg) {
          this.serverRequest = $.get('/api/workspace/' + msg.id, function(result) {
              this.fetchSingleWorkspaceInfo(msg.id);
              this.emitChange();
          }.bind(this));
      });
      this.dispatchToken = null;
      this.redispatch();
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
            case ActionTypes.CREATE_NEW_VARIANT:
                this.createNewVariant(action.data);
                break;
            case ActionTypes.OPEN_NEW_VARIANT_DIALOG:
                this.newVariantDialog = {
                  open: true,
                  sourceTimeSliceId: action.data.sourceTimeSliceId
                };
                this.emitChange();
                break;
            case ActionTypes.CLOSE_NEW_VARIANT_DIALOG:
                this.newVariantDialog = {open: false};
                this.emitChange();
                break;
            case ActionTypes.OPEN_EDIT_VARIANT_DIALOG:
              let name = null;
              let description = null;
              let workspace = this.getWorkspaceInfo().workspace;
              for (let i = 0; i < workspace.timeline.length; i++) {

                // either we find indicated timeline
                // or if it was indicated, we use current one
                if (workspace.timeline[i]._id === action.data.sourceTimeSliceId ||
                  (!action.data.sourceTimeSliceId && workspace.timeline[i].current)) {

                    name = workspace.timeline[i].name;
                    description = workspace.timeline[i].description;
                  }

              }
              this.editVariantDialog = {
                open: true,
                sourceTimeSliceId: action.data.sourceTimeSliceId,
                name : name,
                description : description
              };
              this.emitChange();
              break;
            case ActionTypes.CLOSE_EDIT_VARIANT_DIALOG:
              this.editVariantDialog = {
                open: false
              };
              this.emitChange();
              break;
            case ActionTypes.MODIFY_VARIANT:
              this.modifyVariant(action.data);
              break;
            case ActionTypes.SET_VARIANT_AS_CURRENT:
              this.modifyVariant(action.data);
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

  getNewVariantDialogState(){
    return this.newVariantDialog;
  }

  getEditVariantDialogState(){
    return this.editVariantDialog;
  }

  getWorkspaceId(){
    return this.workspaceID;
  }

  fetchSingleWorkspaceInfo() {
    this.serverRequest = $.get('/api/workspace/' + this.workspaceID, function(result) {
      this.workspace = result;
      this.emitChange();
    }.bind(this));
  }

  getWorkspaceInfo() {
    if (!this.workspace) {
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
      let url = '/api/map';
      if(data.timesliceId){
        url = '/api/variant/' + data.timesliceId + '/map';
      }
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
    $.ajax({
      type: 'DELETE',
      url: '/api/map/' + data.mapID,
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

  createNewVariant(data){
    $.ajax({
      type: 'POST',
      url: '/api/workspace/' + this.getWorkspaceId() + '/variant/' + data.sourceTimeSliceId,
      data: {
        name : data.name,
        description : data.description
      },
      success: function(data) {
        this.workspace = data;
        this.newVariantDialog = {
          open: false
        };
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }

  modifyVariant(data){
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + this.getWorkspaceId() + '/variant/' + data.sourceTimeSliceId,
      data: {
        name : data.name,
        description : data.description,
        current : data.current
      },
      success: function(data) {
        this.workspace = data;
        this.editVariantDialog = {
          open: false
        };
        this.emitChange();
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }
}
