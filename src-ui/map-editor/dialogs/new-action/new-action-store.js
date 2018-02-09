/* Copyright 2017  Krzysztof Daniel.
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

import Store from '../../../store.js';
import Dispatcher from '../../../dispatcher';
import Constants from './new-action-constants';
import $ from 'jquery';

const ActionTypes = Constants.ACTION_TYPES;

export default class NewActionStore extends Store {

  constructor(workspaceId, mapId, singleMapStore) {
      super();

      this.openNewActionDialog = this.openNewActionDialog.bind(this);
      this.closeNewActionDialog = this.closeNewActionDialog.bind(this);
      this.submitAddActionDialog = this.submitAddActionDialog.bind(this);
      this.updateParam = this.updateParam.bind(this);
      this.redispatch = this.redispatch.bind(this);
      this.undispatch = this.undispatch.bind(this);
      this.emitChange = this.emitChange.bind(this);

      this.dispatchToken = null;
      this.state = {
        shortSummary : "",
        description : "",
        type : null,
        open : false,
        pos : null,
        workspaceId:workspaceId,
        mapId:mapId,
      };
      this.mapId = mapId;
      this.singleMapStore = singleMapStore;
      this.redispatch();
  }

  redispatch(){
    if(this.dispatchToken){
      return;
    }
    this.dispatchToken = Dispatcher.register(action => {
      switch (action.actionType) {
        case ActionTypes.OPEN_ADD_ACTION_DIALOG:
          this.openNewActionDialog(action.mapId, action.sourceId, action.pos);
          break;
        case ActionTypes.CLOSE_ADD_ACTION_DIALOG:
          this.closeNewActionDialog(action.mapId);
          break;
        case ActionTypes.SUBMIT_ADD_ACTION_DIALOG:
          this.submitAddActionDialog(action.mapId);
          break;
        case ActionTypes.NEW_ACTION_HANDLE_DIALOG_CHANGE:
          this.updateParam(action.mapId, action.param, action.value);
          break;
        default:
          return;
      }
    });
  }

  undispatch(){
    if(this.dispatchToken){
      Dispatcher.unregister(this.dispatchToken);
      this.dispatchToken = null;
    }
  }

  emitChange() {
    super.emitChange();
  }

  getState() {
    return this.state;
  }

  openNewActionDialog(mapId, sourceId, pos){
    if(mapId === this.mapId){
      this.state.open = true;
      this.state.pos = pos;
      this.state.sourceId = sourceId;
      this.state.shortSummary = "";
      this.state.description = "";
      this.emitChange();
    }
  }

  closeNewActionDialog(mapId){
    if(mapId === this.mapId){
      this.state.open = false;
      delete this.state.pos;
      delete this.state.type;
      delete this.state.sourceId;
      this.state.shortSummary = "";
      this.state.description = "";
      this.emitChange();
    }
  }

  updateParam(mapId, param, value) {
    if (mapId !== this.mapId) {
      return;
    }
    this.state[param] = value;
    this.emitChange();
  }



  submitAddActionDialog(mapId){
    if (mapId !== this.mapId) {
      return;
    }
    $.ajax({
      type: 'POST',
      url: '/api/workspace/' + this.workspaceId + '/map/' + this.mapId + '/node/' + this.state.sourceId + '/effort',
      data: {
        shortSummary:  this.state.shortSummary,
        description : this.state.description,
        type: this.state.type ? this.state.type : 'EFFORT',
        x: this.state.pos[0],
        y: this.state.pos[1]
      },
      success: function(data) {
        this.closeNewActionDialog(mapId);
        this.singleMapStore.updateMap(mapId, data);
        this.emitChange();
      }.bind(this)
    });
  }
}
