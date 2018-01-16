/*jshint esversion: 6 */

import Dispatcher from '../../../dispatcher';
import Constants from './form-a-submap-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
export default {

    openFormASubmapDialog(workspaceId, mapId, nodes, comments){
      if(!workspaceId || !mapId || !nodes || !nodes.length){
        console.error('No new node data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_FORM_A_SUBMAP_DIALOG,
          workspaceId : workspaceId,
          mapId : mapId,
          nodes : nodes,
          comments : comments
      });
    },

    closeFormASubmapDialog(mapId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_FORM_A_SUBMAP_DIALOG,
          mapId : mapId
      });
    },

    submitFormASubmapDialog(mapId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_FORM_A_SUBMAP_DIALOG,
          mapId : mapId
      });
    },

    handleDialogChange(mapId, param, value){
      if(value && value.target && value.target.value){
        value = value.target.value;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.FORM_A_SUBMAP_HANDLE_DIALOG_CHANGE,
          mapId : mapId,
          param:param,
          value:value
      });
    },

};
