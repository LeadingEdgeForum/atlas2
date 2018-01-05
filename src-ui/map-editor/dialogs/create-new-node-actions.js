/*jshint esversion: 6 */

import Dispatcher from '../../dispatcher';
import Constants from './create-new-node-constants';

const ACTION_TYPES = Constants.ACTION_TYPES;
export default {

    openAddNodeDialog(mapId, coords, type){
      if(!mapId || !coords || !type){
        console.error('No new node data, aborting...');
        return;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.OPEN_NEW_NODE_DIALOG,
          mapId : mapId,
          coords : coords,
          type : type
      });
    },

    closeAddNodeDialog(mapId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.CLOSE_NEW_NODE_DIALOG,
          mapId : mapId
      });
    },

    submitAddNewNodeDialog(mapId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.SUBMIT_ADD_NEW_NODE_DIALOG,
          mapId : mapId
      });
    },

    clearSuggestions(mapId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.NEW_NODE_CANCEL_FETCHING_SUGGESTIONS,
          mapId : mapId
      });
    },

    fetchSuggestions(mapId, query){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.NEW_NODE_FETCH_SUGGESTIONS,
          mapId : mapId,
          query:query
      });
    },

    handleDialogChange(mapId, param, value){
      if(value && value.target && value.target.value){
        value = value.target.value;
      }
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.NEW_NODE_HANDLE_DIALOG_CHANGE,
          mapId : mapId,
          param:param,
          value:value
      });
    },

    recordStepChange(mapId, step, selectedNodeId){
      Dispatcher.dispatch({
          actionType: ACTION_TYPES.NEW_NODE_RECORD_STEP_CHANGE,
          mapId : mapId,
          step:step,
          selectedNodeId:selectedNodeId
      });
    },

    referenceExistingNode(mapId, nodeId, visibility, dependenciesMode) {
      Dispatcher.dispatch({
        actionType: ACTION_TYPES.NEW_NODE_REFERENCE_EXISTING_NODE,
        mapId: mapId,
        nodeId: nodeId,
        dependenciesMode: dependenciesMode,
        visibility: visibility
      });
    }

};
