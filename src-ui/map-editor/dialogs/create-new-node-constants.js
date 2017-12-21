/*jshint esversion: 6 */

var keyMirror = require('key-mirror-nested');

module.exports  = keyMirror({
  ACTION_TYPES : {

      OPEN_NEW_NODE_DIALOG : null,
      CLOSE_NEW_NODE_DIALOG : null,
      SUBMIT_ADD_NEW_NODE_DIALOG : null,

      NEW_NODE_FETCH_SUGGESTIONS : null,
      NEW_NODE_CANCEL_FETCHING_SUGGESTIONS : null,

      NEW_NODE_HANDLE_DIALOG_CHANGE : null,
      NEW_NODE_RECORD_STEP_CHANGE : null
  }
});
