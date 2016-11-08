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
    // this.dispatchToken = Dispatcher.register(action => {
    //   switch (action.actionType) {
    //
    //     case ActionTypes.HIGHLIGHT_CANVAS_AS_DROP_TARGET:
    //       // canvasStoreInstance.highlightCanvasAsDropTarget(true);
    //       return;
    //     default:
    //       return;
    //   }
    // });
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
          this.state.processedComponents = [];
          this.emitChange();
        }.bind(this)
      });
      this.state.loadedProcessed = true;
    }
    return this.state.processedComponents;
  }
}

export default DeduplicatorStore;
