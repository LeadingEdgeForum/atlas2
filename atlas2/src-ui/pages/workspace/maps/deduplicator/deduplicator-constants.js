/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STARTED : null,
      DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STOPPED : null,
      NEW_CAPABILITY : null,
      ASSIGN_NODE_TO_CAPABILITY : null,
      DELETE_CAPABILITY : null,
      // MAKE_NODES_REFERENCED : null,
  }
});
