/*jshint esversion: 6 */
import Dispatcher from '../../../../dispatcher';
var Constants = require('./canvas-constants');

export default class Actions {

  static highlightCanvas() {
    return Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.HIGHLIGHT_CANVAS_AS_DROP_TARGET});
  }

  static updateCanvasSizeAndOffset(data) {
     Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_RESIZED, data: data});
  }

  static deselectNodesAndConnections() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.DESELECT_NODES_AND_CONNECTIONS});
  }

  static deselectNode(nodeID){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_REMOVE_FOCUS_SINGLE_NODE, data: nodeID});
  }

  static focusAdditionalNode(nodeID){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS__ADD_FOCUS_SINGLE_NODE, data: nodeID});
  }

  static focusNode(nodeID) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_FOCUS_SINGLE_NODE, data: nodeID});
  }

  static focusComment(commentID){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_FOCUS_SINGLE_COMMENT, data: commentID});
  }

  static focusAddComment(commentID){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_FOCUS_ADD_COMMENT, data: commentID});
  }

  static focusRemoveComment(commentID){
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_FOCUS_REMOVE_COMMENT, data: commentID});
  }

}
