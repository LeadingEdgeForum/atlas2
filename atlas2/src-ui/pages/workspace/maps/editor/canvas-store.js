/*jshint esversion: 6 */

import Store from '../../../../store.js';
import Dispatcher from '../../../../dispatcher';
import Constants from './canvas-constants';
import $ from 'jquery';


/**
* This class is responsible for handling current selection in the canvas.
*/
class CanvasStore extends Store {
  constructor() {
    super();
    this.state = {
      currentlySelectedNodes : [],
      currentlySelectedConnections : [],
      dropTargetHighlight : false, // the canvas should highlight when pallette drag is initiated,
      initialized : false,
      coords : {
        offset: {
          top: 0,
          left: 0
        },
        size: {
          width: 1, //1 is just to avoid division by 0
          height: 1
        }
      }
    };
  }

  /**
    This works for newly created components
  */
  normalizeComponentCoord(params) { //normalizes the drop and opens the new node dialog
    let coords = this.state.coords;
    var relativeToCanvasPosX = params.pos[0]/*absolute pos of drop*/ - coords.offset.left/*absolute pos of canvas*/;
    var relativeToCanvasPosY = params.pos[1]/*absolute pos of drop*/ - coords.offset.top/*absolute pos of canvas*/;

    var universalCoordX = relativeToCanvasPosX / coords.size.width;
    var universalCoordY = relativeToCanvasPosY / coords.size.height;

    return { //coords
      x: universalCoordX,
      y: universalCoordY
    };
  }

  normalizeWidth(x){
    return x / this.state.coords.size.width;
  }

  normalizeHeight(y){
    return y / this.state.coords.size.height;
  }

  highlightCanvasAsDropTarget(highlight){
    this.state.dropTargetHighlight = highlight;
    this.emitChange();
  }

  getCanvasState(){
    return this.state;
  }

  emitChange() {
    super.emitChange();
  }
}

let canvasStoreInstance = new CanvasStore();

let ActionTypes = Constants.ACTION_TYPES;

canvasStoreInstance.dispatchToken = Dispatcher.register(action => {
  //  console.log(action);
  switch (action.actionType) {

    case ActionTypes.HIGHLIGHT_CANVAS_AS_DROP_TARGET:
      canvasStoreInstance.highlightCanvasAsDropTarget(true);
      return;
    case ActionTypes.CANCEL_HIGHLIGHT_CANVAS_AS_DROP_TARGET:
      canvasStoreInstance.highlightCanvasAsDropTarget(false);
      return;
    case ActionTypes.CANVAS_RESIZED:
      canvasStoreInstance.state.coords = action.data;
      canvasStoreInstance.state.initialized = true;
      canvasStoreInstance.emitChange();
      break;
    case ActionTypes.DESELECT_NODES_AND_CONNECTIONS:
      canvasStoreInstance.state.currentlySelectedNodes = [];
      canvasStoreInstance.state.currentlySelectedConnections = [];
      canvasStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS_FOCUS_SINGLE_NODE:
      canvasStoreInstance.state.currentlySelectedNodes = [];
      canvasStoreInstance.state.currentlySelectedNodes.push(action.data);
      canvasStoreInstance.state.currentlySelectedConnections = [];
      canvasStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS__ADD_FOCUS_SINGLE_NODE:
      canvasStoreInstance.state.currentlySelectedNodes.push(action.data);
      canvasStoreInstance.state.currentlySelectedConnections = [];
      canvasStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS_REMOVE_FOCUS_SINGLE_NODE:
      var pos = canvasStoreInstance.state.currentlySelectedNodes.indexOf(action.data);
      canvasStoreInstance.state.currentlySelectedNodes.splice(pos,1);
      canvasStoreInstance.state.currentlySelectedConnections = [];
      canvasStoreInstance.emitChange();
      break;
    default:
      return;
  }

});

export default canvasStoreInstance;
