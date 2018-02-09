/*jshint esversion: 6 */

import Dispatcher from '../../../dispatcher';
import Constants from './new-action-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
export default {

  openAddActionDialog: function(mapId, sourceId, posObject) {
    Dispatcher.dispatch({
      actionType: ACTION_TYPES.OPEN_ADD_ACTION_DIALOG,
      mapId: mapId,
      sourceId: sourceId,
      pos: posObject.pos
    });
  },

  closeAddActionDialog: function(mapId) {
    Dispatcher.dispatch({
      actionType: ACTION_TYPES.CLOSE_ADD_ACTION_DIALOG,
      mapId: mapId
    });
  },

  submitAddActionDialog : function(mapId){
    Dispatcher.dispatch({
        actionType: ACTION_TYPES.SUBMIT_ADD_ACTION_DIALOG,
        mapId: mapId
    });
  },

  handleDialogChange(mapId, param, value){
    if(value && value.target && value.target.value){
      value = value.target.value;
    }
    Dispatcher.dispatch({
        actionType: ACTION_TYPES.NEW_ACTION_HANDLE_DIALOG_CHANGE,
        mapId : mapId,
        param:param,
        value:value
    });
  },

};
