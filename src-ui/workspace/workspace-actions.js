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
    },

    showWorkspaceHistory : function(workspaceID){
      if(!workspaceID){
        console.error('workspaceID for deletion not specified');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_HISTORY_SHOW,
          workspaceID : workspaceID
      });
    }
};

module.exports = WorkspaceListActions;
