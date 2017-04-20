/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './single-workspace-constants';
import $ from 'jquery';
var io = require('socket.io-client')();

const ActionTypes = Constants.ACTION_TYPES;

export default class WorkspaceListStore extends Store {

  constructor(workspaceID) {
      super();
      this.workspaceID = workspaceID;
      this.workspace = null;

      this.editWorkspaceDialog = {
          open : false
      };

      this.inviteDialog = {
          open : false
      };

      this.newMapDialog = {
          open : false
      };

      this.io = require('socket.io-client')();

      this.io.on('workspacechange', function(msg) {
          this.serverRequest = $.get('/api/workspace/' + msg.id, function(result) {
              this.fetchSingleWorkspaceInfo(msg.id);
              this.updateWorkspaces(); // this emits change
          }.bind(this));
      });

      this.dispatchToken = Dispatcher.register(action => {
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
              default:
                  return;
          }

      });
  }

  emitChange() {
    super.emitChange();
  }

  updateWorkspaces() {
    this.serverRequest = $.get('/api/workspaces', function(result) {
      this.workspaces = result;
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

  getWorkspaceEditDialogState(){
    return this.editWorkspaceDialog;
  }
}
