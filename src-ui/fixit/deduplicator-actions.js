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
}
