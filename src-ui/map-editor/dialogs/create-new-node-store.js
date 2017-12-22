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

import Store from '../../store.js';
import Dispatcher from '../../dispatcher';
import Constants from './create-new-node-constants';
import $ from 'jquery';

const ActionTypes = Constants.ACTION_TYPES;

export default class NewNodeStore extends Store {

  constructor(workspaceId, variantId, mapId, singleMapStore) {
      super();

      this.openNewNodeDialog = this.openNewNodeDialog.bind(this);
      this.cancelSuggestions = this.cancelSuggestions.bind(this);
      this.fetchSuggestions = this.fetchSuggestions.bind(this);
      this.updateParam = this.updateParam.bind(this);
      this.redispatch = this.redispatch.bind(this);
      this.undispatch = this.undispatch.bind(this);
      this.emitChange = this.emitChange.bind(this);
      this.recordStepChange = this.recordStepChange.bind(this);
      this.getState = this.getState.bind(this);
      this.submitAddNewNodeDialog = this.submitAddNewNodeDialog.bind(this);

      this.dispatchToken = null;
      this.internalState = {
        name : "",
        mapId : mapId,
        open : false,
        suggestions : [],
        suggestionRequest : null,
        currentStep : 0
      };
      this.workspaceId = workspaceId;
      this.variantId = variantId;
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
        case ActionTypes.OPEN_NEW_NODE_DIALOG:
          this.openNewNodeDialog(action.mapId, action.coords, action.type);
          break;
        case ActionTypes.CLOSE_NEW_NODE_DIALOG:
          this.closeNewNodeDialog(action.mapId);
          break;
        case ActionTypes.SUBMIT_NEW_NODE_DIALOG:
          this.submitNewNodeDialog(action.data);
          break;
        case ActionTypes.NEW_NODE_FETCH_SUGGESTIONS:
          this.fetchSuggestions(action.mapId, action.query);
          break;
        case ActionTypes.NEW_NODE_CANCEL_FETCHING_SUGGESTIONS:
          this.cancelSuggestions(action.mapId);
          break;
        case ActionTypes.NEW_NODE_HANDLE_DIALOG_CHANGE:
          this.updateParam(action.mapId, action.param, action.value);
          break;
        case ActionTypes.NEW_NODE_RECORD_STEP_CHANGE:
          this.recordStepChange(action.mapId, action.step);
          break;
        case ActionTypes.SUBMIT_ADD_NEW_NODE_DIALOG:
          this.submitAddNewNodeDialog(action.mapId);
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
    return this.internalState;
  }

  openNewNodeDialog(mapId, coords, type){
    if(mapId === this.mapId){
      this.internalState.open = true;
      this.internalState.coords = coords;
      this.internalState.type = type;
      this.internalState.currentStep = 0;
      this.internalState.responsiblePerson = '';
      this.internalState.inertia = 0;
      this.internalState.constraint = 0;
      this.internalState.description = '';
      this.emitChange();
    }
  }

  closeNewNodeDialog(mapId){
    if(mapId === this.mapId){
      this.internalState.open = false;
      this.internalState.name = "";
      this.internalState.currentStep = 0;
      delete this.internalState.coords;
      delete this.internalState.type;
      this.emitChange();
    }
  }

  updateParam(mapId, param, value) {
    if (mapId !== this.mapId) {
      return;
    }
    this.internalState[param] = value;
    this.emitChange();
  }

  recordStepChange(mapId, step){
    if (mapId !== this.mapId) {
      return;
    }
    this.internalState.currentStep = step;
    this.emitChange();
  }


  fetchSuggestions(mapId, query) {
    if (mapId !== this.mapId) {
      return;
    }
    if (this.internalState.suggestionRequest) {
      this.internalState.suggestionRequest.abort();
      delete this.internalState.suggestionRequest;
    }
    this.internalState.suggestionRequest = $.ajax({
      type: 'GET',
      url: '/api/workspace/' + this.workspaceId + '/variant/' + this.variantId + '/map/' + this.mapId + '/suggestions/' + query,
      success: function(data) {
        this.internalState.suggestions = data.suggestions;
        this.internalState.suggestionRequest.abort();
        delete this.internalState.suggestionRequest;
        this.emitChange();
      }.bind(this)
    });
  }

  cancelSuggestions(mapId) {
    if (mapId !== this.mapId) {
      return;
    }
    if(this.internalState.suggestionRequest){
      this.internalState.suggestionRequest.abort();
      delete this.internalState.suggestionRequest;
    }
    this.internalState.suggestions = [];
    this.emitChange();
  }


  submitAddNewNodeDialog(mapId){
    if (mapId !== this.mapId) {
      return;
    }
    $.ajax({
      type: 'POST',
      url: '/api/workspace/' + this.workspaceId + '/map/' + this.mapId + '/node/',
      data: {
        name:  this.internalState.name,
        responsiblePerson : this.internalState.responsiblePerson,
        inertia: this.internalState.inertia,
        description : this.internalState.description,
        type: this.internalState.type,
        x: this.internalState.coords.x,
        y: this.internalState.coords.y
      },
      success: function(data) {
        this.closeNewNodeDialog(mapId);
        this.singleMapStore.updateMap(mapId, data);
        this.emitChange();
      }.bind(this)
    });
  }

}
