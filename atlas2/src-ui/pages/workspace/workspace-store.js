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
  w_maps: {}
};

var workspacesQueriedForFirstTime = false;
class WorkspaceStore extends Store {

  constructor() {
    super();
  }
  getMapInfo(mapID) {
    if (!appState.w_maps[mapID]) {
      this.serverRequest = $.get('/api/map/' + mapID, function(result) {
        console.log('map loaded', result);
        appState.w_maps[mapID] = result;
        this.emitChange();
      }.bind(this));
      return {
        map: {
          name: 'Loading...'
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
      console.log('result', result);
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
  isMapNewDialogOpen() {
    if (appState && appState.newMapDialog) {
      return appState.newMapDialog;
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

  saveMap(mapID) {
    var that = this;
    $.ajax({
      type: 'PUT',
      url: '/api/map/' + mapID,
      dataType: 'json',
      data: appState.w_maps[mapID],
      /*better do not be too fast with editing*/
      success: function(data2) {
        appState.w_maps[mapID] = data2;
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
      }
    };
  }

  getAvailableCategories(workspaceID) {
    var _categories = [];
    // var components = getAvailableComponents(workspaceID).components;
    _categories.push({description:'category for user needs'});
    _categories.push({description:'category for 1s'});
    _categories.push({description:'category for 2s'});
    _categories.push({description:'category for 3s'});
    return {categories: _categories};
  }

  getAvailableComponents(workspaceID) {
    var _components = [];
    var workspaceInfo = this.getWorkspaceInfo(workspaceID);
    if (workspaceInfo && workspaceInfo.workspace && workspaceInfo.workspace.maps && Array.isArray(workspaceInfo.workspace.maps)) {
      workspaceInfo.workspace.maps.map(item => {
        _components = _components.concat(item.nodes);
      });
    }
    return {components: _components};
  }

}
let workspaceStoreInstance = new WorkspaceStore();

let ActionTypes = Constants.ACTION_TYPES;

workspaceStoreInstance.dispatchToken = Dispatcher.register(action => {
  console.log(action);
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
    case ActionTypes.MAP_OPEN_NEW_WORKSPACE_DIALOG:
      appState.newMapDialog.open = true;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_NEW_WORKSPACE_DIALOG:
      appState.newMapDialog.open = false;
      workspaceStoreInstance.emitChange();
      break;
    case ActionTypes.MAP_CLOSE_SUBMIT_EDIT_WORKSPACE_DIALOG:
      workspaceStoreInstance.submitNewMapDialog(action.data);
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
      for (var i = 0; i < _map.nodes.length; i++) {
        if (_map.nodes[i]._id === action.data.nodeID) {
          //normalize staff
          _map.nodes[i].x = action.data.newPos[0] / appState.canvasState.coords.size.width;
          _map.nodes[i].y = action.data.newPos[1] / appState.canvasState.coords.size.height;
          console.log(_map.nodes[i]);
        }
      }
      workspaceStoreInstance.saveMap(action.data.mapID);
      break;
    default:
      return;
  }

});

export default workspaceStoreInstance;
