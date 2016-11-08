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
        loaded : false
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
    console.log(this.state);
    if(!this.state.loaded){
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.workspaceID + '/components',
        dataType: 'json',
        success: function(data) {
          this.state.availableComponents = data.maps;
          this.emitChange();
        }.bind(this)
      });
      this.state.loaded = true;
    }
    return this.state.availableComponents;
  }
}

export default DeduplicatorStore;
