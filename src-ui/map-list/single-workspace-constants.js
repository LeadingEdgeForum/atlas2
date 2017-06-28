/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      WORKSPACE_OPEN_EDIT_WORKSPACE_DIALOG : null,
      WORKSPACE_CLOSE_EDIT_WORKSPACE_DIALOG : null,
      WORKSPACE_SUBMIT_EDIT_WORKSPACE_DIALOG : null,
      WORKSPACE_OPEN_INVITE_DIALOG : null,
      WORKSPACE_CLOSE_INVITE_DIALOG : null,
      WORKSPACE_SUBMIT_INVITE_DIALOG : null,
      WORKSPACE_DELETE_USER : null,
      MAP_OPEN_NEW_MAP_DIALOG : null,
      MAP_CLOSE_NEW_MAP_DIALOG : null,
      MAP_CLOSE_SUBMIT_NEW_MAP_DIALOG : null,
      MAP_DELETE : null,
      CREATE_NEW_VARIANT : null,
      OPEN_NEW_VARIANT_DIALOG : null,
      CLOSE_NEW_VARIANT_DIALOG : null,
      OPEN_EDIT_VARIANT_DIALOG : null,
      CLOSE_EDIT_VARIANT_DIALOG : null,
      MODIFY_VARIANT : null,
      SET_VARIANT_AS_CURRENT : null
  }
});
