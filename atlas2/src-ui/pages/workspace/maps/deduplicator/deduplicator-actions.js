/*jshint esversion: 6 */
import Dispatcher from '../../../../dispatcher';
var Constants = require('./canvas-constants');

export default class Actions {

  static highlightCanvas() {
    return Dispatcher.dispatch({actionType: Constants.ACTION_TYPES.HIGHLIGHT_CANVAS_AS_DROP_TARGET});
  }

}
