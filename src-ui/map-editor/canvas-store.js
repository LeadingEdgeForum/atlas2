/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './canvas-constants';
import $ from 'jquery';


const ActionTypes = Constants.ACTION_TYPES;
/**
 * This class is responsible for handling current selection in the canvas.
 */
export default class CanvasStore extends Store {
  constructor() {
    super();
    this.state = {
      currentlySelectedNodes: [],
      currentlySelectedConnections: [],
      currentlySelectedComments: [],
      multiNodeSelection: false,
      dropTargetHighlight: false, // the canvas should highlight when pallette drag is initiated,
      initialized: false,
      coords: {
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
    this.dispatchToken = Dispatcher.register(action => {
      switch (action.actionType) {

        case ActionTypes.HIGHLIGHT_CANVAS_AS_DROP_TARGET:
          this.highlightCanvasAsDropTarget(true);
          return;
        case ActionTypes.CANCEL_HIGHLIGHT_CANVAS_AS_DROP_TARGET:
          this.highlightCanvasAsDropTarget(false);
          return;
        case ActionTypes.CANVAS_RESIZED:
          this.state.coords = action.data;
          this.state.initialized = true;
          this.emitChange();
          break;
        case ActionTypes.DESELECT_NODES_AND_CONNECTIONS:
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_SINGLE_NODE:
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedNodes.push(action.data);
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.emitChange();
          break;
        case ActionTypes.CANVAS__ADD_FOCUS_SINGLE_NODE:
          this.state.currentlySelectedNodes.push(action.data);
          this.state.currentlySelectedConnections = [];
          this.emitChange();
          break;
        case ActionTypes.CANVAS_REMOVE_FOCUS_SINGLE_NODE:
          var pos = this.state.currentlySelectedNodes.indexOf(action.data);
          this.state.currentlySelectedNodes.splice(pos, 1);
          this.state.currentlySelectedConnections = [];
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_SINGLE_COMMENT:
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.state.currentlySelectedComments.push(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_ADD_COMMENT:
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments.push(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_REMOVE_COMMENT:
          var pos = this.state.currentlySelectedComments.indexOf(action.data);
          this.state.currentlySelectedComments.splice(pos, 1);
          this.emitChange();
          break;
        default:
          return;
      }
    });
  }

  /**
    This works for newly created components
  */
  normalizeComponentCoord(params) { //normalizes the drop and opens the new node dialog
    if (!params) {
      console.error('No params specified');
      return null;
    }
    var x = null;
    var y = null;
    if(params.pos && Array.isArray(params.pos)){
      x = params.pos[0];
      y = params.pos[1];
    } else if(Array.isArray(params)){
      x = params[0];
      y = params[1];
    } else {
      x = params.x;
      y = params.y;
    }
    if(x === null || y === null){
      console.error('Could not normalize', params);
      return null;
    }
    let coords = this.state.coords;
    var relativeToCanvasPosX = x/*absolute pos of drop*/ - coords.offset.left /*absolute pos of canvas*/ ;
    var relativeToCanvasPosY = y /*absolute pos of drop*/ - coords.offset.top /*absolute pos of canvas*/ ;

    var universalCoordX = relativeToCanvasPosX / coords.size.width;
    var universalCoordY = relativeToCanvasPosY / coords.size.height;

    return { //coords
      x: universalCoordX,
      y: universalCoordY
    };
  }

  normalizeWidth(x) {
    return x / this.state.coords.size.width;
  }

  normalizeHeight(y) {
    return y / this.state.coords.size.height;
  }

  highlightCanvasAsDropTarget(highlight) {
    this.state.dropTargetHighlight = highlight;
    this.emitChange();
  }

  getCanvasState() {
    return this.state;
  }

  emitChange() {
    this.state.multiNodeSelection = this.state.currentlySelectedNodes.length + this.state.currentlySelectedComments.length > 1;
    super.emitChange();
  }
}
