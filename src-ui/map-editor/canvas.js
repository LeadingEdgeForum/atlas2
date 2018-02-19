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
/* globals document */
/* globals window */

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {Glyphicon, Popover, OverlayTrigger} from 'react-bootstrap';
var _ = require('underscore');
import SingleMapActions from './single-map-actions';
import CanvasActions from './canvas-actions';
import NewActionActions from './dialogs/new-action/new-action-actions';
var MapComponent = require('./map-component');
var ArrowEnd = require('./arrow-end');
var Comment = require('./comment');

import {
  userEndpointOptions,
  endpointOptions,
  actionEndpointOptions,
  moveEndpointOptions,
  mapCanvasStyle,
  mapCanvasHighlightStyle,
  getElementOffset
} from './component-styles';

//remove min to fix connections
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
jsPlumb.registerConnectionType("constraint", {paintStyle : {stroke:'#EC7063'}});
jsPlumb.registerConnectionType("flow", {paintStyle : {stroke:'#1ABC9C'}});

jsPlumb.registerConnectionType("movement", {paintStyle : {stroke:'orange'}});
jsPlumb.registerConnectionType("antimovement", {paintStyle : {stroke:'#E74C3C'}});


var setContainer = function(input) {
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  jsPlumb.setContainer(input);
};

/*
This scope represents actions, ie components that will advance in evolution
*/
const WM_ACTION_EFFORT = "WM_Action_EFFORT";
const WM_USER_DEPENDENCY = "WM_Users";

export default class MapCanvas extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.canvasStore){
      this.state = this.props.canvasStore.getCanvasState();
    }
    this.handleResize = this.handleResize.bind(this);
    this.setContainer = this.setContainer.bind(this);
    this.beforeDropListener = this.beforeDropListener.bind(this);
    this.connectionDragStop = this.connectionDragStop.bind(this);
    this.putScope = this.putScope.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.reconcileDependencies = this.reconcileDependencies.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.overlayClickHandler = this.overlayClickHandler.bind(this);
    this.reconcileComponentDependencies = this.reconcileComponentDependencies.bind(this);
    this.updateOverlaysVisiblityAndType = this.updateOverlaysVisiblityAndType.bind(this);
    this.getOverlays = this.getOverlays.bind(this);
    this.constructEffortOverlays = this.constructEffortOverlays.bind(this);
    this.cleanupConnectionOverlays = this.cleanupConnectionOverlays.bind(this);
    this.reconcileActionEffort = this.reconcileActionEffort.bind(this);
    this.calculateCanvasSize = this.calculateCanvasSize.bind(this);
  }

  beforeDropListener(connection) {
    var scope = connection.scope;
    // no connection to self
    if (connection.sourceId === connection.targetId) {
      return false;
    }
    // no duplicate connections - TODO: check that in app state
    if (jsPlumb.getConnections({
      scope: scope,
      source: connection.sourceId,
      target: connection.targetId
    }, true).length > 0) {
      //connection already exists, so do not do anything
      return false;
    }
    if (scope === WM_USER_DEPENDENCY) {
      SingleMapActions.recordUserConnection(this.props.workspaceID, this.props.mapID, connection.sourceId, connection.targetId);
    } else if (scope === jsPlumb.Defaults.Scope) {
      SingleMapActions.recordConnection(this.props.workspaceID, this.props.mapID, connection.sourceId, connection.targetId);
    } else if (scope === WM_ACTION_EFFORT) {
      NewActionActions.openAddActionReplacementDialog(this.props.workspaceID, this.props.mapID, connection.sourceId, connection.targetId);
    }
    //never create connection as they will be reconciled
    return false;
  }

  putScope(source){
    return {
      scope : source.endpoint.scope,
      established : false
    };
  }

  connectionDragStop(info, e) {
      /*
      * If target id starts with jsPlumb, it is not a node that was created by the user,
      * which means it is a temporary node created as a result of drop. Hence,
      * we are not dropping the connection on any component, so it is a free action,
      * improving a component.
      */
      if (info.getData().scope === WM_ACTION_EFFORT && info.targetId.startsWith('jsPlumb')) {
          var coords = this.props.canvasStore.normalizeComponentCoord([e.x, e.y]);
          NewActionActions.openAddActionDialog(this.props.mapID, info.sourceId, {
            pos: [coords.x, coords.y]
          });
      }
  }

  setContainer(input) {
    this.input = input;
    if (input === null) {
      //noop - component was destroyed, no need to worry about draggable
      return;
    }
    jsPlumb.setContainer(input);
    if (!this.props.background) {
        //this method is called multiple times, and we want to have only one listener attached at every point of time
        jsPlumb.unbind("beforeDrop", this.beforeDropListener);
        jsPlumb.unbind("beforeDrag", this.putScope);
        jsPlumb.unbind("beforeStartDetach", this.putScope);
        jsPlumb.unbind("connectionDragStop", this.connectionDragStop);
        jsPlumb.bind("beforeDrop", this.beforeDropListener);
        jsPlumb.bind("beforeDrag", this.putScope);
        jsPlumb.bind("beforeStartDetach", this.putScope);
        jsPlumb.bind("connectionDragStop", this.connectionDragStop);
    }
  }

  handleResize() {
    if (!this.input) {
      return;
    }

    let windowHeight = window.innerHeight;
    let offset = getElementOffset(this.input).top;

    let newHeight = windowHeight - offset - 20; // some margin
    if (newHeight < 500) {
      newHeight = 500;
    }
    if (mapCanvasStyle.height !== newHeight) {
      mapCanvasStyle.height = newHeight;
    }

    var coord = {
      offset: {
        top: getElementOffset(this.input).top,
        left: getElementOffset(this.input).left
      },
      size: {
        width: this.input.offsetWidth,
        height: newHeight //this.input.offsetHeight
      }
    };
    let _this = this;
    _this.setState({
      coords: coord
    });
    CanvasActions.updateCanvasSizeAndOffset(coord);
    _this.forceUpdate();
  }

  componentDidMount() {
    if (this.props.canvasStore) {
        this.props.canvasStore.addChangeListener(this._onChange.bind(this));
        window.addEventListener('resize', this.handleResize);
    }
    var _this = this;
    jsPlumb.ready(function() {
        _this.handleResize();
    });
  }

  componentWillUnmount() {
    if (this.props.canvasStore) {
        this.props.canvasStore.removeChangeListener(this._onChange.bind(this));
        window.removeEventListener('resize', this.handleResize);
    }
    jsPlumb.reset();
  }

  _onChange() {
      this.setState(this.props.canvasStore.getCanvasState());
  }

  componentDidUpdate(prevProps, prevState) {
    var _this = this;
    jsPlumb.ready(function() {
      _this.reconcileDependencies();
      jsPlumb.setSuspendDrawing(false, true);
    });
  }

  getOverlays(fromStyle, menuDefinition, labelText) {
    if (fromStyle) {
        fromStyle = [].concat(fromStyle);
    } else {
        fromStyle = [];
    }
    var menuItems = [];
    for(let i = 0; i < menuDefinition.length; i++){
      let hint = <Popover key={'menu' + i} id={'menu' + i}>{menuDefinition[i][1]}</Popover>;
      let glyph = <Glyphicon glyph={menuDefinition[i][0]} onClick={menuDefinition[i][2]} style={{zIndex: 50,  cursor: 'pointer'}} key={'menu' + i}/>;

      menuItems.push(<OverlayTrigger key={'menutrigger' + i} overlay={hint} placement="top" trigger={['hover', 'focus']}>{glyph}</OverlayTrigger>);
      if(i !== menuDefinition.length - 1){
        menuItems.push(<span key={'menu' + i + 'span'}>&nbsp;</span>);
      }
    }
    var menu = <div style={{color:'silver'}}>{menuItems}</div>;
    var root = document.createElement('div');
    ReactDOM.render(menu, root);
    fromStyle.push([
      "Custom", {
        create: function(component) {
          component.menu = root;
          return root;
        },
        location: 0.5,
        id: "menuOverlay",
        key: "menuOverlay"
      }
    ]);
    let fontStyle = this.props.canvasStore.getOtherFontSize() + 'px Helvetica Neue,Helvetica,Arial,sans-serif';
    fromStyle.push([
        "Label", {
          label:labelText,
          id : "label",
          labelStyle :{
            font : fontStyle,
            fill: 'white',
            color: '#333'
          }
        }
    ]
    );
    return fromStyle;
  }

  overlayClickHandler(obj) {
    if(obj.component && obj.id !== 'label'){
      let conn = obj.component;
      conn.___overlayVisible = false;
      conn.getOverlay("menuOverlay").setVisible(conn.___overlayVisible);
      conn.getOverlay("label").setVisible(!conn.___overlayVisible);
      return; // this needs to be handled by the overlay itself
    }
    var conn = obj.component ? obj.component : obj;
    conn.___overlayVisible = !conn.___overlayVisible;
    conn.getOverlay("menuOverlay").setVisible(conn.___overlayVisible);
    conn.getOverlay("label").setVisible(!conn.___overlayVisible);
  }

  /* This method has to be called last, as manipulating types wipes overlay
     visibility */
  updateOverlaysVisiblityAndType(existingConnection, modelConnection){
    // update type
    existingConnection.clearTypes();
    if(modelConnection.displayData.connectionType === 20){
      existingConnection.addType('flow');
    } else if (modelConnection.displayData.connectionType === 10) {
      existingConnection.addType('constraint');
    }

    // ensure their visibility
    if(existingConnection.___overlayVisible){
      existingConnection.getOverlay("label").hide(); //overlay visible means menu, not label
      existingConnection.getOverlay("menuOverlay").show();
    } else {
      existingConnection.getOverlay("label").show();
      existingConnection.getOverlay("menuOverlay").hide();
    }

    existingConnection.getOverlay("label").setLabel(modelConnection.displayData.label || "");
  }

  constructEffortOverlays(node, desiredAction){
    let result = [];
    // standard edit action
    result.push(["pencil", "Edit", SingleMapActions.openEditActionDialog.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id, desiredAction.shortSummary, desiredAction.description)]);

    if (desiredAction.state === "PROPOSED") {
      result.push(["play",
      "Mark project as being in execution.", SingleMapActions.updateAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id, null, null, null, 'EXECUTING')]);
      result.push(["eject", "Reject a project (it will not be executed).", SingleMapActions.updateAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id, null, null, null, 'REJECTED')]);
    }

    if(desiredAction.state === "EXECUTING"){
      result.push(["thumbs-up", "Mark project as successfully executed.", SingleMapActions.updateAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id, null, null, null, 'SUCCEEDED')]);
      result.push(["thumbs-down", "Mark project as executed but without meeting expectations.", SingleMapActions.updateAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id, null, null, null, 'FAILED')]);
    }

    //standard remove action
    result.push(["remove", "Delete the project as it never existed.", SingleMapActions.deleteAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, node._id, desiredAction._id)]);
    return result;
  }

  cleanupConnectionOverlays(connection){
    // the code below may look like an overkill, but jsplumb loves leaving
    // artifacts, and we need to reatach changed overlays
    connection.getOverlay("label").hide();
    connection.getOverlay("menuOverlay").hide();
    //delete them
    connection.removeOverlay("menuOverlay");
    if(connection.menu){
        ReactDOM.unmountComponentAtNode(connection.menu);
    }
    connection.removeOverlay("label");
  }


  /*
   * Universal method
   */
  reconcileScopeConnections(scope, desiredConnections, anchors, endpointOptions){
    let existingConnections = jsPlumb.getConnections({
      scope: scope
    });

    // nothing is desired, so wipeout every connection
    if(!desiredConnections || desiredConnections.length === 0){
      // remove all component dependencies
      for (let i = 0; i < existingConnections.length; i++) {
        if(existingConnections[i].menu){
            ReactDOM.unmountComponentAtNode(existingConnections[i].menu);
        }
        jsPlumb.deleteConnection(existingConnections[i]);
      }
      return;
    }

    // and now, for every existing connection
    for(let i = 0; i < existingConnections.length ; i++){
      let existingConnection = existingConnections[i];
      let modelConnection = null;
      let shouldExist = false;
      for (let k = desiredConnections.length - 1; k >= 0 ; k--) {
        if ((desiredConnections[k].sourceId === existingConnection.sourceId) &&
            (desiredConnections[k].targetId === existingConnection.targetId)) {
              //since the connection has a canvas counterpart, we will only update it
              // but we do not have to recreate it
              modelConnection = desiredConnections.splice(k,1)[0];
              shouldExist = true;
              break;
        }
      }

      this.cleanupConnectionOverlays(existingConnection);

      if(!shouldExist){
        //delete connection, that was easy
        jsPlumb.deleteConnection(existingConnection);
      } else {
        for (let j = 0; j < modelConnection.overlays.length; j++) {
            existingConnection.addOverlay(modelConnection.overlays[j]);
        }
        this.updateOverlaysVisiblityAndType(existingConnection, modelConnection);
      }
    }

    // and, at this point, we have only connections that should exist but do not,
    // so let's create them.
    for(let i = 0; i < desiredConnections.length; i++){
      let connectionToCreate = desiredConnections[i];
      let createdConnection = jsPlumb.connect({
          source: connectionToCreate.sourceId,
          target: connectionToCreate.targetId,
          scope: scope,
          anchors: anchors,
          paintStyle: endpointOptions.connectorStyle,
          endpoint: endpointOptions.endpoint,
          connector: endpointOptions.connector,
          endpointStyles: [
              endpointOptions.paintStyle, endpointOptions.paintStyle
          ],
          overlays: connectionToCreate.overlays
      });
      createdConnection.___overlayVisible = false;
      this.updateOverlaysVisiblityAndType(createdConnection, connectionToCreate);
      createdConnection.bind('click', this.overlayClickHandler);
    }
  }


  reconcileComponentDependencies(nodes) {
    let workspaceId = this.props.workspaceID;
    let mapId = this.props.mapID;
    let connectionsWeShouldHave = [];
    if (!(nodes && nodes.length)) {
      this.reconcileScopeConnections(jsPlumb.Defaults.Scope, connectionsWeShouldHave);
      return;
    }

    //otherwise, build a list of connections we should have
    for (let i = 0; i < nodes.length; i++) {
      let affectedNode = nodes[i];
      for (let j = 0; j < affectedNode.dependencies.length; j++) {
        let affectedDependency = affectedNode.dependencies[j];
        //we are interested in the dep if and only if it is visible on a given map
        let visible = false;
        for (let k = 0; k < affectedDependency.visibleOn.length; k++) {
          if (affectedDependency.visibleOn[k] === mapId) {
            visible = true;
          }
        }
        if (visible) {
          let displayData = affectedDependency.displayData || {};
          connectionsWeShouldHave.push({
            sourceId: affectedNode._id,
            targetId: affectedDependency.target,
            displayData: displayData,
            overlays: this.getOverlays(null, [
              ["pencil", "Edit", SingleMapActions.openEditConnectionDialog.bind(SingleMapActions,
                this.props.workspaceID,
                this.props.mapID,
                affectedNode._id,
                affectedDependency.target,
                displayData.label,
                displayData.description,
                displayData.connectionType)],
              ["remove", "Delete", SingleMapActions.deleteConnection.bind(SingleMapActions, workspaceId, mapId, affectedNode._id, affectedDependency.target)]
            ], displayData.label)
          });
        }
      }
    }

    this.reconcileScopeConnections(jsPlumb.Defaults.Scope, connectionsWeShouldHave, ["BottomCenter", "TopCenter"], endpointOptions);
  }

  reconcileActionEffort(nodes) {
    let connectionsWeShouldHave = [];
    if (!(nodes && nodes.length)) {
      this.reconcileScopeConnections(WM_ACTION_EFFORT, connectionsWeShouldHave);
      return;
    }
    // iterate over all nodes
    let actions = [];
    let _this = this;
    for (let i = 0; i < this.props.nodes.length; i++) {
        let node = this.props.nodes[i];
        let desiredActions = node.actions ? node.actions.filter(action => ( (action.type ==='EFFORT' && action.evolution && action.visibility)) || (action.type === 'REPLACEMENT' && action.targetId)) : [];
        desiredActions = desiredActions.map(function(action){ // jshint ignore:line
          return {
            sourceId : node._id,
            targetId : action.targetId || action._id,
            overlays: _this.getOverlays(actionEndpointOptions.connectorOverlays, _this.constructEffortOverlays(node, action), action.shortSummary),
            displayData : {
              description : action.description || "",
              label : action.shortSummary || ""
            }
          };
        });
        actions = actions.concat(desiredActions);
    }

    this.reconcileScopeConnections(WM_ACTION_EFFORT, actions, ["Right", "Left"], actionEndpointOptions);
  }

  reconcileDependencies() {
      this.reconcileComponentDependencies(this.props.nodes);
      this.reconcileActionEffort(this.props.nodes);
  }

  calculateCanvasSize(){
    let size = {
      width: 0,
      height: 0
    };
    // this is for server side rendering - we set the size declaratively
    if(global.OPTS && global.OPTS.coords){
      size = global.OPTS.coords.size;
    } else if (this.state.coords && this.state.coords.size) {
      size = this.state.coords.size;
    }
    return size;
  }


  render() {
    jsPlumb.setSuspendDrawing(true, true); // this will be cleaned in did update

    var style = _.clone(mapCanvasStyle);
    if (this.state && this.state.dropTargetHighlight) {
      style = _.extend(style, mapCanvasHighlightStyle);
    }

    let size = this.calculateCanvasSize();

    var components = null;
    var arrowends = [];


    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var state = this.state;
    var canvasStore = this.props.canvasStore;

    if (this.props.nodes) {
      components = this.props.nodes.map(function(component) {

        let actions = component.actions ? component.actions.filter(action => action.type === 'EFFORT') : [];

        for (var j = 0; j < actions.length; j++) {
          arrowends.push(
            <ArrowEnd workspaceID = {workspaceID}
              canvasStore = {canvasStore}
              mapID = {mapID}
              node = {component}
              size = {size}
              id = {actions[j]._id}
              key = {actions[j]._id}
              action = {actions[j]}/>);
        }

        return (
            <MapComponent
              canvasStore={canvasStore}
              workspaceID={workspaceID}
              mapID={mapID} node={component}
              size={size}
              key={component._id}
              id={component._id}
              inertia={component.inertia}/>);
      });
    }

    var comments = [];
    if (this.props.comments) {
        for (var i = 0; i < this.props.comments.length; i++) {
              var focused = false;
              if (state && state.currentlySelectedComments) {
                  for (var ii = 0; ii < state.currentlySelectedComments.length; ii++) {
                      if (this.props.comments[i]._id === state.currentlySelectedComments[ii]) {
                          focused = true;
                      }
                  }
              }
              comments.push(
                <Comment workspaceID = {workspaceID}
                  canvasStore = {canvasStore}
                  mapID = {mapID}
                  comment = {this.props.comments[i]}
                  id = {this.props.comments[i]._id}
                  key = {this.props.comments[i]._id}
                  size = {size}
                  focused = {focused}
                  />);
            }
        }

    return (
      <div style={style} ref={input => this.setContainer(input)} onClick={CanvasActions.deselectNodesAndConnections}>
        {components}
        {arrowends}
        {comments}
      </div>
    );
  }
}
