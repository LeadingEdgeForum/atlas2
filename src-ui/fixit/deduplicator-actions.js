/*jshint esversion: 6 */
import Dispatcher from '../dispatcher';
var Constants = require('./deduplicator-constants');

export default class Actions {


  static createNewCapability(workspaceID, variantId, capabilityCategoryID, nodeID) {
    if(!workspaceID || !variantId || !capabilityCategoryID || !nodeID){
        console.log('none of those should be null: workspaceID, variantId, capabilityCategoryID, nodeID');
        return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CAPABILITY,
      data: {
        workspaceID: workspaceID,
        variantId : variantId,
        capabilityCategoryID: capabilityCategoryID,
        nodeID: nodeID
      }
    });
  }

  static assignNodeToCapability(workspaceID, variantId, capabilityID, nodeID) {
    if(!workspaceID || !variantId || !capabilityID || !nodeID){
        console.log('none of those should be null: workspaceID, variantId, capabilityID, nodeID');
        return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.ASSIGN_NODE_TO_CAPABILITY,
      data: {
        workspaceID: workspaceID,
        variantId : variantId,
        capabilityID: capabilityID,
        nodeID: nodeID
      }
    });
  }

  static assignNodeToAlias(workspaceID, variantId, aliasID, nodeID) {
    if(!workspaceID || !variantId || !aliasID || !nodeID){
        console.log('none of those should be null: workspaceID, variantId, aliasID, nodeID');
        return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.ASSIGN_NODE_TO_ALIAS,
      data: {
        workspaceID: workspaceID,
        variantId : variantId,
        aliasID: aliasID,
        nodeID: nodeID
      }
    });
  }

  static deleteCapability(workspaceID, variantId, capabilityID) {
    if(!workspaceID || !variantId || !capabilityID){
        console.log('none of those should be null: workspaceID, variantId, capabilityID');
        return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.DELETE_CAPABILITY,
      data: {
        capabilityID: capabilityID,
        variantId : variantId,
        workspaceID:workspaceID
      }
    });
  }

  static deleteCategory(workspaceID, variantId, capabilityCategoryID) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.DELETE_CATEGORY,
      data: {
        capabilityCategoryID: capabilityCategoryID,
        variantId : variantId,
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

  static submitEditCategoryDialog(workspaceID, variantId, capabilityCategoryID, name) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.EDIT_CATEGORY_SUBMIT_DIALOG,
      data: {
        workspaceID: workspaceID,
        variantId:variantId,
        capabilityCategoryID: capabilityCategoryID,
        name: name
      }
    });
  }

  static openNewCategoryDialog(workspaceID, variantId) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CATEGORY_OPEN_DIALOG,
      data: {
        workspaceID: workspaceID,
        variantId:variantId
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

  static submitNewCategoryDialog(workspaceID, variantId, name) {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.NEW_CATEGORY_SUBMIT_DIALOG,
      data: {
        workspaceID: workspaceID,
        variantId : variantId,
        name: name
      }
    });
  }


  static openAddMarketReferenceToCapabilityDialog(capability){
    if((!capability) || (!capability._id)){
      console.error('this capability should not be null');
      return null;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.OPEN_CREATE_NEW_MARKET_REFERENCE_DIALOG,
      data: {
          capability : capability
      }
    });
  }

  static closeAddMarketReferenceToCapabilityDialog(){
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CLOSE_CREATE_NEW_MARKET_REFERENCE_DIALOG
    });
  }

  static submitAddMarketReferenceToCapabilityDialog(variantId, capability, name, description, evolution){
    if((!capability) || (!capability._id)){
      console.error('this capability should not be null');
      return null;
    }
    if(!name ||  evolution === undefined ||  evolution === null){
      console.error('name and evolution should not be null');
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.SUBMIT_CREATE_NEW_MARKET_REFERENCE_DIALOG,
      data: {
          capability : capability,
          name : name,
          description : description,
          evolution : evolution,
          variantId : variantId
      }
    });
  }

  static openEditMarketReferenceDialog(workspaceId, capability, marketreference) {
    if (!workspaceId || !marketreference || !capability) {
      console.log('missing data', workspaceId, capability, marketreference);
      return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.OPEN_EDIT_NEW_MARKET_REFERENCE_DIALOG,
      data: {
        workspaceId: workspaceId,
        capability: capability,
        marketreference: marketreference
      }
    });
  }

  static closeEditMarketReferenceDialog() {
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.CLOSE_EDIT_NEW_MARKET_REFERENCE_DIALOG
    });
  }

  static submitEditMarketReferenceDialog(workspaceId, variantId, capabilityId, marketReferenceId, name, description, evolution) {
    if (!workspaceId || !variantId || !marketReferenceId || !capabilityId || !name || evolution === undefined || evolution === null) {
      console.log('missing data', workspaceId, variantId, capabilityId, marketReferenceId, name, evolution);
      return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.SUBMIT_EDIT_NEW_MARKET_REFERENCE_DIALOG,
      data: {
        workspaceId: workspaceId,
        variantId : variantId,
        capabilityId: capabilityId,
        marketReferenceId: marketReferenceId,
        name: name,
        description: description,
        evolution: evolution
      }
    });
  }

  static deleteMarketReference(workspaceId, variantId, capabilityId, marketReferenceId) {
    if (!workspaceId || !marketReferenceId || !capabilityId) {
      console.log('missing data', workspaceId, capabilityId, marketReferenceId);
      return;
    }
    Dispatcher.dispatch({
      actionType: Constants.ACTION_TYPES.DELETE_MARKET_REFERENCE,
      data: {
        workspaceId: workspaceId,
        variantId : variantId,
        capabilityId: capabilityId,
        marketReferenceId: marketReferenceId
      }
    });
  }

}
