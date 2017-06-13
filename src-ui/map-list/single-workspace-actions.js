/*jshint esversion: 6 */

import Dispatcher from '../dispatcher';
import Constants from './single-workspace-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
var SingleWorkspaceActions = {

    openEditWorkspaceDialog: function() {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.WORKSPACE_OPEN_EDIT_WORKSPACE_DIALOG
        });
    },

    closeEditWorkspaceDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_CLOSE_EDIT_WORKSPACE_DIALOG
      });
    },

    submitEditWorkspaceDialog: function(workspaceID, data) {
      if(!workspaceID){
        console.error('No workspace id');
        return;
      }
      if(!data){
        console.error('Missing workspace data, aborting...');
        return;
      }
      if(!data.name || !data.purpose || !data.description){
        console.log('Incomplete workspace data', data);
      }
      data.workspaceID = workspaceID;
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_SUBMIT_EDIT_WORKSPACE_DIALOG,
          data : data
      });
    },


    openInviteDialog: function() {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.WORKSPACE_OPEN_INVITE_DIALOG
        });
    },

    closeInviteDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_CLOSE_INVITE_DIALOG
      });
    },

    submitInviteDialog: function(data) {
      if(!data || !data.email){
        console.error('unspecified user email', data);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_SUBMIT_INVITE_DIALOG,
          data : data
      });
    },

    deleteInvitedEditor : function(data){
      console.log('deleting', data);
      if(!data || !data.email){
        console.error('unspecified user email', data);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.WORKSPACE_DELETE_USER,
          data : data
      });
    },

    openNewMapDialog: function() {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.MAP_OPEN_NEW_MAP_DIALOG
        });
    },

    closeNewMapDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.MAP_CLOSE_NEW_MAP_DIALOG
      });
    },

    submitNewMapDialog: function(data) {
      if(!data){
        console.error('Missing new map data, aborting...');
        return;
      }
      if(!data.user || !data.purpose || !data.responsiblePerson){
        console.log('Incomplete new workspace data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.MAP_CLOSE_SUBMIT_NEW_MAP_DIALOG,
          data : data
      });
    },

    deleteMap : function(data){
      if(!data || !data.mapID){
        console.error('Missing delete map data, aborting...', data);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.MAP_DELETE,
          data : data
      });
    },

    createNewVariant: function(sourceTimeSliceId) {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.CREATE_NEW_VARIANT,
            data : {
              sourceTimeSliceId : sourceTimeSliceId || null
            }
        });
    },


};

module.exports = SingleWorkspaceActions;
