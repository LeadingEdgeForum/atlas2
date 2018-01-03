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

      this.connectionDialog = {
          open : false
      };

      this.editNodeDialog = {
          open : false
      };

      this.referencesDialog = {
        open : false
      };

      this.submapReferencesDialog = {
        open : false
      };

      this.turnIntoSubmapDialog = {
        open : false
      };

      this.addNewUserDialog = {
        open : false
      };

      this.editMapUserDialog = {
        open : false
      };

      this.updateNodeObjects = [];
      this.updateUserObjects = [];

      this.io = require('socket.io-client')();

      this.io.on('mapchange', this.reloadOnSocketMessage);

      this.dispatchToken = null;
      this.redispatch();

  }

  reloadOnSocketMessage(msg){
    if(msg.id === this.mapID){
      this.fetchMap();
    }
  }

  cleanUp(){
    this.io.removeListener('mapchange', this.reloadOnSocketMessage);
  }

  getErrorCode(){
    return this.errorCode;
  }


  redispatch(){
    if(this.dispatchToken){
      return;
    }
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
        case ActionTypes.OPEN_EDIT_CONNECTION_DIALOG:
          this.connectionDialog.open = true;
          this.connectionDialog.workspaceId = action.data.workspaceId;
          this.connectionDialog.mapId = action.data.mapId;
          this.connectionDialog.sourceId = action.data.sourceId;
          this.connectionDialog.targetId = action.data.targetId;
          this.connectionDialog.label = action.data.label;
          this.connectionDialog.description = action.data.description;
          this.connectionDialog.connectionType = action.data.connectionType;
          this.emitChange();
          break;
        case ActionTypes.CLOSE_EDIT_CONNECTION_DIALOG:
          this.connectionDialog = {
            open: false
          };
          this.emitChange();
          break;
        case ActionTypes.UPDATE_CONNECTION:
          this.updateConnection(action.data);
          break;
        case ActionTypes.DELETE_CONNECTION:
          this.deleteConnection(action.data);
          break;


        case ActionTypes.SHOW_SUBMAP_REFERENCES:
          this.submapReferencesDialog.open = true;
          this.submapReferencesDialog.currentName = action.data.currentName;
          this.submapReferencesDialog.mapID = action.data.mapID;
          this.submapReferencesDialog.submapID = action.data.submapID;
          this.submapReferencesDialog.node = action.data.node;
          this.submapReferencesDialog.workspaceID = action.data.workspaceID;
          this.submapReferencesDialog.variantId = action.data.variantId;
          $.ajax({
            type: 'GET',
            url: '/api/submap/' + this.submapReferencesDialog.submapID + '/usage',
            success: function(data2) {
              this.submapReferencesDialog.referencingMaps = data2;
              this.emitChange();
            }.bind(this)
          });
          this.emitChange();
          break;
        case ActionTypes.CLOSE_SUBMAP_REFERENCES:
          this.submapReferencesDialog = {
            open: false
          };
          this.emitChange();
          break;
        case ActionTypes.SHOW_REFERENCES:
          this.referencesDialog.open = true;
          this.referencesDialog.currentName = action.data.currentName;
          this.referencesDialog.node = action.data.node;
          this.referencesDialog.workspaceID = action.data.workspaceID;
          this.referencesDialog.variantId = action.data.variantId;
          this.emitChange();
          break;
        case ActionTypes.CLOSE_REFERENCES:
          this.referencesDialog = {
            open: false
          };
          this.emitChange();
          break;


        case ActionTypes.OPEN_TURN_INTO_SUBMAP:
          this.turnIntoSubmapDialog.open = true;
          this.turnIntoSubmapDialog.workspaceId = action.workspaceId;
          this.turnIntoSubmapDialog.mapId = action.mapId;
          this.turnIntoSubmapDialog.nodeId = action.nodeId;
          $.ajax({
            type: 'GET',
            url: '/api/submaps/map/' + this.getMapId(),
            success: function(data2) {
              this.turnIntoSubmapDialog.listOfAvailableSubmaps = data2.listOfAvailableSubmaps;
              this.emitChange();
            }.bind(this)
          });
          break;
        case ActionTypes.CLOSE_TURN_INTO_SUBMAP:
          this.turnIntoSubmapDialog = {
            open: false
          };
          this.emitChange();
          break;
        case ActionTypes.SUBMIT_TURN_INTO_SUBMAP:
        $.ajax({
              type: 'PUT',
              url: '/api/workspace/' + action.workspaceId + '/map/' + this.getMapId() + '/node/' + action.nodeId + '/submap/' + (action.refId ? action.refId : '') ,
              dataType: 'json',
              success: function(data2) {
                this.map = data2;
                this.turnIntoSubmapDialog = {
                  open: false
                };
                this.diff = null;
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
          break;
          case ActionTypes.OPEN_ADD_NEW_USER_DIALOG:
            this.addNewUserDialog.open = true;
            this.addNewUserDialog.coords = action.coords;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_ADD_NEW_USER_DIALOG:
            this.addNewUserDialog.open = false;
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_ADD_NEW_USER_DIALOG:
            this.submitAddNewUserDialog(action.data);
            break;
          case ActionTypes.DELETE_USER:
            this.deleteUser(action.id);
            break;
          case ActionTypes.UPDATE_USER:
            this.updateUser(action.data);
            break;
          case ActionTypes.RECORD_USER_CONNECTION:
          this.recordUserConnection(action.data);
            break;
          case ActionTypes.DELETE_USER_CONNECTION:
            this.deleteUserConnection(action.data);
            break;
          case ActionTypes.OPEN_EDIT_USER_DIALOG:
            this.editMapUserDialog.open = true;
            this.editMapUserDialog.id = action.id;
            this.editMapUserDialog.name = action.name;
            this.editMapUserDialog.description = action.description;
            this.editMapUserDialog.workspaceID = action.workspaceID;
            this.editMapUserDialog.mapID = action.mapID;
            this.emitChange();
            break;
          case ActionTypes.CLOSE_EDIT_USER_DIALOG:
            this.editMapUserDialog = {
              open: false
            };
            this.emitChange();
            break;
          case ActionTypes.SUBMIT_EDIT_USER_DIALOG:
            this.updateUser(action.data);
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

  getMapEditDialogState(){
    return this.editMapDialog;
  }

  getNewNodeDialogState(){
    return this.newNodeDialog;
  }

  getNewUserDialogState(){
    return this.addNewUserDialog;
  }

  getEditUserDialogState(){
    return this.editMapUserDialog;
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

  getEditConnectionDialogState(){
    return this.connectionDialog;
  }

  getNodeEditDialogState(){
    return this.editNodeDialog;
  }

  getReferencesDialogState(){
    return this.referencesDialog;
  }

  getSubmapReferencesDialogState(){
    return this.submapReferencesDialog;
  }

  getTurnIntoSubmapDialogState(){
    return this.turnIntoSubmapDialog;
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
      this.serverRequest = $.get('/api/map/' + this.mapID)
      .done(function(result) {
        this.map = result;
        this.serverRequest = null;
        this.emitChange();
      }.bind(this))
      .fail(function(error) {
        console.log('received', error);
        this.errorCode = error.status;
        this.emitChange();
      }.bind(this));
    }
  }

  fetchMapDiff(){
    if(!this.diffServerRequest && !this.errorCode){
      this.diffServerRequest = $.get('/api/map/' + this.mapID + '/diff', function(result) {
        this.diff = result;
        this.diffServerRequest = null;
        this.emitChange();
      }.bind(this));
    }
  }

  fetchMapVariants(){
    if(!this.variantsServerRequest && !this.errorCode){
      this.variantsServerRequest = $.get('/api/map/' + this.mapID + '/variants', function(result) {
        this.variants = result;
        this.variantsServerRequest = null;
        this.emitChange();
      }.bind(this));
    }
  }

  getMap(){
    if(!this.map && !this.errorCode){
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
    if(this.errorCode) {
      return {
        map: {
          name: 'Error...',
          workspace : 'Error',
          loading: true,
          nodes: []
        }
      };
    }
    return this.map;
  }

  getDiff(){
    if(!this.diff){
      this.fetchMapDiff();
      return {
        nodesRemoved : [],
        nodesAdded : [],
        nodesModified : [],
        usersAdded : [],
        usersRemoved : []
      };
    }
    return this.diff;
  }

  getVariants(){
    if(!this.variants){
      this.fetchMapVariants();
      return {
        past : null,
        alternatives : [],
        futures : []
      };
    }
    return this.variants;
  }


  submitEditMapDialog(data){
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
        this.diff = null;
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
        this.editNodeDialog.constraint = nodes[i].constraint;
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
        this.diff = null;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  executeNodeUpdate(){
    if(this.nodeOrUserUpdateInProgress){
      return;
    }
    let updateToExecute = this.updateNodeObjects.shift();
    if(!updateToExecute){
      return;
    }
    this.nodeOrUserUpdateInProgress = true;
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + this.getWorkspaceId()+ '/map/' + this.getMapId() + '/node/' + updateToExecute.data.nodeId,
      data: updateToExecute.payload,
      success: function(data2) {
        this.nodeOrUserUpdateInProgress = false;
        if(this.updateNodeObjects.length > 0){
          this.executeNodeUpdate();
        }
        if(this.updateUserObjects.length > 0){
          this.executeUserUpdate();
        }
        // all processed
        this.map = data2;
        this.editNodeDialog = {
            open : false
        };
        this.diff = null;
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
    if(data.width){
      payload.width = data.width;
    }
    if(data.name || data.type || data.person || data.inertia || data.description || data.constraint !== undefined ){
      payload.name = data.name;
      payload.type = data.type;
      payload.responsiblePerson = data.person;
      payload.inertia = data.inertia;
      payload.description = data.description;
      payload.constraint = data.constraint;
    }
    this.updateNodeObjects.push({data:data, payload:payload});
    this.executeNodeUpdate();
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
            this.diff = null;
            this.emitChange();
            this.io.emit('map', {
                type: 'change',
                id: this.getMapId()
            });
        }.bind(this)
    });
  }

  submitAddNewUserDialog(data){
    $.ajax({
        type: 'POST',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/user/',
        data: {
          x : data.coords.x,
          y : data.coords.y,
          name : data.name,
          description : data.description
        },
        success: function(data2) {
            this.map = data2;
            this.addNewUserDialog = {
              open : false
            };
            this.diff = null;
            this.emitChange();
            this.io.emit('map', {
                type: 'change',
                id: this.getMapId()
            });
        }.bind(this)
    });
  }

  deleteUser(id){
    $.ajax({
        type: 'DELETE',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/user/' + id,
        success: function(data2) {
          this.map = data2;
          this.addNewUserDialog = {open:false};
          this.diff = null;
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });
  }

  executeUserUpdate(){
    if(this.nodeOrUserUpdateInProgress){
      return;
    }
    let updateToExecute = this.updateUserObjects.shift();
    if(!updateToExecute){
      return;
    }
    this.nodeOrUserUpdateInProgress = true;
    $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/user/' + updateToExecute.data.id,
        data: updateToExecute.payload,
        success: function(data2) {
          this.nodeOrUserUpdateInProgress = false;
          // console.log(this.updateNodeObjects);
          if(this.updateNodeObjects.length > 0){
            this.executeNodeUpdate();
          }
          if(this.updateUserObjects.length > 0){
            this.executeUserUpdate();
          }
          this.map = data2;
          this.editMapUserDialog = {open:false};
          this.diff = null;
          this.emitChange();
          this.io.emit('map', {
            type: 'change',
            id: this.getMapId()
          });
        }.bind(this)
    });

  }

  updateUser(data){
    var payload = {};
    if(data.name){
      payload.name = data.name;
    }
    if(data.description){
      payload.description = data.description;
    }
    if(data.pos){
      payload.x = data.pos.x;
      payload.y = data.pos.y;
    }
    if(data.width){
      payload.width = data.width;
    }
    this.updateUserObjects.push({data:data, payload:payload});
    this.executeUserUpdate();
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
        this.diff = null;
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
            this.diff = null;
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
    if(data.width){
      payload.width = data.width;
    }
    $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + this.getWorkspaceId() + '/map/' + this.getMapId() + '/comment/' + data.id,
        data: payload,
        success: function(data2) {
          this.map = data2;
          this.editCommentDialog = {open:false};
          this.diff = null;
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
          this.diff = null;
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
          this.diff = null;
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
          this.diff = null;
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
          this.diff = null;
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
            '/dependency/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.diff = null;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  updateConnection(data){
    var actionData = {};
    $.ajax({
        type: 'PUT',
        url:  '/api/workspace/' + this.getWorkspaceId() +
              '/map/' + this.getMapId() +
              '/node/' + data.sourceId +
              '/dependency/' + data.targetId,
        data: data,
        success: function(data2) {
          this.map = data2;
          this.connectionDialog = {open:false};
          this.diff = null;
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
            '/dependency/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.diff = null;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  recordUserConnection(data){
    $.ajax({
      type: 'POST',
      url:  '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/user/' + data.sourceId +
            '/dep/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.diff = null;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  deleteUserConnection(data){
    $.ajax({
      type: 'DELETE',
      url:  '/api/workspace/' + this.getWorkspaceId() +
            '/map/' + this.getMapId() +
            '/user/' + data.sourceId +
            '/dep/' + data.targetId,
      success: function(data2) {
        this.map = data2;
        this.diff = null;
        this.emitChange();
        this.io.emit('map', {
          type: 'change',
          id: this.getMapId()
        });
      }.bind(this)
    });
  }

  updateMap(mapId, data){
    if(this.mapID === mapId){
      this.map = data;
      this.diff = null;
      this.emitChange();
      this.io.emit('map', {
        type: 'change',
        id: this.getMapId()
      });
    }
  }
}
