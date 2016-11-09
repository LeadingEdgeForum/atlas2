/*jshint esversion: 6 */
import Dispatcher from '../../../../dispatcher';
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
  //
  // static clearNodeAssignement(workspaceID, mapID, nodeID) {
  //   Dispatcher.dispatch({
  //     actionType: Constants.ACTION_TYPES.CLEAR_NODE_ASSIGNEMENT,
  //     data: {
  //       workspaceID: workspaceID,
  //       mapID: mapID,
  //       nodeID: nodeID
  //     }
  //   });
  // }
  //
  // static makeNodesReferenced(workspaceID, nodeBeingAssignedMapID, nodeBeingAssignedID, referenceNodeID, referenceNodemapID) {
  //   Dispatcher.dispatch({
  //     actionType: Constants.ACTION_TYPES.MAKE_NODES_REFERENCED,
  //     data: {
  //       workspaceID: workspaceID,
  //       nodeBeingAssignedMapID: nodeBeingAssignedMapID,
  //       nodeBeingAssignedID: nodeBeingAssignedID,
  //       referenceNodeID: referenceNodeID,
  //       referenceMapID: referenceNodemapID
  //     }
  //   });
  // }
}
