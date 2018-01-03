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
      if(  !data.mapID || !data.responsiblePerson ||
        !((data.user && data.purpose) || data.name)){
        console.log('Incomplete map data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_EDIT_MAP_DIALOG,
          data : data
      });
    },

    openAddNewUserDialog : function(coords, type){
      if(!coords){
        console.error('No new user data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_ADD_NEW_USER_DIALOG,
          coords : coords,
          type : type
      });
    },

    closeAddNewUserDialog : function(coords, type){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_ADD_NEW_USER_DIALOG
      });
    },

    submitAddNewUserDialog : function(data){
      console.log(data);
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_ADD_NEW_USER_DIALOG,
          data : data
      });
    },

    deleteUser: function(workspaceID, mapID, id) {
      if (!workspaceID || !mapID || !id) {
        console.error('missing data', workspaceID, mapID, id);
      }
      Dispatcher.dispatch({
        actionType: ACTION_TYPES.DELETE_USER,
        workspaceID: workspaceID,
        mapID: mapID,
        id: id,
      });
    },

    updateUser: function(workspaceID, mapID, id, name, description, pos /*{pos:[x,y]}*/, width){
      if(!workspaceID || !mapID || !id || ! ((pos && pos.x && pos.y) || width)){
        console.error('missing data', workspaceID, mapID, id, pos, width);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.UPDATE_USER,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            id: id,
            name : name,
            description : description,
            pos: pos,
            width:width
          }
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


    openCreateSubmapDialog: function(data) {
      if (!data.mapID || !data.nodes || !data.comments) {
        console.error('not enough of data to create a submap', data.mapId, data.nodes, data.comments);
        return;
      }
      Dispatcher.dispatch({
        actionType: ACTION_TYPES.OPEN_CREATE_SUBMAP_FROM_SELECTED_NODES_DIALOG,
        data: data
      });
    },

    openEditCommentDialog: function(workspaceID, mapID, id, text){
      if(!workspaceID || !mapID || !id || !text){
        console.error('missing data', workspaceID, mapID, id, text);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_EDIT_COMMENT_DIALOG,
          workspaceID : workspaceID,
          mapID : mapID,
          id : id,
          text : text
      });
    },

    closeEditCommentDialog: function(data){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_COMMENT_DIALOG
      });
    },

    submitEditGenericCommentDialog : function(data){
      if(!data || !data.id){
        console.error('missing id');
        return;
      }
      if(!data.text){
        console.error('missing data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_EDIT_COMMENT_DIALOG,
          data : data
      });
    },

    openEditUserDialog: function(workspaceID, mapID, id, name, description){
      if(!workspaceID || !mapID || !id || !name || !description){
        console.error('missing data', workspaceID, mapID, id, name, description);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_EDIT_USER_DIALOG,
          workspaceID : workspaceID,
          mapID : mapID,
          id : id,
          name : name,
          description : description
      });
    },

    closeEditUserDialog: function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_USER_DIALOG
      });
    },

    submitEditUserDialog : function(data){
      if(!data || !data.id){
        console.error('missing id');
        return;
      }
      if(!data.name || !data.description){
        console.error('missing data', data);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_EDIT_USER_DIALOG,
          data : data
      });
    },

    deleteComment: function(workspaceID, mapID, id){
      if(!workspaceID || !mapID || !id){
        console.error('missing data', workspaceID, mapID, id);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.DELETE_COMMENT,
          workspaceID : workspaceID,
          mapID : mapID,
          id : id,
      });
    },

    updateComment: function(workspaceID, mapID, id, pos /*{pos:[x,y]}*/, width){
      if(!workspaceID || !mapID || !id || ! ((pos && pos.x && pos.y) || width)){
        console.error('missing data', workspaceID, mapID, id, pos, width);
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.MOVE_COMMENT,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            id: id,
            pos: pos,
            width:width
          }
      });
    },

    recordAction : function(workspaceID, mapID, sourceId, pos /*{pos: [x, y]} */){
      if(!sourceId || !pos){
        console.error('missing data, aborting');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.RECORD_ACTION,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            sourceId: sourceId,
            pos: pos.pos
          }
      });
    },

    openEditActionDialog: function(workspaceID, mapID, sourceId, actionId, shortSummary, description){
      if(!sourceId || !actionId){
        console.error('no data to open the dialog');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_EDIT_ACTION_DIALOG,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            sourceId: sourceId,
            actionId: actionId,
            shortSummary:shortSummary,
            description:description
          }
      });
    },

    closeEditActionDialog: function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_ACTION_DIALOG,
      });
    },

    updateAction: function(workspaceID, mapID, sourceID, actionID, pos, shortSummary, description) {
      if(!actionID){
        console.error('missing action id');
        return;
      }
      if(!(pos || shortSummary || description)){
        console.error('missing action data', pos, shortSummary, description);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.UPDATE_ACTION,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            pos : pos ? pos.pos : null,
            sourceId: sourceID,
            actionId: actionID,
            shortSummary:shortSummary,
            description:description
          }
      });
    },

    deleteAction: function(workspaceID, mapID, sourceID, actionID){
      if(!sourceID || !actionID){
        console.error('missing data, aborting');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.DELETE_ACTION,
          data: {
            workspaceID: workspaceID,
            mapID: mapID,
            sourceId: sourceID,
            actionId: actionID
          }
      });
    },

    deleteNode: function(workspaceId, mapId, nodeId){
      if(!mapId || !nodeId){
        console.error('missing data, aborting');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.DELETE_NODE,
          data: {
            workspaceId: workspaceId,
            mapId: mapId,
            nodeId: nodeId
          }
      });
    },

    updateNode: function(workspaceId, mapId, nodeId, pos, width,
      name, type, person, inertia, description, constraint){
      if(!nodeId){
        console.error('missing node id');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.UPDATE_NODE,
          data: {
            workspaceId: workspaceId,
            mapId: mapId,
            nodeId :nodeId,
            pos : pos ? pos : null,
            width : width,
            name : name,
            type : type,
            person : person,
            inertia : inertia,
            description: description,
            constraint : constraint
          }
      });
    },

    openEditNodeDialog: function(mapID, nodeID){
      if(!mapID || !nodeID){
        console.error('unspecified node');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_EDIT_NODE_DIALOG,
          data : {
            nodeID : nodeID,
            mapID : mapID
          }
      });
    },

    closeEditNodeDialog:  function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_NODE_DIALOG
      });
    },

    recordConnection : function(workspaceId, mapId, sourceId, targetId){
      if(!workspaceId || !mapId || !sourceId || !targetId){
        console.error('not enough of data to create connection');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.RECORD_CONNECTION,
          data : {
            workspaceId : workspaceId,
            mapId : mapId,
            sourceId:sourceId,
            targetId:targetId
          }
      });
    },

    recordUserConnection : function(workspaceId, mapId, sourceId, targetId){
      if(!workspaceId || !mapId || !sourceId || !targetId){
        console.error('not enough of data to create connection');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.RECORD_USER_CONNECTION,
          data : {
            workspaceId : workspaceId,
            mapId : mapId,
            sourceId:sourceId,
            targetId:targetId
          }
      });
    },

    deleteUserConnection : function(workspaceId, mapId, sourceId, targetId){
      if(!workspaceId || !mapId || !sourceId || !targetId){
        console.error('not enough of data to create connection');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.DELETE_USER_CONNECTION,
          data : {
            workspaceId : workspaceId,
            mapId : mapId,
            sourceId:sourceId,
            targetId:targetId
          }
      });
    },

    openEditConnectionDialog: function(workspaceId, mapId, sourceId, targetId, label, description, connectionType){
      if(!sourceId || !targetId){
        console.error('no data to open the dialog');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_EDIT_CONNECTION_DIALOG,
          data: {
            workspaceId: workspaceId,
            mapId: mapId,
            sourceId: sourceId,
            targetId: targetId,
            label:label,
            description:description,
            connectionType:connectionType
          }
      });
    },

    closeEditConnectionDialog: function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_EDIT_CONNECTION_DIALOG,
      });
    },

    updateConnection: function(workspaceId, mapId, sourceId, targetId, label, description, connectionType) {
      if(!sourceId || !targetId){
        console.error('no data to open the dialog');
        return;
      }
      if(!(connectionType !== undefined || label || description)){
        console.warn('missing connection data', connectionType, label, description);
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.UPDATE_CONNECTION,
          data: {
            workspaceId: workspaceId,
            mapId: mapId,
            sourceId: sourceId,
            targetId: targetId,
            label:label,
            description:description,
            connectionType:connectionType
          }
      });
    },

    deleteConnection : function(workspaceId, mapId, sourceId, targetId){
      if(!workspaceId || !mapId || !sourceId || !targetId){
        console.error('not enough of data to create connection');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.DELETE_CONNECTION,
          data : {
            workspaceId : workspaceId,
            mapId : mapId,
            sourceId:sourceId,
            targetId:targetId
          }
      });
    },

    openSubmapReferencesDialog: function(currentName, mapID, submapID, node, workspaceID, variantId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SHOW_SUBMAP_REFERENCES,
          data : {
            currentName: currentName,
            mapID:mapID,
            submapID:submapID,
            node :node,
            workspaceID:workspaceID,
            variantId : variantId
          }
      });
    },

    closeSubmapReferencesDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_SUBMAP_REFERENCES,
      });
    },

    openReferencesDialog: function(currentName, node, workspaceID, variantId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SHOW_REFERENCES,
          data : {
            currentName: currentName,
            node:node,
            workspaceID:workspaceID,
            variantId : variantId
          }
      });
    },

    closeReferencesDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_REFERENCES,
      });
    },


    openTurnIntoSubmapNodeDialog : function(workspaceId, mapId, nodeId){
      if(!workspaceId || !mapId || !nodeId){
        console.error('not enough of data to create a submap');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_TURN_INTO_SUBMAP,
          workspaceId : workspaceId,
          mapId : mapId,
          nodeId : nodeId
      });
    },

    closeTurnIntoSubmapNodeDialog : function(){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_TURN_INTO_SUBMAP,
      });
    },

    turnIntoSubmap : function(workspaceId, mapId, nodeId, refId){
      if(!workspaceId || !mapId || !nodeId){
        console.error('not enough of data to create a submap');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_TURN_INTO_SUBMAP,
          workspaceId : workspaceId,
          mapId : mapId,
          nodeId : nodeId,
          refId : refId
      });
    },

};

module.exports = SingleMapActions;
