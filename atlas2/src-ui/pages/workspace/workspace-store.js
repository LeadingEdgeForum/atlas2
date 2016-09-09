/*jshint esversion: 6 */

import Store from '../../store.js';
import Dispatcher from '../../dispatcher';
import Constants from '../../constants';
import $ from 'jquery';

let appState = {
  newWorkspaceDialog: {
    open: false
  },
  newMapDialog: {
    open: false
  },
  workspaces: {},
  singleWorkspace: {},
  canvasState: {
    highlight: false,
    coords: null,
    focusedNodeID: null
  },
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
  editUserJourneyDialog : {
    open: false
  },
  w_maps: {}
};

var workspacesQueriedForFirstTime = false;
class WorkspaceStore extends Store {

  constructor() {
    super();
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
          loading: true,
          journey:[]
        }
      };
    }
    return appState.w_maps[mapID];
  }

  recordNewComponent(type, params) { //normalizes the drop and opens the new node dialog
    var relativeToCanvasPosX = params.pos[0]/*absolute pos of drop*/ - appState.canvasState.coords.offset.left/*absolute pos of canvas*/;
    var relativeToCanvasPosY = params.pos[1]/*absolute pos of drop*/ - appState.canvasState.coords.offset.top/*absolute pos of canvas*/;

    var universalCoordX = relativeToCanvasPosX / appState.canvasState.coords.size.width;
    var universalCoordY = relativeToCanvasPosY / appState.canvasState.coords.size.height;
    appState.newNodeDialog.open = true;
    appState.newNodeDialog.type = type;
    appState.newNodeDialog.coords = {
      x: universalCoordX,
      y: universalCoordY
    };
  }

  newNodeCreated(data) { // the new map dialog confirms the component creation
    var mapID = data.mapID;
    if (!mapID) {
      console.error('No mapID while creating a node');
    }
    if (!(data.name && data.type && data.coords)) {
      console.error('Insufficient data', data);
    }
    if (!appState.w_maps[mapID]) {
      appState.w_maps[mapID] = {};
    }
    var currentMap = appState.w_maps[mapID].map;
    if (!currentMap.nodes) {
      currentMap.nodes = [];
    }
    currentMap.nodes.push({name: data.name, type: data.type, x: data.coords.x, y: data.coords.y});
    this.saveMap(mapID);
  }

  getNewNodeDialogState() {
    return appState.newNodeDialog;
  }

  getCanvasState() {
    return appState.canvasState;
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

  isMapEditCustomerJourneyOpen() {
    if (appState && appState.editUserJourneyDialog) {
      return appState.editUserJourneyDialog;
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

  saveNewJourneyStep(mapID, position, step){
    $.ajax({
      type: 'POST',
      url: '/api/map/' + mapID + '/journeystep/',
      dataType: 'json',
      data: {
        position:position,
        step:step
      },
      /*better do not be too fast with editing*/
      success: function(data2) {
        appState.w_maps[mapID] = data2;
        this.emitChange();
      }.bind(this)
    });
  }

  deleteJourneyStep(mapID, stepID){
    $.ajax({
      type: 'DELETE',
      url: '/api/map/' + mapID + '/journeystep/' + stepID,
      /*better do not be too fast with editing*/
      success: function(data2) {
        appState.w_maps[mapID] = data2;
        this.emitChange();
      }.bind(this)
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
      console.error('No worksapceId in getWorkspaceInfo');
    }

    if (appState.singleWorkspace[workspaceID]) {
      return appState.singleWorkspace[workspaceID];
    }

    this.fetchSingleWorkspaceInfo(workspaceID);

    return {
      workspace: {
        name: "Loading...",
        maps: []
      },
      loading: true
    };
  }

}
let workspaceStoreInstance = new WorkspaceStore();

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
    case ActionTypes.MAP_OPEN_EDIT_CUSTOMER_JOURNEY_DIALOG:
        appState.editUserJourneyDialog.open = true;
        workspaceStoreInstance.emitChange();
        break;
    case ActionTypes.MAP_CLOSE_EDIT_CUSTOMER_JOURNEY_DIALOG:
        appState.editUserJourneyDialog.open = false;
        workspaceStoreInstance.emitChange();
        break;
    case ActionTypes.MAP_CLOSE_SUBMIT_CUSTOMER_JOURNEY_DIALOG:
        // workspaceStoreInstance.submitNewMapDialog(action.data);
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
      workspaceStoreInstance.saveMap(action.data.mapID, function() {
        appState.editMapDialog.open = false;
        appState.editMapDialog.mapID = null;
        workspaceStoreInstance.fetchSingleWorkspaceInfo(appState.w_maps[action.data.mapID].map.workspace);
      });
      break;
    case ActionTypes.MAP_OPEN_EDIT_NODE_DIALOG:
      console.log(action.data);
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
      console.log(action.data);
      for (var i = 0; i < appState.w_maps[action.data.mapID].map.nodes.length; i++) {
        var _tempNode = appState.w_maps[action.data.mapID].map.nodes[i];
        if (action.data.nodeID === _tempNode._id) {
          _tempNode.name = action.data.params.name;
          _tempNode.type = action.data.params.type;
          break;
        }
      }
      workspaceStoreInstance.saveMap(action.data.mapID, function() {
        appState.editNodeDialog.open = false;
        appState.editNodeDialog.mapID = null;
        appState.editNodeDialog.nodeID = null;
      });
      break;
    case ActionTypes.MAP_ADD_JOURNEY_STEP:
        var mapID = action.data.mapID;
        var name = action.data.name;
        var interaction = action.data.interaction;
        var position = action.data.position;
        workspaceStoreInstance.saveNewJourneyStep(mapID, position, {name:name, interaction:interaction});
        break;
    case ActionTypes.MAP_DELETE_JOURNEY_STEP:
        var mapID = action.data.mapID;
        var stepID = action.data.stepID;
        workspaceStoreInstance.deleteJourneyStep(mapID, stepID);
        break;
    case ActionTypes.PALETTE_DRAG_STARTED:
      appState.canvasState.highlight = true;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.PALETTE_DRAG_STOPPED:
      appState.canvasState.highlight = false;
      workspaceStoreInstance.recordNewComponent(action.type, action.data);
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS_RESIZED:
      appState.canvasState.coords = action.data;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_NEW_NODE_DIALOG:
      appState.newNodeDialog = { //cleans up by overwriting any current data
        open: false
      };
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_SUBMIT_NEW_NODE_DIALOG:
      //      console.log("action", action);
      appState.newNodeDialog = { //cleans up by overwriting any current data
        open: false
      };
      workspaceStoreInstance.newNodeCreated(action.data);
      workspaceStoreInstance.emitChange(); //TODO: emit this by save
      break;
    case ActionTypes.CANVAS_FOCUS_NODE:
      appState.canvasState.focusedNodeID = action.data;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS_BLUR_NODES:
      appState.canvasState.focusedNodeID = null;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.CANVAS_NODE_DRAGGED:
      var _map = appState.w_maps[action.data.mapID].map;
      for (var i = 0; i < _map.nodes.length; i++) { // jshint ignore:line
        if (_map.nodes[i]._id === action.data.nodeID) {
          //normalize staff
          _map.nodes[i].x = action.data.newPos[0] / appState.canvasState.coords.size.width;
          _map.nodes[i].y = action.data.newPos[1] / appState.canvasState.coords.size.height;
        }
      }
      appState.canvasState.focusedNodeID = null;
      workspaceStoreInstance.saveMap(action.data.mapID);
      break;
    case ActionTypes.CANVAS_CONNECTION_CREATED:
      var _map = appState.w_maps[action.data.mapID].map; // jshint ignore:line
      _map.connections.push({source: action.data.source, target: action.data.target, scope: action.data.scope});
      workspaceStoreInstance.saveMap(action.data.mapID);
      break;
    case ActionTypes.CANVAS_CONNECTION_DELETE:
      var _map = appState.w_maps[action.data.mapID].map; // jshint ignore:line
      for (var i = 0; i < _map.connections.length; i++) { // jshint ignore:line
        var connection = _map.connections[i];
        if ((connection.source = action.data.source) && (connection.target = action.data.target) && (connection.scope = action.data.scope)) {
          _map.connections.splice(i, 1);
          break;
        }
      }
      workspaceStoreInstance.saveMap(action.data.mapID);
      break;
    case ActionTypes.CANVAS_REMOVE_NODE:
      var _map = appState.w_maps[action.data.mapID].map; // jshint ignore:line
      for (var i = 0; i < _map.nodes.length; i++) { // jshint ignore:line
        if (_map.nodes[i]._id === action.data.nodeID) {
          _map.nodes.splice(i, 1);
          break;
        }
      }
      var connectionsCount = _map.connections.length;
      while (connectionsCount--) {
        if ((_map.connections[connectionsCount].source === action.data.nodeID) || (_map.connections[connectionsCount].target === action.data.nodeID)) {
          _map.connections.splice(connectionsCount, 1);
        }
      }
      for (var i = 0; i < _map.connections.length; i++) { // jshint ignore:line
        if (_map.nodes[i] === action.data.nodeID) {
          _map.splice(i, 1);
        }
      }
      workspaceStoreInstance.saveMap(action.data.mapID);
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
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case Constants.ACTION_TYPES.NEW_CAPABILITY_WITH_ASSIGN:
      $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + action.data.workspaceID + '/capabilityCategory/' + action.data.capabilityCategoryID,
        data: {
          name: action.data.capabilityName,
          mapID: action.data.mapID,
          nodeID: action.data.nodeID
        },
        success: function(data2) {
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case Constants.ACTION_TYPES.ASSIGN_NODE_TO_CAPABILITY:
      $.ajax({
        type: 'PUT',
        url: '/api/workspace/' + action.data.workspaceID + '/capabilityCategory/' + action.data.capabilityCategoryID + '/capability/' + action.data.capabilityID,
        data: {
          mapID: action.data.mapID,
          nodeID: action.data.nodeID
        },
        success: function(data2) {
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case Constants.ACTION_TYPES.CLEAR_NODE_ASSIGNEMENT:
      $.ajax({
        type: 'DELETE',
        url: '/api/map/' + action.data.mapID + '/node/' + action.data.nodeID + '/capability/',
        success: function(data2) {
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    case Constants.ACTION_TYPES.MAKE_NODES_REFERENCED:
      $.ajax({
        type: 'PUT',
        url: '/api/reference/' + action.data.nodeBeingAssignedMapID + '/' + action.data.nodeBeingAssignedID + '/' + action.data.referenceMapID + '/' + action.data.referenceNodeID,
        success: function(data2) {
          workspaceStoreInstance.fetchSingleWorkspaceInfo(action.data.workspaceID);
          workspaceStoreInstance.updateWorkspaces(); // this emits change
        }.bind(this)
      });
      break;
    default:
      return;
  }

});

export default workspaceStoreInstance;
