/*jshint esversion: 6 */

import Store from '../../../../store.js';
import Dispatcher from '../../../../dispatcher';
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
        loadedProcessed : false
    };
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
        default:
          return;
      }
    });
  }

  emitChange() {
    super.emitChange();
  }

  /**
    list of maps with unprocessed components
  */
  getAvailableComponents(){
    if(!this.state.loadedAvailable){
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.workspaceID + '/components/unprocessed',
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

  /**
    list of maps with processed components
  */
  getProcessedComponents(){
    if(!this.state.loadedProcessed){
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.workspaceID + '/components/processed',
        dataType: 'json',
        success: function(data) {
          this.state.processedComponents = data.workspace.capabilityCategories;
          this.emitChange();
        }.bind(this)
      });
      this.state.loadedProcessed = true;
    }
    return {capabilityCategories : this.state.processedComponents};
  }
}

export default DeduplicatorStore;
