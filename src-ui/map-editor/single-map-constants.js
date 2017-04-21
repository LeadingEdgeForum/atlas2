/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      OPEN_EDIT_MAP_DIALOG : null,
      CLOSE_EDIT_MAP_DIALOG : null,
      SUBMIT_EDIT_MAP_DIALOG : null,

      OPEN_NEW_NODE_DIALOG : null,
      CLOSE_NEW_NODE_DIALOG : null,
      SUBMIT_NEW_NODE_DIALOG : null,

      OPEN_ADD_COMMENT_DIALOG : null,
      CLOSE_ADD_COMMENT_DIALOG : null,
      SUBMIT_ADD_COMMENT_DIALOG : null,

      OPEN_ADD_SUBMAP_DIALOG : null,
      CLOSE_ADD_SUBMAP_DIALOG : null,
      SUBMIT_ADD_SUBMAP_DIALOG : null,
      SUBMIT_ADD_REFERENCED_SUBMAP : null,

      OPEN_EDIT_COMMENT_DIALOG : null,
      CLOSE_EDIT_COMMENT_DIALOG : null,
      SUBMIT_EDIT_COMMENT_DIALOG : null,
      MOVE_COMMENT : null,
      DELETE_COMMENT : null

  }
});
