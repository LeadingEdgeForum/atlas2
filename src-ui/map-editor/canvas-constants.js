/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      HIGHLIGHT_CANVAS_AS_DROP_TARGET : null,
      CANCEL_HIGHLIGHT_CANVAS_AS_DROP_TARGET : null,
      CANVAS_RESIZED : null,
      DESELECT_NODES_AND_CONNECTIONS : null,
      CANVAS_FOCUS_SINGLE_NODE : null,
      CANVAS_REMOVE_FOCUS_SINGLE_NODE : null,
      CANVAS__ADD_FOCUS_SINGLE_NODE : null,
      CANVAS_FOCUS_SINGLE_COMMENT : null,
      CANVAS_FOCUS_ADD_COMMENT : null,
      CANVAS_FOCUS_REMOVE_COMMENT : null,
      CANVAS_INCREASE_NODE_FONT_SIZE : null,
      CANVAS_DECREASE_NODE_FONT_SIZE : null
  }
});
