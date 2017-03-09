/*jshint esversion: 6 */
import Dispatcher from './dispatcher';
var Constants = require('./constants');
var CanvasConstants = require('./pages/workspace/maps/editor/canvas-constants');

export default class Actions {

  static openNewWorkspaceDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG});
  }

  static closeNewWorkspaceDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG});
  }

  static submitNewWorkspaceDialog(newWorkspaceData) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_SUBMIT_NEW_WORKSPACE_DIALOG, data: newWorkspaceData});
  }

  static openInviteNewUserMapDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_OPEN_INVITE_DIALOG});
  }

  static closeInviteNewUserDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_CLOSE_INVITE_DIALOG});
  }

  static closeNewGenericCommentDialog(){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CLOSE_NEW_GENERIC_COMMENT_DIALOG});
  }

  static submitNewGenericCommentDialog(data){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.SUBMIT_NEW_GENERIC_COMMENT_DIALOG, data:data});
  }

  static updateComment(workspaceID, mapID, id, pos, txt) {
      var x = pos.pos[0];
      var y = pos.pos[1];
      Dispatcher.dispatch({
          actionType: Constants.ACTION_TYPES.UPDATE_GENERIC_COMMENT,
          data: {
              workspaceID: workspaceID,
              mapID: mapID,
              coords: {
                  x: x,
                  y: y
              },
              comment: txt,
              commentID: id
          }
      });
  }

  static deleteComment(workspaceID, mapID, id) {
      Dispatcher.dispatch({
          actionType: Constants.ACTION_TYPES.DELETE_GENERIC_COMMENT,
          data: {
              workspaceID: workspaceID,
              mapID: mapID,
              commentID: id
          }
      });
  }

  static openEditGenericCommentDialog(workspaceID, mapID, id, txt) {
      Dispatcher.dispatch({
          actionType: Constants.ACTION_TYPES.OPEN_EDIT_GENERIC_COMMENT_DIALOG,
          data: {
              workspaceID: workspaceID,
              mapID: mapID,
              id: id,
              comment: txt
          }
      });
  }

  static closeEditGenericCommentDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CLOSE_EDIT_GENERIC_COMMENT_DIALOG});
  }

  static submitEditGenericCommentDialog(data){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.SUBMIT_EDIT_GENERIC_COMMENT_DIALOG, data:data});
  }

  static submitInviteNewUserDialog(data) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_SUBMIT_INVITE_DIALOG, data: data});
  }

  static deleteUser(data) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_DELETE_USER, data: data});
  }

  static openEditWorkspaceDialog(workspaceID) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_OPEN_EDIT_WORKSPACE_DIALOG, data: workspaceID});
  }

  static closeEditWorkspaceDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_CLOSE_EDIT_WORKSPACE_DIALOG});
  }

  static submitEditWorkspaceDialog(workspaceID, newWorkspaceData) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.WORKSPACE_SUBMIT_EDIT_WORKSPACE_DIALOG,
      data: {
        workspaceID: workspaceID,
        newWorkspaceData: newWorkspaceData
      }
    });
  }

  static openNewMapDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_OPEN_NEW_MAP_DIALOG});
  }

  static closeNewMapDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_NEW_MAP_DIALOG});
  }

  static submitNewMapDialog(data) {
    if(!(data.user && data.purpose)){
      throw new Exception('Bad payload for submitNewMapDialog, expected user and purpose, but got', data);
    }
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_SUBMIT_NEW_MAP_DIALOG, data: data});
  }

  static openEditMapDialog(mapid) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_OPEN_EDIT_MAP_DIALOG, data: mapid});
  }

  static closeEditMapDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_EDIT_MAP_DIALOG});
  }

  static submitEditMapDialog(data) {
    if(!( (data.user && data.purpose) || data.name)){
      throw new Error('Bad payload for submitEditMapDialog, got', data);
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_CLOSE_SUBMIT_EDIT_MAP_DIALOG,
      data: {
        mapID: data.map._id,
        workspaceID : data.workspaceID,
        mapData: {
          user: data.user,
          purpose: data.purpose,
          name : data.name,
          responsiblePerson : data.responsiblePerson
        }
      }
    });
  }

  static openEditNodeDialog(mapID, nodeID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_OPEN_EDIT_NODE_DIALOG,
      data: {
        mapID: mapID,
        nodeID: nodeID
      }
    });
  }

  static closeEditNodeDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_EDIT_NODE_DIALOG});
  }

  static submitEditNodeDialog(data) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_CLOSE_SUBMIT_EDIT_NODE_DIALOG,
      data: {
        mapID: data.map._id,
        nodeID: data.nodeID,
        workspaceID : data.workspaceID,
        params: {
          name: data.name,
          type: data.type,
          responsiblePerson : data.responsiblePerson,
          description : data.description,
          inertia : data.inertia
        }
      }
    });
  }

  static palletteDragStopped(type, mapID, data) {
    //cancel highlight of the canvas as the component was dropped and there is no reason to keep it highlighted anymore
    Dispatcher.dispatch({actionType: CanvasConstants.ACTION_TYPES.CANCEL_HIGHLIGHT_CANVAS_AS_DROP_TARGET});
    // process the drop
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.PALETTE_DRAG_STOPPED, type: type, data: data, mapID:mapID});
  }

  static closeNewNodeDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_NEW_NODE_DIALOG});
  }
  static newNodeCreated(data) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_SUBMIT_NEW_NODE_DIALOG, data: data});
  }

  static nodeDragged(workspaceID,mapID, nodeID, newPos) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_NODE_DRAGGED,
      data: {
        mapID: mapID,
        nodeID: nodeID,
        newPos: newPos,
        workspaceID : workspaceID
      }
    });
  }

  static recordConnection(workspaceID, mapID, sourceId, targetId) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_CONNECTION_CREATED,
      data: {
        mapID: mapID,
        sourceID: sourceId,
        targetID: targetId,
        workspaceID : workspaceID
      }
    });
  }

  static deleteConnection(workspaceID, mapID, sourceId, targetId) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_CONNECTION_DELETE,
      data: {
        mapID: mapID,
        workspaceID : workspaceID,
        sourceID: sourceId,
        targetID: targetId
      }
    });
  }

  static recordAction(workspaceID, mapID, sourceId, pos) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_ACTION_CREATED,
      data: {
        mapID: mapID,
        sourceID: sourceId,
        pos: pos,
        workspaceID : workspaceID
      }
    });
  }

  static updateAction(workspaceID, mapID, sourceId, seq, pos) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_ACTION_UPDATED,
      data: {
        mapID: mapID,
        sourceID: sourceId,
        pos: pos,
        seq: seq,
        workspaceID : workspaceID
      }
    });
  }

  static deleteAction(workspaceID, mapID, sourceId, seq) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_ACTION_DELETED,
      data: {
        mapID: mapID,
        sourceID: sourceId,
        seq: seq,
        workspaceID : workspaceID
      }
    });
  }

  static removeNode(workspaceID, mapID, nodeID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CANVAS_REMOVE_NODE,
      data: {
        workspaceID : workspaceID,
        mapID: mapID,
        nodeID: nodeID
      }
    });
  }

  static archiveMap(workspaceID, mapID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_ARCHIVE,
      data: {
        workspaceID: workspaceID,
        mapID: mapID
      }
    });
  }

  static archiveWorkspace(workspaceID) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.WORKSPACE_ARCHIVE, data: workspaceID});
  }

  static triggerEditingWorkspace(workspaceID) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.TRIGGER_WORKSPACE_EDIT, data: workspaceID});
  }

  static openCreateSubmapDialog(data){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.SHOW_SUBMAP_DIALOG,
      data: data
    });
  }

  static closeNewSubmapDialog() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.MAP_CLOSE_NEW_SUBMAP_DIALOG});
  }

  static createSubmap(workspaceID, name, responsiblePerson){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_SUBMAP,
      name : name,
      responsiblePerson : responsiblePerson,
      workspaceID : workspaceID
    });
  }

  static createReferencedSubmap(refMapID){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.MAP_REF_SUBMAP,
      refMapID : refMapID
    });
  }

  static openSubmapReferencesDialog(currentName, mapID, submapID, node, workspaceID){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.SHOW_REFERENCES_SUBMAP,
      currentName : currentName,
      mapID : mapID,
      submapID : submapID,
      node : node,
      workspaceID:workspaceID
    });
  }

  static closeSubmapReferencesDialog(){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CLOSE_REFERENCES_SUBMAP
    });
  }

  static openReferencesDialog(currentName, node, workspaceID){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.SHOW_REFERENCES,
      currentName : currentName,
      node : node,
      workspaceID : workspaceID
    });
  }

  static closeReferencesDialog(){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CLOSE_REFERENCES
    });
  }
}
