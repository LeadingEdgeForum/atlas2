/* Copyright 2016,2018 Krzysztof Daniel.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
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
      pos: posObject.pos,
      type: "EFFORT"
    });
  },

  openAddActionReplacementDialog : function(workspaceId, mapId, sourceId, targetId){
    Dispatcher.dispatch({
      actionType: ACTION_TYPES.OPEN_ADD_ACTION_DIALOG,
      workspaceId:workspaceId,
      mapId: mapId,
      sourceId: sourceId,
      targetId: targetId,
      type: "REPLACEMENT"
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
