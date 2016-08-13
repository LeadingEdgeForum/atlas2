/*jshint esversion: 6 */

import Store from '../../store.js';
import Dispatcher from '../../dispatcher';
import Constants from '../../constants';
import $ from 'jquery';

let appState = {};
class WorkspaceStore extends Store {

  constructor() {
    super();
  }

  getState() {
    return appState;
  }

  reset() {
    appState = {};
  }
  emitChange() {
    super.emitChange();
  }

  getWorkspaces() {
    if (appState && appState.workspaces) {
      return appState.workspaces;
    } else {
      //load
      this.serverRequest = $.get('/api/workspaces', function(result) {
        appState.workspaces = result;
        this.emitChange();
      }.bind(this));
      return {
        workspaces: [
          {
            workspace: {
              id: "w1",
              name: "testworkspace"
            }
          }
        ]
      };
    }
  }

  isWorkspaceNewDialogOpen() {
    if (appState && appState.newWorkspaceDialog) {
      return appState.newWorkspaceDialog;
    } else {
      return {open: false};
    }
  }

}
let workspaceStoreInstance = new WorkspaceStore();

let ActionTypes = Constants.ACTION_TYPES;

workspaceStoreInstance.dispatchToken = Dispatcher.register(action => {
  console.log('act', action);
  switch (action.actionType) {
    case ActionTypes.WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG:
      appState.newWorkspaceDialog = {
        open: true
      };
      break;
    case ActionTypes.WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG:
      appState.newWorkspaceDialog = {
        open: false
      };
      break;
    default:
      return;
  }

  workspaceStoreInstance.emitChange();

});

export default workspaceStoreInstance;
