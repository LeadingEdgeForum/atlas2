/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './canvas-constants';
import $ from 'jquery';
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

const ActionTypes = Constants.ACTION_TYPES;
const CANVAS_POSSE = "CANVAS_POSSE";
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
      currentlySelectedUsers : [],
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
      },
      nodeFontSize : 13,
      otherFontSize : 10,
      diffEnabled : false
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
          this.state.currentlySelectedUsers = [];
          jsPlumb.clearDragSelection();
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_SINGLE_NODE:
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedNodes.push(action.data);
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.state.currentlySelectedUsers = [];
          jsPlumb.clearDragSelection();
          jsPlumb.addToDragSelection(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS__ADD_FOCUS_SINGLE_NODE:
          this.state.currentlySelectedNodes.push(action.data);
          this.state.currentlySelectedConnections = [];
          jsPlumb.addToDragSelection(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_REMOVE_FOCUS_SINGLE_NODE:
          let nodePosToRemove = this.state.currentlySelectedNodes.indexOf(action.data);
          this.state.currentlySelectedNodes.splice(nodePosToRemove, 1);
          this.state.currentlySelectedConnections = [];
          jsPlumb.removeFromDragSelection(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_SINGLE_COMMENT:
          jsPlumb.clearDragSelection();
          jsPlumb.addToDragSelection(action.data);
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.state.currentlySelectedComments.push(action.data);
          this.state.currentlySelectedUsers = [];
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_ADD_COMMENT:
          jsPlumb.addToDragSelection(action.data);
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments.push(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_REMOVE_COMMENT:
          jsPlumb.removeFromDragSelection(action.data);
          let commentPosToRemove = this.state.currentlySelectedComments.indexOf(action.data);
          this.state.currentlySelectedComments.splice(commentPosToRemove, 1);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_SINGLE_USER:
          this.state.currentlySelectedNodes = [];
          this.state.currentlySelectedConnections = [];
          this.state.currentlySelectedComments = [];
          this.state.currentlySelectedUsers = [];
          this.state.currentlySelectedUsers.push(action.data);
          jsPlumb.clearDragSelection();
          jsPlumb.addToDragSelection(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_ADD_USER:
          this.state.currentlySelectedConnections = [];
          jsPlumb.addToDragSelection(action.data);
          this.state.currentlySelectedUsers.push(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_FOCUS_REMOVE_USER:
          let userPosToRemove = this.state.currentlySelectedUsers.indexOf(action.data);
          this.state.currentlySelectedUsers.splice(userPosToRemove, 1);
          jsPlumb.removeFromDragSelection(action.data);
          this.emitChange();
          break;
        case ActionTypes.CANVAS_INCREASE_NODE_FONT_SIZE:
          this.state.nodeFontSize ++;
          this.emitChange();
          break;
        case ActionTypes.CANVAS_DECREASE_NODE_FONT_SIZE:
          this.state.nodeFontSize --;
          this.emitChange();
          break;
        case ActionTypes.CANVAS_INCREASE_OTHER_FONT_SIZE:
            this.state.otherFontSize ++;
            this.emitChange();
            break;
        case ActionTypes.CANVAS_DECREASE_OTHER_FONT_SIZE:
            this.state.otherFontSize --;
            this.emitChange();
            break;
        default:
          return;
      }
    });
  }

  toggleDiff(){
    this.diffEnabled = !this.diffEnabled;
    this.emitChange();
  }

  isDiffEnabled(){
    return this.diffEnabled;
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

  getCanvasSize(){
    if(this.state && this.state.coords && this.state.coords.size){
      return {
        width: this.state.coords.size.width,
        height: this.state.coords.size.height
      };
    } else {
      return {
        width: 100,
        height: 100
      };
    }
  }

  getNodeFontSize(){
    return this.state.nodeFontSize;
  }

  getOtherFontSize(){
    return this.state.otherFontSize;
  }

  emitChange() {
    this.state.multiNodeSelection = this.state.currentlySelectedNodes.length + this.state.currentlySelectedComments.length > 1;
    super.emitChange();
  }
}
