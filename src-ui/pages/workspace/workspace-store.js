/*jshint esversion: 6 */

import Store from '../../store.js';
import CanvasStore from './maps/editor/canvas-store';
import Dispatcher from '../../dispatcher';
import Constants from '../../constants';
import $ from 'jquery';
var io = require('socket.io-client')();

let appState = {
  newWorkspaceDialog: {
    open: false
  },
  inviteDialog: {
    open: false
  },
  newMapDialog: {
    open: false
  },
  workspaces: {},
  singleWorkspace: {},
  newNodeDialog: {
    open: false
  },
  editWorkspaceDialog: {
    open: false
  },
  editMapDialog: {
    open: false
  },
  editNodeDialog: {
    open: false
  },
  createSubmapDialog : {
    open : false
  },
  //TODO: rename this
  showReferencesDialog : { //submaps
    open : false
  },
  showReferences2Dialog : { //pure references
    open : false
  },
  w_maps: {}
};

var workspacesQueriedForFirstTime = false;
class WorkspaceStore extends Store {

  constructor() {
    super();
    this.io = require('socket.io-client')();
  }
  getMapInfo(mapID) {
    if (!mapID) {
      console.log('no mapId supplied to getMapInfo');
      return null;
    }
    if (!appState.w_maps[mapID]) {
      this.serverRequest = $.get('/api/map/' + mapID, function(result) {
        //        console.log('map loaded', result);
        appState.w_maps[mapID] = result;
        this.emitChange();
      }.bind(this));
      return {
        map: {
          name: 'Loading...',
          loading: true
        }
      };
    }
    return appState.w_maps[mapID];
  }

  getNewNodeDialogState() {
    return appState.newNodeDialog;
  }

  getState() {
    return appState;
  }

  reset() {
    appState = {};
  }
  emitChange() {
    super.emitChange();
  }
  updateWorkspaces() {
    this.serverRequest = $.get('/api/workspaces', function(result) {
      appState.workspaces = result;
      this.emitChange();
    }.bind(this));
  }
  fetchSingleWorkspaceInfo(workspaceID) {
    this.serverRequest = $.get('/api/workspace/' + workspaceID, function(result) {
      //      console.log('result', result);
      appState.singleWorkspace[workspaceID] = result;
      this.emitChange();
    }.bind(this));
  }
  getWorkspaces() {
    if (!workspacesQueriedForFirstTime) {
      this.updateWorkspaces();
      workspacesQueriedForFirstTime = true;
    }
    return appState.workspaces;
  }

  isWorkspaceNewDialogOpen() {
    if (appState && appState.newWorkspaceDialog) {
      return appState.newWorkspaceDialog;
    } else {
      return {open: false};
    }
  }

  isInviteNewUserDialogOpen(){
    if (appState && appState.inviteDialog) {
      return appState.inviteDialog;
    } else {
      return {open: false};
    }
  }

  isWorkspaceEditDialogOpen() {
    if (appState && appState.editWorkspaceDialog) {
      return appState.editWorkspaceDialog;
    } else {
      return {open: false};
    }
  }

  isMapNewDialogOpen() {
    if (appState && appState.newMapDialog) {
      return appState.newMapDialog;
    } else {
      return {open: false};
    }
  }

  isMapEditDialogOpen() {
    if (appState && appState.editMapDialog) {
      return appState.editMapDialog;
    } else {
      return {open: false};
    }
  }

  isNodeEditDialogOpen() {
    if (appState && appState.editNodeDialog) {
      return appState.editNodeDialog;
    } else {
      return {open: false};
    }
  }

  getNewSubmapDialogState() {
    return appState.createSubmapDialog;
  }

  getSubmapReferencesDialogState() {
    return appState.showReferencesDialog;
  }

  getReferencesDialogState() {
    return appState.showReferences2Dialog;
  }

  submitNewWorkspaceDialog(data) {
    $.ajax({
      type: 'POST',
      url: '/api/workspace/',
      dataType: 'json',
      data: data,
      success: function(data) {
        appState.newWorkspaceDialog.open = false;
        this.updateWorkspaces();
      }.bind(this)
    });
  }

  submitEditWorkspaceDialog(data) {
    var workspace = appState.singleWorkspace[data.workspaceID].workspace;
    workspace.name = data.newWorkspaceData.name;
    workspace.description = data.newWorkspaceData.description;
    workspace.purpose = data.newWorkspaceData.purpose;
    $.ajax({
      type: 'PUT',
      url: '/api/workspace/' + data.workspaceID,
      dataType: 'json',
      data: workspace,
      success: function(data) {
        appState.editWorkspaceDialog.open = false;
        appState.editWorkspaceDialog.editedWorkspace = null;
        this.updateWorkspaces();
      }.bind(this)
    });
  }

  saveMap(mapID, interceptor) {
    var that = this;
    $.ajax({
      type: 'PUT',
      url: '/api/map/' + mapID,
      dataType: 'json',
      data: appState.w_maps[mapID],
      /*better do not be too fast with editing*/
      success: function(data2) {
        appState.w_maps[mapID] = data2;
        if (interceptor) {
          interceptor();
        }
        that.emitChange();
      }
    });
  }

  submitNewMapDialog(data) {
    $.ajax({
      type: 'POST',
      url: '/api/map/',
      dataType: 'json',
      data: data,
      success: function(data2) {
        appState.newMapDialog.open = false;
        this.fetchSingleWorkspaceInfo(data.workspaceID);
      }.bind(this)
    });
  }

  getWorkspaceInfo(workspaceID) {
    if (!workspaceID) {
      console.error('No workspaceID in getWorkspaceInfo');
      return;
    }

    if (appState.singleWorkspace[workspaceID]) {
      return appState.singleWorkspace[workspaceID];
    }

    this.fetchSingleWorkspaceInfo(workspaceID);

    return {
      workspace: {
        name: "Loading...",
        maps: [],
        capabilityCategories : []
      },
      loading: true
    };
  }

}
let workspaceStoreInstance = new WorkspaceStore();

workspaceStoreInstance.io.on('mapchange', function(msg) {
    console.log('change discovered', msg);
    workspaceStoreInstance.serverRequest = $.get('/api/map/' + msg.id, function(result) {
        appState.w_maps[msg.id] = result;
        workspaceStoreInstance.emitChange();
    }.bind(workspaceStoreInstance));

});

let ActionTypes = Constants.ACTION_TYPES;

workspaceStoreInstance.dispatchToken = Dispatcher.register(action => {
  //  console.log(action);
  switch (action.actionType) {
    case ActionTypes.WORKSPACE_OPEN_NEW_WORKSPACE_DIALOG:
      appState.newWorkspaceDialog.open = true;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.WORKSPACE_CLOSE_NEW_WORKSPACE_DIALOG:
      appState.newWorkspaceDialog.open = false;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.WORKSPACE_SUBMIT_NEW_WORKSPACE_DIALOG:
      workspaceStoreInstance.submitNewWorkspaceDialog(action.data);
      //no change, because it will go only after the submission is successful
      break;
    case ActionTypes.WORKSPACE_OPEN_INVITE_DIALOG:
        appState.inviteDialog.open = true;
        workspaceStoreInstance.emitChange();
        break;
    case ActionTypes.WORKSPACE_CLOSE_INVITE_DIALOG:
        appState.inviteDialog.open = false;
        workspaceStoreInstance.emitChange();
        break;
    case ActionTypes.WORKSPACE_SUBMIT_INVITE_DIALOG:
        $.ajax({
          type: 'PUT',
          url: '/api/workspace/' + action.data.workspaceID + '/editor/' + action.data.email,
          success: function(data2) {
            appState.inviteDialog.open = false;
            workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
            workspaceStoreInstance.updateWorkspaces(); // this emits change
          }.bind(this)
        });
        break;
    case ActionTypes.WORKSPACE_DELETE_USER:
        $.ajax({
          type: 'DELETE',
          url: '/api/workspace/' + action.data.workspaceID + '/editor/' + action.data.email,
          success: function(data2) {
            workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
            workspaceStoreInstance.updateWorkspaces(); // this emits change
          }.bind(this)
        });
        break;
    case ActionTypes.WORKSPACE_OPEN_EDIT_WORKSPACE_DIALOG:
      appState.editWorkspaceDialog.open = true;
      appState.editWorkspaceDialog.editedWorkspace = action.data;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.WORKSPACE_CLOSE_EDIT_WORKSPACE_DIALOG:
      appState.editWorkspaceDialog.open = false;
      appState.editWorkspaceDialog.editedWorkspace = null;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.WORKSPACE_SUBMIT_EDIT_WORKSPACE_DIALOG:
      workspaceStoreInstance.submitEditWorkspaceDialog(action.data);
      //no change, because it will go only after the submission is successful
      break;
    case ActionTypes.MAP_OPEN_NEW_MAP_DIALOG:
      appState.newMapDialog.open = true;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_NEW_MAP_DIALOG:
      appState.newMapDialog.open = false;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_SUBMIT_NEW_MAP_DIALOG:
      workspaceStoreInstance.submitNewMapDialog(action.data);
      break;
    case ActionTypes.MAP_OPEN_EDIT_MAP_DIALOG:
      appState.editMapDialog.open = true;
      appState.editMapDialog.mapID = (action.data);
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_EDIT_MAP_DIALOG:
      appState.editMapDialog.open = false;
      appState.editMapDialog.mapID = null;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_SUBMIT_EDIT_MAP_DIALOG:
      appState.w_maps[action.data.mapID].map.user = action.data.mapData.user;
      appState.w_maps[action.data.mapID].map.purpose = action.data.mapData.purpose;
      appState.w_maps[action.data.mapID].map.name = action.data.mapData.name;
      workspaceStoreInstance.saveMap(action.data.mapID, function() {
        workspaceStoreInstance.io.emit('map', {
          type: 'change',
          id: action.data.mapID
        });
        appState.editMapDialog.open = false;
        appState.editMapDialog.mapID = null;
        workspaceStoreInstance.fetchSingleWorkspaceInfo(appState.w_maps[action.data.mapID].map.workspace);
      });
      break;
    case ActionTypes.MAP_OPEN_EDIT_NODE_DIALOG:
      appState.editNodeDialog.open = true;
      appState.editNodeDialog.mapID = action.data.mapID;
      appState.editNodeDialog.nodeID = action.data.nodeID;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_EDIT_NODE_DIALOG:
      appState.editNodeDialog.open = false;
      appState.editNodeDialog.mapID = null;
      appState.editNodeDialog.nodeID = null;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_SUBMIT_EDIT_NODE_DIALOG:
      $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + action.data.workspaceID+ '/map/' + action.data.mapID + '/node/' + action.data.nodeID,
        data: {
          name: action.data.params.name,
          type : action.data.params.type
        },
        success: function(data2) {
          workspaceStoreInstance.io.emit('map', {
            type: 'change',
            id: action.data.mapID
          });
          appState.editNodeDialog.open = false;
          appState.editNodeDialog.mapID = null;
          appState.editNodeDialog.nodeID = null;
          appState.w_maps[action.data.mapID] = data2;
          workspaceStoreInstance.emitChange();
        }.bind(this)
      });
      break;
    case ActionTypes.PALETTE_DRAG_STOPPED:
      var coords = CanvasStore.normalizeComponentCoord(action.data);
      if(action.type === Constants.SUBMAP){
        // this is a dropped submap. The user should see a possibility to select one of exisiting submaps.
        appState.createSubmapDialog.open=true;
        appState.createSubmapDialog.coords = coords;
        appState.createSubmapDialog.listOfNodesToSubmap=[];
        appState.createSubmapDialog.mapID=action.mapID;
        $.ajax({
          type: 'GET',
          url: '/api/submaps/map/' + appState.createSubmapDialog.mapID,
          success: function(data2) {
            appState.createSubmapDialog.listOfAvailableSubmaps = data2.listOfAvailableSubmaps;
            workspaceStoreInstance.emitChange();
          }.bind(this)
        });
      } else {
        appState.newNodeDialog.coords = coords;
        appState.newNodeDialog.type = action.type;
        appState.newNodeDialog.open = true;
      }
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_NEW_NODE_DIALOG:
      appState.newNodeDialog = { //cleans up by overwriting any current data
        open: false
      };
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.SHOW_REFERENCES_SUBMAP:
      appState.showReferencesDialog.open = true;
      appState.showReferencesDialog.mapID = action.mapID;
      appState.showReferencesDialog.submapID = action.submapID;
      appState.showReferencesDialog.currentName = action.currentName;
      appState.showReferencesDialog.node = action.node;
      appState.showReferencesDialog.workspaceID = action.workspaceID;
      $.ajax({
        type: 'GET',
        url: '/api/submap/' + appState.showReferencesDialog.submapID + '/usage',
        success: function(data2) {
          appState.showReferencesDialog.referencingMaps = data2;
          workspaceStoreInstance.emitChange();
        }.bind(this)
      });
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.CLOSE_REFERENCES_SUBMAP:
      appState.showReferencesDialog = {open:false};
      workspaceStoreInstance.emitChange();
      break;
      case ActionTypes.SHOW_REFERENCES:
        appState.showReferences2Dialog.open = true;
        appState.showReferences2Dialog.node = action.node;
        appState.showReferences2Dialog.workspaceID = action.workspaceID;
        appState.showReferences2Dialog.currentName = action.currentName;
        workspaceStoreInstance.emitChange();
        break;
      case ActionTypes.CLOSE_REFERENCES:
        appState.showReferences2Dialog = {open:false};
        workspaceStoreInstance.emitChange();
        break;
    case ActionTypes.MAP_CLOSE_SUBMIT_NEW_NODE_DIALOG:
      $.ajax({
        type: 'POST',
        url: '/api/workspace/' + action.data.workspaceID+ '/map/' + action.data.mapID + '/node/',
        data: {
          name:  action.data.name,
          type: action.data.type,
          x: action.data.coords.x,
          y: action.data.coords.y
        },
        success: function(data2) {
          workspaceStoreInstance.io.emit('map', {
            type: 'change',
            id: action.data.mapID
          });
          appState.newNodeDialog = { //cleans up by overwriting any current data
            open: false
          };
          appState.w_maps[action.data.mapID] = data2;
          workspaceStoreInstance.emitChange();
        }.bind(this)
      });
      break;
    case ActionTypes.CANVAS_NODE_DRAGGED:
        $.ajax({
          type: 'PUT',
          url: '/api/workspace/' + action.data.workspaceID+ '/map/' + action.data.mapID + '/node/' + action.data.nodeID,
          data: {
            x : CanvasStore.normalizeWidth(action.data.newPos[0]),
            y : CanvasStore.normalizeHeight(action.data.newPos[1])
          },
          success: function(data2) {
            workspaceStoreInstance.io.emit('map', {
              type: 'change',
              id: action.data.mapID
            });
            appState.w_maps[action.data.mapID] = data2;
            workspaceStoreInstance.emitChange();
          }.bind(this)
        });
        break;
    case ActionTypes.CANVAS_REMOVE_NODE:
          $.ajax({
            type: 'DELETE',
            url: '/api/workspace/' + action.data.workspaceID+ '/map/' + action.data.mapID + '/node/' + action.data.nodeID,
            success: function(data2) {
              workspaceStoreInstance.io.emit('map', {
                type: 'change',
                id: action.data.mapID
              });
              appState.w_maps[action.data.mapID] = data2;
              workspaceStoreInstance.emitChange();
            }.bind(this)
          });
          break;
    case ActionTypes.CANVAS_CONNECTION_CREATED:
      $.ajax({
        type: 'POST',
        url:  '/api/workspace/' + action.data.workspaceID +
              '/map/' + action.data.mapID +
              '/node/' + action.data.sourceID +
              '/outgoingDependency/' + action.data.targetID,
        success: function(data2) {
          appState.w_maps[action.data.mapID] = data2;
          workspaceStoreInstance.io.emit('map', {
            type: 'change',
            id: action.data.mapID
          });
          workspaceStoreInstance.emitChange();
        }.bind(this)
      });
      break;
    case ActionTypes.CANVAS_CONNECTION_DELETE:
      $.ajax({
        type: 'DELETE',
        url:  '/api/workspace/' + action.data.workspaceID +
              '/map/' + action.data.mapID +
              '/node/' + action.data.sourceID +
              '/outgoingDependency/' + action.data.targetID,
        success: function(data2) {
          appState.w_maps[action.data.mapID] = data2;
          workspaceStoreInstance.io.emit('map', {
            type: 'change',
            id: action.data.mapID
          });
          workspaceStoreInstance.emitChange();
        }.bind(this)
      });
      break;
      case ActionTypes.CANVAS_ACTION_CREATED:
          $.ajax({
              type: 'POST',
              url: '/api/workspace/' + action.data.workspaceID +
                  '/map/' + action.data.mapID +
                  '/node/' + action.data.sourceID +
                  '/action/',
              data: CanvasStore.normalizeComponentCoord(action.data.pos),
              success: function(data2) {
                  appState.w_maps[action.data.mapID] = data2;
                  workspaceStoreInstance.io.emit('map', {
                      type: 'change',
                      id: action.data.mapID
                  });
                  workspaceStoreInstance.emitChange();
              }.bind(this)
          });
          break;
          case ActionTypes.CANVAS_ACTION_UPDATED:
              $.ajax({
                  type: 'PUT',
                  url: '/api/workspace/' + action.data.workspaceID +
                      '/map/' + action.data.mapID +
                      '/node/' + action.data.sourceID +
                      '/action/' + action.data.seq,
                  data: CanvasStore.normalizeComponentCoord(action.data.pos),
                  success: function(data2) {
                      appState.w_maps[action.data.mapID] = data2;
                      workspaceStoreInstance.io.emit('map', {
                          type: 'change',
                          id: action.data.mapID
                      });
                      workspaceStoreInstance.emitChange();
                  }.bind(this)
              });
              break;
          case ActionTypes.CANVAS_ACTION_DELETED:
              $.ajax({
                  type: 'DEL',
                  url: '/api/workspace/' + action.data.workspaceID +
                      '/map/' + action.data.mapID +
                      '/node/' + action.data.sourceID +
                      '/action/' + action.data.seq,
                  success: function(data2) {
                      appState.w_maps[action.data.mapID] = data2;
                      workspaceStoreInstance.io.emit('map', {
                          type: 'change',
                          id: action.data.mapID
                      });
                      workspaceStoreInstance.emitChange();
                  }.bind(this)
              });
              break;
    case ActionTypes.WORKSPACE_ARCHIVE:
      $.ajax({
        type: 'DELETE',
        url: '/api/workspace/' + action.data,
        success: function(data2) {
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case ActionTypes.MAP_ARCHIVE:
      $.ajax({
        type: 'DELETE',
        url: '/api/map/' + action.data.mapID,
        success: function(data2) {
          workspaceStoreInstance.io.emit('map', {
            type: 'change',
            id: action.data.mapID
          });
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case ActionTypes.MAP_CLOSE_NEW_SUBMAP_DIALOG:
      appState.createSubmapDialog = {open:false};
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.SHOW_SUBMAP_DIALOG:
      appState.createSubmapDialog.open=true;
      appState.createSubmapDialog.listOfNodesToSubmap=action.data.nodes;
      appState.createSubmapDialog.mapID=action.data.mapID;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_SUBMAP:
        $.ajax({
          type: 'PUT',
          url: '/api/map/' + appState.createSubmapDialog.mapID + '/submap',
          dataType: 'json',
          data : {
            name : action.name,
            listOfNodesToSubmap : appState.createSubmapDialog.listOfNodesToSubmap,
            coords: appState.createSubmapDialog.coords
          },
          success: function(data2) {
            workspaceStoreInstance.io.emit('map', {
              type: 'change',
              id: appState.createSubmapDialog.mapID
            });
            appState.w_maps[appState.createSubmapDialog.mapID] = data2;
            appState.createSubmapDialog = {open:false};
            workspaceStoreInstance.updateWorkspaces(); // this emits change
          }.bind(this)
        });
        break;
    case ActionTypes.MAP_REF_SUBMAP:
        $.ajax({
          type: 'PUT',
          url: '/api/map/' + appState.createSubmapDialog.mapID + '/submap/' + action.refMapID,
          dataType: 'json',
          data : {
            coords: appState.createSubmapDialog.coords
          },
          success: function(data2) {
            workspaceStoreInstance.io.emit('map', {
              type: 'change',
              id: appState.createSubmapDialog.mapID
            });
            appState.w_maps[appState.createSubmapDialog.mapID] = data2;
            appState.createSubmapDialog = {open:false};
            workspaceStoreInstance.updateWorkspaces(); // this emits change
          }.bind(this)
        });
        break;
    default:
      return;
  }

});

export default workspaceStoreInstance;
