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
              this.emitChange();
          }.bind(this));
      });

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
                  this.submitNewWorkspaceDialog(action.data);
                  //no change, because it will go only after the submission is successful
                  break;
              case ActionTypes.MAP_DELETE:
                  this.deleteMap(action.workspaceID);
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
                  console.error('not implemented');
                  //no change, because it will go only after the submission is successful
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
                  console.error('not implemented');
                  //no change, because it will go only after the submission is successful
                  break;
              default:
                  return;
          }
      });
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
}
