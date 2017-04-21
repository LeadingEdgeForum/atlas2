/*jshint esversion: 6 */

import Dispatcher from '../dispatcher';
import Constants from './single-map-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
var SingleMapActions = {

    openEditMapDialog: function() {
        Dispatcher.dispatch({
            actionType: ACTION_TYPES.OPEN_EDIT_MAP_DIALOG
        });
    },

    closeEditMapDialog: function() {
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_MAP_DIALOG
      });
    },

    submitEditMapDialog: function(data) {
      if(!data){
        console.error('No map data, aborting...');
        return;
      }
      if(  !data.mapID
        || !data.responsiblePerson
        || !((data.user && data.purpose) || data.name)){
        console.log('Incomplete map data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_EDIT_MAP_DIALOG,
          data : data
      });
    },

    openAddNodeDialog : function(coords, type){
      if(!coords || !type){
        console.error('No new node data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_NEW_NODE_DIALOG,
          coords : coords,
          type : type
      });
    },

    closeAddNodeDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_NEW_NODE_DIALOG
      });
    },

    submitAddNodeDialog : function(data){
      if(!data){
        console.error('missing data, aborting...');
        return;
      }
      if(!data.coords || !data.type){
        console.error('incomplete data, aborting', data);
        return;
      }
      if(!data.name || !data.responsiblePerson || !data.inertia || !data.description){
        console.error('incomplete data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_NEW_NODE_DIALOG,
          data : data
      });
    },

    openAddCommentDialog(coords, type){
      if(!coords || !type){
        console.error('No new node data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_ADD_COMMENT_DIALOG,
          coords : coords,
          type : type
      });
    },

    closeAddCommentDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_ADD_COMMENT_DIALOG
      });
    },

    submitAddCommentDialog : function(data){
      if(!data){
        console.error('missing data, aborting...');
        return;
      }
      if(!data.coords){
        console.error('incomplete data, aborting', data);
        return;
      }
      if(!data.comment){
        console.error('incomplete data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_ADD_COMMENT_DIALOG,
          data : data
      });
    },

    openAddSubmapDialog(coords, type){
      if(!coords || !type){
        console.error('No new submap data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_ADD_SUBMAP_DIALOG,
          coords : coords,
          type : type
      });
    },

    closeAddSubmapDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_ADD_SUBMAP_DIALOG
      });
    },

    submitAddSubmapDialog : function(data){
      if(!data){
        console.error('missing data, aborting...');
        return;
      }
      if(!data.coords || !data.name || !data.responsiblePerson){
        console.error('incomplete data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_ADD_SUBMAP_DIALOG,
          data : data
      });
    },

    // a reference to existing submap is added
    createReferencedSubmap : function(refID, coords){
      if(!refID || !coords){
        console.error('missing data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_ADD_REFERENCED_SUBMAP,
          refID : refID,
          coords : coords
      });
    },

    recordConnection : function(data){
      console.error('implement me');
    },

    deleteConnection : function(data){
      console.error('implement me');
    },

    recordAction : function(data){
      console.error('implement me');
    },

    deleteAction: function(data){
      console.error('implement me');
    },

    deleteComment: function(data){
      console.error('implement me');
    },

    updateComment: function(data){
      console.error('implement me');
    },

    openEditGenericCommentDialog: function(data){
      console.error('implement me');
    },

    openCreateSubmapDialog: function(data){
      console.error('implement me');
    },

    openEditActionDialog: function(data){
      console.error('implement me');
    },

    removeNode: function(data){
      console.error('implement me');
    },

    openEditNodeDialog: function(data){
      console.error('implement me');
    },

    openSubmapReferencesDialog: function(data){
      console.error('implement me');
    },

    openReferencesDialog: function(data){
      console.error('implement me');
    },

    updateAction: function(data){
      console.error('implement me');
    },

};

module.exports = SingleMapActions;
