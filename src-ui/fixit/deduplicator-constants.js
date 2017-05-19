/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STARTED : null,
      DEDUPLICATOR_UNASSIGNED_COMPONENT_DRAG_STOPPED : null,
      NEW_CAPABILITY : null,
      ASSIGN_NODE_TO_CAPABILITY : null,
      DELETE_CAPABILITY : null,
      ASSIGN_NODE_TO_ALIAS : null,
      DELETE_CATEGORY : null,
      NEW_CATEGORY_OPEN_DIALOG : null,
      NEW_CATEGORY_CLOSE_DIALOG : null,
      NEW_CATEGORY_SUBMIT_DIALOG : null,
      EDIT_CATEGORY_OPEN_DIALOG : null,
      EDIT_CATEGORY_CLOSE_DIALOG : null,
      EDIT_CATEGORY_SUBMIT_DIALOG : null
  }
});
