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
import Constants from './form-a-submap-constants';
import $ from 'jquery';

const ActionTypes = Constants.ACTION_TYPES;

export default class FormASubmapStore extends Store {

  constructor(workspaceId, variantId, mapId, singleMapStore) {
      super();

      this.openFormASubmapDialog = this.openFormASubmapDialog.bind(this);
      this.closeFormASubmapDialog = this.closeFormASubmapDialog.bind(this);
      this.redispatch = this.redispatch.bind(this);
      this.undispatch = this.undispatch.bind(this);
      this.emitChange = this.emitChange.bind(this);
      this.getState = this.getState.bind(this);

      this.dispatchToken = null;
      this.internalState = {
        open : false,
        loading :false,
        nodes : [],
        comments : [],
        currentStep : 0
      };
      this.workspaceId = workspaceId;
      this.variantId = variantId;
      this.mapId = mapId;
      this.singleMapStore = singleMapStore;

      /*
       * For some reason, sometimes, we can get multiple requests to the db
       * to establish a reference to existing node. Since it causes plenty of issues,
       * as it is really difficult to enforce on a db level, we want to be sure
       * that each request is send only once.
       */
      this.referenceRequestInProgress = {};
      this.redispatch();
  }

  redispatch() {
    if (this.dispatchToken) {
      return;
    }
    this.dispatchToken = Dispatcher.register(action => {
      switch (action.actionType) {
        case ActionTypes.OPEN_FORM_A_SUBMAP_DIALOG:
          this.openFormASubmapDialog(action.workspaceId, action.mapId, action.nodes, action.comments);
          break;
        case ActionTypes.CLOSE_FORM_A_SUBMAP_DIALOG:
          this.closeFormASubmapDialog(action.mapId);
          break;
        case ActionTypes.SUBMIT_FORM_A_SUBMAP_DIALOG:
          this.submitFormASubmapDialog(action.mapId);
          break;
        case ActionTypes.FORM_A_SUBMAP_HANDLE_DIALOG_CHANGE:
          this.updateParam(action.mapId, action.param, action.value);
          break;
        case ActionTypes.FORM_A_SUBMAP_DIALOG_NEXT_STEP:
          if (action.mapId === this.mapId) {
            this.internalState.currentStep++;
            this.emitChange();
          }
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

  openFormASubmapDialog(workspaceId, mapId, nodes, comments){
    if(mapId === this.mapId){
      this.internalState.workspaceId = workspaceId;
      this.internalState.mapId = mapId;
      this.internalState.open = true;
      this.internalState.loading = true;
      this.internalState.nodes = nodes;
      this.internalState.comments = comments;
      this.internalState.name = '';
      this.internalState.responsiblePerson = '';
      this.internalState.currentStep = 0;
      this.fetchImpact();
      this.emitChange();
    }
  }

  closeFormASubmapDialog(mapId){
    if(mapId === this.mapId){
      this.internalState.open = false;
      this.internalState.loading = false;
      this.internalState.nodes = [];
      this.internalState.comments = [];
      this.internalState.name = '';
      this.internalState.responsiblePerson = '';
      this.emitChange();
    }
  }


  fetchImpact() {
    let nodes = this.internalState.nodes;
    this.internalState.suggestionRequest = $.ajax({
      type: 'GET',
      url: '/api/workspace/' + this.workspaceId + '/submapImpact',
      data: {
        nodes : nodes
      },
      success: function(data) {
        this.internalState.loading = false;
        this.internalState.impact = data.impact;
        this.emitChange();
      }.bind(this)
    });
  }

  updateParam(mapId, param, value) {
    if (mapId !== this.mapId) {
      return;
    }
    this.internalState[param] = value;
    this.emitChange();
  }

  submitFormASubmapDialog(mapId) {
    if (mapId !== this.mapId) {
      return;
    }
    //TODO : map submit code
  }
}
