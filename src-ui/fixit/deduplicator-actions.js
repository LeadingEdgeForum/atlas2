/*jshint esversion: 6 */
import Dispatcher from '../dispatcher';
var Constants = require('./deduplicator-constants');

export default class Actions {


  static createNewCapability(workspaceID, capabilityCategoryID, nodeID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CAPABILITY,
      data: {
        workspaceID: workspaceID,
        capabilityCategoryID: capabilityCategoryID,
        nodeID: nodeID
      }
    });
  }

  static assignNodeToCapability(workspaceID, capabilityID, nodeID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.ASSIGN_NODE_TO_CAPABILITY,
      data: {
        workspaceID: workspaceID,
        capabilityID: capabilityID,
        nodeID: nodeID
      }
    });
  }

  static assignNodeToAlias(workspaceID, aliasID, nodeID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.ASSIGN_NODE_TO_ALIAS,
      data: {
        workspaceID: workspaceID,
        aliasID: aliasID,
        nodeID: nodeID
      }
    });
  }

  static deleteCapability(workspaceID, capabilityID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.DELETE_CAPABILITY,
      data: {
        capabilityID: capabilityID,
        workspaceID:workspaceID
      }
    });
  }

  static deleteCategory(workspaceID, capabilityCategoryID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.DELETE_CATEGORY,
      data: {
        capabilityCategoryID: capabilityCategoryID,
        workspaceID: workspaceID
      }
    });
  }

  static openEditCategoryDialog(workspaceID, capabilityCategoryID, name) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.EDIT_CATEGORY_OPEN_DIALOG,
      data: {
        workspaceID: workspaceID,
        capabilityCategoryID: capabilityCategoryID,
        name: name
      }
    });
  }

  static closeEditCategoryDialog(workspaceID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.EDIT_CATEGORY_CLOSE_DIALOG,
      data: {
        workspaceID: workspaceID
      }
    });
  }

  static submitEditCategoryDialog(workspaceID, capabilityCategoryID, name) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.EDIT_CATEGORY_SUBMIT_DIALOG,
      data: {
        workspaceID: workspaceID,
        capabilityCategoryID: capabilityCategoryID,
        name: name
      }
    });
  }

  static openNewCategoryDialog(workspaceID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CATEGORY_OPEN_DIALOG,
      data: {
        workspaceID: workspaceID
      }
    });
  }

  static closeNewCategoryDialog(workspaceID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CATEGORY_CLOSE_DIALOG,
      data: {
        workspaceID: workspaceID
      }
    });
  }

  static submitNewCategoryDialog(workspaceID, name) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CATEGORY_SUBMIT_DIALOG,
      data: {
        workspaceID: workspaceID,
        name: name
      }
    });
  }

}
