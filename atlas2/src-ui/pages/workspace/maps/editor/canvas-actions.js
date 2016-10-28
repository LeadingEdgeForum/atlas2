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

  static focusNode(nodeID) {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.CANVAS_FOCUS_SINGLE_NODE, data: nodeID});
  }

}
