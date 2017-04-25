/*jshint esversion: 6 */

import Dispatcher from '../dispatcher';
import Constants from './workspace-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
var WorkspaceListActions = {

    openNewWorkspaceDialog: function() {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG
        });
    },

    closeNewWorkspaceDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG
      });
    },

    submitNewWorkspaceDialog: function(data) {
      if(!data){
        console.error('Missing new workspace data, aborting...');
        return;
      }
      if(!data.name || !data.purpose || !data.description){
        console.log('Incomplete new workspace data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_SUBMIT_NEW_WORKSPACE_DIALOG,
          data : data
      });
    },

    deleteWorkspace : function(workspaceID){
      if(!workspaceID){
        console.error('workspaceID for deletion not specified');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_DELETE,
          workspaceID : workspaceID
      });
    }
};

module.exports = WorkspaceListActions;
