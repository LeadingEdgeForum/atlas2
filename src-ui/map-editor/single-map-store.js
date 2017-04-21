/*jshint esversion: 6 */

import Store from '../store.js';
import Dispatcher from '../dispatcher';
import Constants from './single-map-constants';
import $ from 'jquery';
var io = require('socket.io-client')();

const ActionTypes = Constants.ACTION_TYPES;

export default class SingleWorkspaceStore extends Store {

  constructor(mapID) {
      super();
      this.mapID = mapID;
      this.map = null;

      this.editMapDialog = {
          open : false,
      };

      this.newNodeDialog = {
        open : false
      };

      this.io = require('socket.io-client')();

      this.io.on('mapchange', function(msg) {
          if(msg.id === this.mapID){
            this.fetchMap();
          }
      }.bind(this));

      this.dispatchToken = Dispatcher.register(action => {
        switch (action.actionType) {
          case ActionTypes.OPEN_EDIT_MAP_DIALOG:
            this.editMapDialog.open = true;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_EDIT_MAP_DIALOG:
            this.editMapDialog.open = false;
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_EDIT_MAP_DIALOG:
            this.submitEditMapDialog(action.data);
            break;
          case ActionTypes.OPEN_NEW_NODE_DIALOG:
            this.newNodeDialog.open = true;
            this.newNodeDialog.coords = action.coords;
            this.newNodeDialog.type = action.type;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_NEW_NODE_DIALOG:
            this.newNodeDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_NEW_NODE_DIALOG:
            this.submitNewNodeDialog(action.data);
            break;
          default:
            return;
        }
      });
      }

  emitChange() {
    super.emitChange();
  }

  getMapEditDialogState(){
    return this.editMapDialog;
  }

  getNewNodeDialogState(){
    return this.newNodeDialog;
  }

  getMapId(){
    return this.mapID;
  }

  getWorkspaceId(){
    const map = this.getMap().map;
    return map.workspace._id || map.workspace;
  }

  getWorkspaceNameAndPurpose(){
    const workspace = this.getMap().map.workspace;
    if(workspace.name && workspace.purpose){
      return {
        name : workspace.name,
        purpose : workspace.purpose
      };
    }
    return null;
  }

  fetchMap(){
    this.serverRequest = $.get('/api/map/' + this.mapID, function(result) {
      this.map = result;
      this.emitChange();
    }.bind(this));
  }

  getMap(){
    if(!this.map){
      this.fetchMap();
      return {
        map: {
          name: 'Loading...',
          workspace : 'not yet set',
          loading: true
        }
      };
    }
    return this.map;
  }

  submitEditMapDialog(data){
    this.map.map.user = data.user;
    this.map.map.purpose = data.purpose;
    this.map.map.name = data.name;
    this.map.map.responsiblePerson = data.responsiblePerson;
    $.ajax({
      type: 'PUT',
      url: '/api/map/' + this.mapID,
      dataType: 'json',
      data: this.map,
      success: function(data2) {
        this.map = data2;
        this.editMapDialog = {
            open : false,
        };
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: data.mapID
        });
        this.io.emit('workspace', {
          type: 'change',
          id: data.workspaceID
        });
      }.bind(this)
    });
  }

  submitNewNodeDialog(data){
    $.ajax({
      type: 'POST',
      url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/node/',
      data: {
        name:  data.name,
        responsiblePerson : data.responsiblePerson,
        inertia: data.inertia,
        description : data.description,
        type: data.type,
        x: data.coords.x,
        y: data.coords.y
      },
      success: function(data2) {
        this.map = data2;
        this.newNodeDialog = {
          open: false
        };
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

}
