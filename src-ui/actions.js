/*jshint esversion: 6 */
import Dispatcher from './dispatcher';
var Constants = require('./constants');

export default class Actions {



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
