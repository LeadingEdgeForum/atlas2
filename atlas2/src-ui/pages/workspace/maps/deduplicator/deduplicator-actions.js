/*jshint esversion: 6 */
import Dispatcher from '../../../../dispatcher';
var Constants = require('./canvas-constants');

export default class Actions {

  static deduplicatorUnassignedComponentDragStarted() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STARTED});
  }

  static deduplicatorUnassignedComponentDragStopped() {
    Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STOPPED});
  }

}
