/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      OPEN_EDIT_MAP_DIALOG : null,
      CLOSE_EDIT_MAP_DIALOG : null,
      SUBMIT_EDIT_MAP_DIALOG : null,

      OPEN_EDIT_NODE_DIALOG : null,
      CLOSE_EDIT_NODE_DIALOG : null,
      DELETE_NODE : null,
      UPDATE_NODE : null,

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
      DELETE_COMMENT : null,

      OPEN_EDIT_ACTION_DIALOG : null,
      CLOSE_EDIT_ACTION_DIALOG : null,
      UPDATE_ACTION : null,
      DELETE_ACTION : null,

      RECORD_CONNECTION : null,
      OPEN_EDIT_CONNECTION_DIALOG : null,
      CLOSE_EDIT_CONNECTION_DIALOG : null,
      UPDATE_CONNECTION : null,
      DELETE_CONNECTION : null,

      SHOW_REFERENCES : null,
      CLOSE_REFERENCES : null,

      OPEN_TURN_INTO_SUBMAP : null,
      CLOSE_TURN_INTO_SUBMAP : null,
      SUBMIT_TURN_INTO_SUBMAP : null,

      OPEN_ADD_NEW_USER_DIALOG : null,
      CLOSE_ADD_NEW_USER_DIALOG : null,
      SUBMIT_ADD_NEW_USER_DIALOG : null,
      OPEN_EDIT_USER_DIALOG : null,
      CLOSE_EDIT_USER_DIALOG : null,
      SUBMIT_EDIT_USER_DIALOG : null,
      DELETE_USER : null,
      UPDATE_USER : null,
      RECORD_USER_CONNECTION : null,
      DELETE_USER_CONNECTION : null,

      RECORD_EFFORT_REPLACEMENT : null
  }
});
