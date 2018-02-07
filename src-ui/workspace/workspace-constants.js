/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {
      WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG : null,
      WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG : null,
      WORKSPACE_SUBMIT_NEW_WORKSPACE_DIALOG : null,
      WORKSPACE_DELETE : null,
      WORKSPACE_HISTORY_SHOW : null
  }
});
