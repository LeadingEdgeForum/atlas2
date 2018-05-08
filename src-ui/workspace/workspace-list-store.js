/* Copyright 2018  Krzysztof Daniel.
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
import Constants from './workspace-constants';
import $ from 'jquery';
var io = require('socket.io-client')();

const ActionTypes = Constants.ACTION_TYPES;

export default class WorkspaceListStore extends Store {

  constructor() {
      super();

      this.workspaces = null;
      this.newWorkspaceDialog = {
          open : false
      };

      this.io = require('socket.io-client')();

      this.io.on('workspacechange', function(msg) {
          this.serverRequest = $.get('/api/workspace/' + msg.id, function(result) {
              this.updateWorkspaces(); // this emits change
          }.bind(this));
      });

      this.dispatchToken = Dispatcher.register(action => {
          //  console.log(action);
          switch (action.actionType) {
              case ActionTypes.WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG:
                  this.newWorkspaceDialog.open = true;
                  this.emitChange();
                  break;
              case ActionTypes.WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG:
                  this.newWorkspaceDialog.open = false;
                  this.emitChange();
                  break;
              case ActionTypes.WORKSPACE_SUBMIT_NEW_WORKSPACE_DIALOG:
                  this.submitNewWorkspaceDialog(action.data);
                  //no change, because it will go only after the submission is successful
                  break;
              case ActionTypes.WORKSPACE_DELETE:
                  this.deleteWorkspace(action.workspaceID);
                  break;
              case ActionTypes.WORKSPACE_HISTORY_SHOW:
                  this.showHistory(action.workspaceID);
                  this.emitChange();
                  break;
              default:
                  return;
          }

      });
  }

  emitChange() {
    super.emitChange();
  }

  reset(){
    this.workspaces = null;
    this.newWorkspaceDialog = {
        open : false
    };
  }

  updateWorkspaces() {
    this.serverRequest = $.get('/api/workspaces', function(result) {
      this.workspaces = result;
      this.emitChange();
    }.bind(this));
  }

  showHistory(workspaceID) {
    this.serverRequest = $.get('/api/workspace/' + workspaceID + '/history', function(result) {
      console.log(result);
      this.emitChange();
    }.bind(this));
  }

  getWorkspaces() {
    if (this.workspaces) {
        return this.workspaces;
    } else {
        this.updateWorkspaces();
        return {};
    }
  }

  isWorkspaceNewDialogOpen() {
    return this.newWorkspaceDialog;
  }

  submitNewWorkspaceDialog(data) {
    $.ajax({
      type: 'POST',
      url: '/api/workspace/',
      dataType: 'json',
      data: data,
      success: function(data) {
        this.newWorkspaceDialog.open = false;
        this.newWorkspaceDialog.isSubmitDisabled = false;
        this.updateWorkspaces();
      }.bind(this)
    });
  }

  deleteWorkspace(workspaceID){
    $.ajax({
        type: 'DELETE',
        url: '/api/workspace/' + workspaceID,
        success: function(data2) {
            this.io.emit('workspace', {
                type: 'change',
                id: workspaceID
            });
            this.updateWorkspaces(); // this emits change
        }.bind(this)
    });
  }
}
