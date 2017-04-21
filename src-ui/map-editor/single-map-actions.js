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



    openAddCommentDialog :  function(data){
      console.error('implement me');
    },

    openAddSubmapDialog :  function(data){
      console.error('implement me');
    },

};

module.exports = SingleMapActions;
