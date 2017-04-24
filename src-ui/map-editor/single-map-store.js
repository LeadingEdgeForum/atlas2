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

      this.addCommentDialog = {
        open : false
      };

      this.addSubmapDialog = {
        open : false
      };

      this.editCommentDialog = {
        open : false
      };

      this.actionDialog = {
          open : false
      };

      this.editNodeDialog = {
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
          case ActionTypes.OPEN_EDIT_NODE_DIALOG:
            this.openEditNodeDialog(action.data);
            break;
          case ActionTypes.CLOSE_EDIT_NODE_DIALOG:
            this.editNodeDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.DELETE_NODE:
            this.deleteNode(action.data);
            break;
          case ActionTypes.UPDATE_NODE:
            this.updateNode(action.data);
            break;
          case ActionTypes.OPEN_ADD_COMMENT_DIALOG:
            this.addCommentDialog.open = true;
            this.addCommentDialog.coords = action.coords;
            this.addCommentDialog.type = action.type;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_ADD_COMMENT_DIALOG:
            this.addCommentDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_ADD_COMMENT_DIALOG:
            this.submitAddCommentDialog(action.data);
            break;
          case ActionTypes.OPEN_ADD_SUBMAP_DIALOG:
            this.addSubmapDialog.open = true;
            this.addSubmapDialog.coords = action.coords;
            this.addSubmapDialog.type = action.type;
            this.addSubmapDialog.listOfNodesToSubmap = [];
            this.addSubmapDialog.listOfCommentsToSubmap = [];
            $.ajax({
              type: 'GET',
              url: '/api/submaps/map/' + this.getMapId(),
              success: function(data2) {
                this.addSubmapDialog.listOfAvailableSubmaps = data2.listOfAvailableSubmaps;
                this.emitChange();
              }.bind(this)
            });
            break;
          case ActionTypes.OPEN_CREATE_SUBMAP_FROM_SELECTED_NODES_DIALOG:
            this.addSubmapDialog.open = true;
            this.addSubmapDialog.listOfNodesToSubmap = action.data.nodes;
            this.addSubmapDialog.listOfCommentsToSubmap = action.data.comments;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_ADD_SUBMAP_DIALOG:
            this.addSubmapDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_ADD_SUBMAP_DIALOG:
            this.createSubmap(action.data);
            break;
          case ActionTypes.SUBMIT_ADD_REFERENCED_SUBMAP:
            this.addReferenceToExistingSubmap(action.refID, action.coords);
            break;

          case ActionTypes.OPEN_EDIT_COMMENT_DIALOG:
            this.editCommentDialog.open = true;
            this.editCommentDialog.id = action.id;
            this.editCommentDialog.comment = action.text;
            this.editCommentDialog.workspaceID = action.workspaceID;
            this.editCommentDialog.mapID = action.mapID;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_EDIT_COMMENT_DIALOG:
            this.editCommentDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_EDIT_COMMENT_DIALOG:
            this.updateComment(action.data);
            break;
          case ActionTypes.DELETE_COMMENT:
            this.deleteComment(action.id);
            break;
          case ActionTypes.MOVE_COMMENT:
            this.updateComment(action.data);
            break;


          case ActionTypes.RECORD_ACTION:
            this.recordAction(action.data);
            break;
          case ActionTypes.OPEN_EDIT_ACTION_DIALOG:
            this.actionDialog.open = true;
            this.actionDialog.workspaceID = action.data.workspaceID;
            this.actionDialog.mapID = action.data.mapID;
            this.actionDialog.sourceId = action.data.sourceId;
            this.actionDialog.actionId = action.data.actionId;
            this.actionDialog.shortSummary = action.data.shortSummary;
            this.actionDialog.description = action.data.description;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_EDIT_ACTION_DIALOG:
            this.actionDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.UPDATE_ACTION:
            this.updateAction(action.data);
            break;
          case ActionTypes.DELETE_ACTION:
            this.deleteAction(action.data);
            break;


          case ActionTypes.RECORD_CONNECTION:
            this.recordConnection(action.data);
            break;
          case ActionTypes.DELETE_CONNECTION:
            this.deleteConnection(action.data);
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

  getNewCommentDialogState(){
    return this.addCommentDialog;
  }

  getNewSubmapDialogState(){
    return this.addSubmapDialog;
  }

  getEditCommentDialogState(){
    return this.editCommentDialog;
  }

  getEditActionDialogState(){
    return this.actionDialog;
  }

  getNodeEditDialogState(){
    return this.editNodeDialog;
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
    if(!this.serverRequest){
      this.serverRequest = $.get('/api/map/' + this.mapID, function(result) {
        this.map = result;
        this.serverRequest = null;
        this.emitChange();
      }.bind(this));
    }
  }

  getMap(){
    if(!this.map){
      this.fetchMap();
      return {
        map: {
          name: 'Loading...',
          workspace : 'not yet set',
          loading: true,
          nodes: []
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

  openEditNodeDialog(data){
    this.editNodeDialog = {open : true};
    var map = this.getMap().map;
    var nodes = map.nodes;
    /* find node and populate node internal state
    */
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i]._id === data.nodeID) {
        this.editNodeDialog.name = nodes[i].name;
        this.editNodeDialog.type = nodes[i].type;
        this.editNodeDialog.responsiblePerson = nodes[i].responsiblePerson;
        this.editNodeDialog.inertia = nodes[i].inertia;
        this.editNodeDialog.description = nodes[i].description;
        this.editNodeDialog.workspaceId = this.getWorkspaceId();
        this.editNodeDialog.mapId = this.getMapId();
        this.editNodeDialog.nodeId = data.nodeID;
      }
    }
    this.emitChange();
  }

  deleteNode(data){
    $.ajax({
      type: 'DELETE',
      url: '/api/workspace/' + this.getWorkspaceId()+ '/map/' + this.getMapId() + '/node/' + data.nodeId,
      success: function(data2) {
        this.map = data2;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  updateNode(data){
    var payload = {};
    if(data.pos){
      payload.x = data.pos.x;
      payload.y = data.pos.y;
    }
    if(data.name || data.type || data.person || data.inertia || data.description){
      payload.name = data.name;
      payload.type = data.type;
      payload.responsiblePerson = data.person;
      payload.inertia = data.inertia;
      payload.description = data.description;
    }
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + this.getWorkspaceId()+ '/map/' + this.getMapId() + '/node/' + data.nodeId,
      data: payload,
      success: function(data2) {
        this.map = data2;
        this.editNodeDialog = {
            open : false
        };
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  submitAddCommentDialog(data){
    $.ajax({
        type: 'POST',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/comment/',
        data: {
          x : data.coords.x,
          y : data.coords.y,
          text : data.comment
        },
        success: function(data2) {
            this.map = data2;
            this.addCommentDialog = {
              open : false
            };
            this.emitChange();
            this.io.emit('map', {
                type: 'change',
                id: this.getMapId()
            });
        }.bind(this)
    });
  }

  addReferenceToExistingSubmap(refID, coords){
    $.ajax({
      type: 'PUT',
      url: '/api/map/' + this.getMapId() + '/submap/' + refID,
      dataType: 'json',
      data : {
        coords: coords
      },
      success: function(data2) {
        this.map = data2;
        this.addSubmapDialog = {open:false};
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
        this.io.emit('workspace', {
          type: 'change',
          id: this.getWorkspaceId()
        });
      }.bind(this)
    });
  }

  createSubmap(data){
    $.ajax({
          type: 'PUT',
          url: '/api/map/' + this.getMapId() + '/submap',
          dataType: 'json',
          data : {
            name : data.name,
            responsiblePerson : data.responsiblePerson,
            listOfNodesToSubmap : data.listOfNodesToSubmap,
            listOfCommentsToSubmap : data.listOfCommentsToSubmap,
            coords: data.coords
          },
          success: function(data2) {
            this.map = data2;
            this.addSubmapDialog = {open:false};
            this.emitChange();
            this.io.emit('map', {
              type: 'change',
              id: this.getMapId()
            });
            this.io.emit('workspace', {
              type: 'change',
              id: this.getWorkspaceId()
            });
          }.bind(this)
        });
  }

  updateComment(data){
    var payload = {};
    if(data.comment){
      payload.text = data.comment;
    }
    if(data.pos){
      payload.x = data.pos.x;
      payload.y = data.pos.y;
    }
    $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/comment/' + data.id,
        data: payload,
        success: function(data2) {
          this.map = data2;
          this.editCommentDialog = {open:false};
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  deleteComment(id){
    $.ajax({
        type: 'DELETE',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/comment/' + id,
        success: function(data2) {
          this.map = data2;
          this.editCommentDialog = {open:false};
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  recordAction(data){
    var coords = {
      x : data.pos[0],
      y: data.pos[1]
    };
    $.ajax({
        type: 'POST',
        url: '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/node/' + data.sourceId +
            '/action/',
        data: coords,
        success: function(data2) {
          this.map = data2;
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  updateAction(data){
    var actionData = {};
    if(data.pos){
      actionData.x = data.pos[0];
      actionData.y = data.pos[1];
    }
    if(data.shortSummary || data.description){
      actionData.shortSummary = data.shortSummary;
      actionData.description = data.description;
    }
    $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/node/' + data.sourceId +
            '/action/' + data.actionId,
        data: actionData,
        success: function(data2) {
          this.map = data2;
          this.actionDialog = {open:false};
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  deleteAction(data){
    $.ajax({
        type: 'DELETE',
        url: '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/node/' + data.sourceId +
            '/action/' + data.actionId,
        success: function(data2) {
          this.map = data2;
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  recordConnection(data){
    $.ajax({
      type: 'POST',
      url:  '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/node/' + data.sourceId +
            '/outgoingDependency/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  deleteConnection(data){
    $.ajax({
      type: 'DELETE',
      url:  '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/node/' + data.sourceId +
            '/outgoingDependency/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }
}
