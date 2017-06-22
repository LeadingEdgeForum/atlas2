/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './deduplicator-constants';
import $ from 'jquery';

let ActionTypes = Constants.ACTION_TYPES;

/**
* This class is responsible for handling current selection in the canvas.
*/
class DeduplicatorStore extends Store {
  constructor(workspaceID) {
    super();
    this.workspaceID = workspaceID;
    this.state = {
        availableComponents : [],
        processedComponents : [],
        loadedAvailable : false,
        loadedProcessed : false,
        newCategoryDialogState : {open:false},
        editCategoryDialogState : {open:false},
        createMarketReferenceDialogState : {open:false},
        editMarketReferenceDialogState : {open:false}
    };
    this.dispatchToken = null;
    this.redispatch();
  }

  getNewCategoryDialogState(){
    return this.state.newCategoryDialogState;
  }

  getEditCategoryDialogState(){
    return this.state.editCategoryDialogState;
  }

  redispatch(){
    if(this.dispatchToken){
      return;
    }
    this.dispatchToken = Dispatcher.register(action => {
      switch (action.actionType) {

        case Constants.ACTION_TYPES.NEW_CAPABILITY:
          $.ajax({
            type: 'POST',
            url: '/api/workspace/' + action.data.workspaceID + '/capabilitycategory/' + action.data.capabilityCategoryID + '/node/' + action.data.nodeID,
            success: function(data2) {
              this.state.loadedAvailable = false;
              this.state.processedComponents = data2.workspace.capabilityCategories;
              this.emitChange();
            }.bind(this)
          });
          break;
        case Constants.ACTION_TYPES.DELETE_CAPABILITY:
            $.ajax({
              type: 'DELETE',
              url: '/api/workspace/' + action.data.workspaceID + '/capability/' + action.data.capabilityID,
              success: function(data2) {
                this.state.loadedAvailable = false;
                this.state.processedComponents = data2.workspace.capabilityCategories;
                this.emitChange();
              }.bind(this)
            });
            break;
        case Constants.ACTION_TYPES.ASSIGN_NODE_TO_CAPABILITY:
          $.ajax({
            type: 'PUT',
            url: '/api/workspace/' + action.data.workspaceID + '/capability/' + action.data.capabilityID + '/node/' + action.data.nodeID,
            success: function(data2) {
              this.state.loadedAvailable = false;
              this.state.processedComponents = data2.workspace.capabilityCategories;
              this.emitChange();
            }.bind(this)
          });
          break;
        case Constants.ACTION_TYPES.ASSIGN_NODE_TO_ALIAS:
          $.ajax({
            type: 'PUT',
            url: '/api/workspace/' + action.data.workspaceID + '/alias/' + action.data.aliasID + '/node/' + action.data.nodeID,
            success: function(data2) {
              this.state.loadedAvailable = false;
              this.state.processedComponents = data2.workspace.capabilityCategories;
              this.emitChange();
            }.bind(this)
          });
          break;
        case Constants.ACTION_TYPES.DELETE_CATEGORY:
          $.ajax({
            type: 'DELETE',
            url: '/api/workspace/' + action.data.workspaceID + '/capabilitycategory/' + action.data.capabilityCategoryID,
            success: function(data2) {
              this.state.loadedAvailable = false;
              this.state.processedComponents = data2.workspace.capabilityCategories;
              this.emitChange();
            }.bind(this)
          });
          break;
        case Constants.ACTION_TYPES.NEW_CATEGORY_OPEN_DIALOG:
          this.state.newCategoryDialogState = {open:true};
          this.emitChange();
        break;
        case Constants.ACTION_TYPES.NEW_CATEGORY_CLOSE_DIALOG:
          this.state.newCategoryDialogState = {open:false};
          this.emitChange();
        break;
        case Constants.ACTION_TYPES.NEW_CATEGORY_SUBMIT_DIALOG:
          $.ajax({
            type: 'POST',
            url: '/api/workspace/' + action.data.workspaceID + '/capabilitycategory/',
            data: {
              name: action.data.name
            },
            success: function(data2) {
              this.state.newCategoryDialogState = {
                open: false
              };
              this.state.loadedAvailable = false;
              this.state.processedComponents = data2.workspace.capabilityCategories;
              this.emitChange();
            }.bind(this)
          });
          break;

          case Constants.ACTION_TYPES.EDIT_CATEGORY_OPEN_DIALOG:
            this.state.editCategoryDialogState = {
              open: true,
              name: action.data.name,
              capabilityCategoryID: action.data.capabilityCategoryID,
              workspaceID: action.data.workspaceID
            };
            this.emitChange();
            break;
          case Constants.ACTION_TYPES.EDIT_CATEGORY_CLOSE_DIALOG:
            this.state.editCategoryDialogState = {
              open: false
            };
            this.emitChange();
            break;
          case Constants.ACTION_TYPES.EDIT_CATEGORY_SUBMIT_DIALOG:
            $.ajax({
              type: 'PUT',
              url: '/api/workspace/' + action.data.workspaceID + '/capabilitycategory/' + action.data.capabilityCategoryID,
              data: {
                name: action.data.name
              },
              success: function(data2) {
                this.state.editCategoryDialogState = {
                  open: false
                };
                this.state.loadedAvailable = false;
                this.state.processedComponents = data2.workspace.capabilityCategories;
                this.emitChange();
              }.bind(this)
            });
            break;


            case Constants.ACTION_TYPES.OPEN_CREATE_NEW_MARKET_REFERENCE_DIALOG:
              this.state.createMarketReferenceDialogState = {
                open: true,
                capability : action.data.capability
              };
              this.emitChange();
              break;
            case Constants.ACTION_TYPES.CLOSE_CREATE_NEW_MARKET_REFERENCE_DIALOG:
              this.state.createMarketReferenceDialogState = {
                open: false
              };
              this.emitChange();
              break;
            case Constants.ACTION_TYPES.SUBMIT_CREATE_NEW_MARKET_REFERENCE_DIALOG:
            $.ajax({
              type: 'POST',
              url: '/api/workspace/' + this.workspaceID + '/capability/' + action.data.capability._id + '/marketreference/',
              data : {
                name: action.data.name,
                description : action.data.description,
                evolution : action.data.evolution
              },
              success: function(data2) {
                this.state.loadedAvailable = false;
                this.state.processedComponents = data2.workspace.capabilityCategories;
                this.state.createMarketReferenceDialogState = {
                  open: false
                };
                this.emitChange();
              }.bind(this)
            });
            break;

            case Constants.ACTION_TYPES.OPEN_EDIT_NEW_MARKET_REFERENCE_DIALOG:
              this.state.editMarketReferenceDialogState = {
                open: true,
                workspaceId : action.data.workspaceId,
                capability : action.data.capability,
                marketReferenceId : action.data.marketreference._id,
                name : action.data.marketreference.name,
                description : action.data.marketreference.description,
                evolution : action.data.marketreference.evolution
              };
              this.emitChange();
              break;
            case Constants.ACTION_TYPES.CLOSE_EDIT_NEW_MARKET_REFERENCE_DIALOG:
              this.state.editMarketReferenceDialogState = {
                open: false
              };
              this.emitChange();
              break;
            case Constants.ACTION_TYPES.SUBMIT_EDIT_NEW_MARKET_REFERENCE_DIALOG:
              $.ajax({
                type: 'PUT',
                url: '/api/workspace/' + this.workspaceID + '/capability/' + action.data.capabilityId + '/marketreference/' + action.data.marketReferenceId,
                data : {
                  name: action.data.name,
                  description : action.data.description,
                  evolution : action.data.evolution
                },
                success: function(data2) {
                  this.state.loadedAvailable = false;
                  this.state.processedComponents = data2.workspace.capabilityCategories;
                  this.state.editMarketReferenceDialogState = {
                    open: false
                  };
                  this.emitChange();
                }.bind(this)
              });
            break;

            case Constants.ACTION_TYPES.DELETE_MARKET_REFERENCE:
            $.ajax({
              type: 'DELETE',
              url: '/api/workspace/' + this.workspaceID + '/capability/' + action.data.capabilityId + '/marketreference/' + action.data.marketReferenceId,
              success: function(data2) {
                this.state.loadedAvailable = false;
                this.state.processedComponents = data2.workspace.capabilityCategories;
                this.emitChange();
              }.bind(this)
            });
            break;
        default:
          return;
      }
    });
  }

  undispatch(){
    if(this.dispatchToken){
      Dispatcher.unregister(this.dispatchToken);
      this.dispatchToken = null;
    }
  }

  emitChange() {
    super.emitChange();
  }

  /**
    list of maps with unprocessed components
  */
  getAvailableComponents(variantId){
    if(!this.state.loadedAvailable){
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.workspaceID + '/components/' + variantId + '/unprocessed',
        dataType: 'json',
        success: function(data) {
          this.state.availableComponents = data.maps;
          this.emitChange();
        }.bind(this)
      });
      this.state.loadedAvailable = true;
    }
    return this.state.availableComponents;
  }

  getCapabilitiesForCurrentVariant(workspace, variantId){
    if(!workspace || !workspace.timeline || !workspace.timeline.length || !variantId){
      return [];
    }
    for(let i = 0; i < workspace.timeline.length; i++){
      if(workspace.timeline[i]._id === variantId){
        return workspace.timeline[i].capabilityCategories;
      }
    }
    return [];
  }

  /**
    list of maps with processed components
  */
  getProcessedComponents(variantId){
    if(!this.state.loadedProcessed){
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.workspaceID + '/components/' + variantId + '/processed',
        dataType: 'json',
        success: function(data) {
          this.state.processedComponents = this.getCapabilitiesForCurrentVariant(data.workspace, variantId);
          this.emitChange();
        }.bind(this)
      });
      this.state.loadedProcessed = true;
    }
    return {capabilityCategories : this.state.processedComponents};
  }

  getWorkspaceId(){
    return this.workspaceID;
  }

  getCreateMarketReferenceDialogState(){
    return this.state.createMarketReferenceDialogState;
  }

  getEditMarketReferenceDialogState(){
    return this.state.editMarketReferenceDialogState;
  }

}

export default DeduplicatorStore;
