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

    submitNewVariantDialog: function(sourceTimeSliceId, name, description) {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.CREATE_NEW_VARIANT,
            data : {
              sourceTimeSliceId : sourceTimeSliceId || null,
              name : name,
              description: description
            }
        });
    },

    openNewVariantDialog: function(sourceTimeSliceId) {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.OPEN_NEW_VARIANT_DIALOG,
            data : {
              sourceTimeSliceId : sourceTimeSliceId || null
            }
        });
    },

    closeNewVariantDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_NEW_VARIANT_DIALOG
      });
    },

    submitEditVariantDialog: function(sourceTimeSliceId, name, description) {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.MODIFY_VARIANT,
            data : {
              sourceTimeSliceId : sourceTimeSliceId || null,
              name : name,
              description: description
            }
        });
    },

    openEditVariantDialog: function(sourceTimeSliceId) {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.OPEN_EDIT_VARIANT_DIALOG,
            data : {
              sourceTimeSliceId : sourceTimeSliceId || null
            }
        });
    },

    closeEditVariantDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_VARIANT_DIALOG
      });
    },

    setVariantAsCurrent: function(sourceTimeSliceId) {
      if(!sourceTimeSliceId) {
        console.log('ignoring because of empty sourceTimeSliceId');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SET_VARIANT_AS_CURRENT,
          data : {
            sourceTimeSliceId : sourceTimeSliceId,
            current : true
          }
      });
    },

    uploadAMap : function (workspaceId, mapJSON){
      if(!workspaceId || !mapJSON) {
        console.log('ignoring because of empty',workspaceId, mapJSON);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.UPLOAD_A_MAP,
          data : {
            workspaceId : workspaceId,
            mapJSON : mapJSON
          }
      });
    }
};

module.exports = SingleWorkspaceActions;
