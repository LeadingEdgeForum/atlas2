/*jshint esversion: 6 */
/* globals document */
/* globals window */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {Glyphicon} from 'react-bootstrap';
var _ = require('underscore');
import SingleMapActions from './single-map-actions';
import CanvasActions from './canvas-actions';
var MapComponent = require('./map-component');
var HistoricComponent = require('./historic-component');
var ArrowEnd = require('./arrow-end');
var Comment = require('./comment');
import {endpointOptions, actionEndpointOptions, moveEndpointOptions} from './component-styles';

//remove min to fix connections
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
jsPlumb.registerConnectionType("constraint", {paintStyle : {stroke:'red'}});
jsPlumb.registerConnectionType("flow", {paintStyle : {stroke:'blue'}});

jsPlumb.registerConnectionType("movement", {paintStyle : {stroke:'orange'}});

//this is style applied to the place where actuall components can be drawn
var mapCanvasStyle = {
  position: 'relative',
  top: 0,
  minHeight : '500px',
  width: '98%',
  left: '2%',
  zIndex: 4
};

function getElementOffset(element)
{
    var de = document.documentElement;
    var box = element.getBoundingClientRect();
    var top = box.top + window.pageYOffset - de.clientTop;
    var left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
}

var setContainer = function(input) {
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  jsPlumb.setContainer(input);
};

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
    SingleMapActions.recordConnection(this.props.workspaceID, this.props.mapID, connection.sourceId, connection.targetId);
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
      if (info.getData().scope === 'WM_Action') {
          var coords = this.props.canvasStore.normalizeComponentCoord([e.x, e.y]);
          SingleMapActions.recordAction(this.props.workspaceID, this.props.mapID, info.sourceId, {
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
    if(this.resizeHeavyWork){
      clearTimeout(this.resizeHeavyWork);
    }

    let windowHeight =  window.innerHeight;
    let offset = getElementOffset(this.input).top;

    let newHeight = windowHeight - offset - 20; // some margin
    if(newHeight < 500) {
      newHeight = 500;
    }
    if(mapCanvasStyle.height !== newHeight){
      mapCanvasStyle.height = newHeight;
    }

    var coord = {
      offset: {
        top: getElementOffset(this.input).top,
        left: getElementOffset(this.input).left
      },
      size: {
        width: this.input.offsetWidth,
        height: newHeight//this.input.offsetHeight
      }
    };
    let _this = this;
    _this.resizeHeavyWork = setTimeout(function(){
      _this.setState({coords:coord});
      CanvasActions.updateCanvasSizeAndOffset(coord);
      _this.forceUpdate();
      _this.resizeHeavyWork = null;
    }, 100);
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
      // jsPlumb.setSuspendDrawing(false, true);
      jsPlumb.repaintEverything();
    });
  }

  getOverlays(fromStyle, menuDefinition, labelText) {
    if (fromStyle) {
        fromStyle = [].concat(fromStyle);
    } else {
        fromStyle = [];
    }
    var menuItems = [];
    for(var i = 0; i < menuDefinition.length; i++){
      menuItems.push(<Glyphicon glyph={menuDefinition[i][0]} onClick={menuDefinition[i][1]} style={{zIndex: 50,  cursor: 'pointer'}}/>);
      if(i !== menuDefinition.length - 1){
        menuItems.push(<span>&nbsp;</span>);
      }
    }
    var menu = <div style={{color:'silver'}}>{menuItems}</div>;
    var root = document.createElement('div');
    var pre2 = ReactDOM.render(menu, root);
    fromStyle.push([
      "Custom", {
        create: function(component) {
          return pre2;
        },
        location: 0.5,
        id: "menuOverlay"
      }
    ]);
    fromStyle.push([
        "Label", {
          label:labelText,
          id : "label",
          labelStyle :{
            font : '11px Helvetica Neue,Helvetica,Arial,sans-serif',
            fill: 'white',
          }
        }
    ]
    );
    return fromStyle;
  }

  overlayClickHandler(obj) {
    if(obj.component && obj.id !== 'label'){
      var conn = obj.component;
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

  reconcileDependencies() {
      var modelConnections = [];
      if (!this.props.nodes) {
          return;
      }

      for (var i = 0; i < this.props.nodes.length; i++) {
          var _node = this.props.nodes[i];
          var iterator_length = _node.outboundDependencies ?
              _node.outboundDependencies.length :
              0;
          for (var j = 0; j < iterator_length; j++) {
              var dependencyData = _node.dependencyData ?  _node.dependencyData.outbound : null;
              if(!dependencyData) {
                dependencyData = {};
              }
              modelConnections.push({
                  source: _node._id,
                  target: _node.outboundDependencies[j],
                  scope: jsPlumb.Defaults.Scope,
                  dependencyData : dependencyData[_node.outboundDependencies[j]] ? dependencyData[_node.outboundDependencies[j]] : {}
              });
          }
      }

      var canvasConnections = jsPlumb.getConnections();
      var modelIterator = modelConnections.length;
      while (modelIterator--) {
          var isCurrentModelConnectionInTheCanvas = false;
          var canvasIterator = canvasConnections.length;
          var currentModel = modelConnections[modelIterator];
          while (canvasIterator--) {
              var currentCanvas = canvasConnections[canvasIterator];
              if ((currentModel.source === currentCanvas.sourceId) && (currentModel.target === currentCanvas.targetId)) {
                  isCurrentModelConnectionInTheCanvas = true;
                  //we found graphic equivalent, so we ignore further processing of this element
                  var existing = canvasConnections.splice(canvasIterator, 1)[0];
                  existing.removeOverlay("menuOverlay");
                  existing.removeOverlay("label");
                  var overlaysToReadd = this.getOverlays(null, [
                          ["pencil", SingleMapActions.openEditConnectionDialog.bind(SingleMapActions,
                                            this.props.workspaceID,
                                            this.props.mapID,
                                            currentModel.source,
                                            currentModel.target,
                                            currentModel.dependencyData.label,
                                            currentModel.dependencyData.description,
                                            currentModel.dependencyData.type)],
                          ["remove", SingleMapActions.deleteConnection.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, currentModel.source, currentModel.target)],
                      ], currentModel.dependencyData.label
                  );
                  for (var zz = 0; zz < overlaysToReadd.length; zz++) {
                      existing.addOverlay(overlaysToReadd[zz]);
                  }
                  if(existing.___overlayVisible){
                      existing.getOverlay("label").hide();
                      existing.getOverlay("menuOverlay").show();
                  } else {
                      existing.getOverlay("menuOverlay").hide();
                      existing.getOverlay("label").show();
                  }

                  if(currentModel.dependencyData.type === '20'){
                    existing.clearTypes();
                    existing.addType('flow');
                  } else if (currentModel.dependencyData.type === '10') {
                    existing.clearTypes();
                    existing.addType('constraint');
                  } else {
                    existing.clearTypes();
                  }
              }
          }
          // model connection not found on canvas, create it
          if (!isCurrentModelConnectionInTheCanvas) {
              var connection = jsPlumb.connect({
                  source: currentModel.source,
                  target: currentModel.target,
                  scope: jsPlumb.Defaults.Scope,
                  anchors: [
                      "BottomCenter", "TopCenter"
                  ],
                  paintStyle: endpointOptions.connectorStyle,
                  endpoint: endpointOptions.endpoint,
                  connector: endpointOptions.connector,
                  endpointStyles: [
                      endpointOptions.paintStyle, endpointOptions.paintStyle
                  ],
                  overlays: this.getOverlays(null, [
                    ["pencil", SingleMapActions.openEditConnectionDialog.bind(SingleMapActions,
                                      this.props.workspaceID,
                                      this.props.mapID,
                                      currentModel.source,
                                      currentModel.target,
                                      currentModel.dependencyData.label,
                                      currentModel.dependencyData.description,
                                      currentModel.dependencyData.type)],
                      ["remove", SingleMapActions.deleteConnection.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, currentModel.source, currentModel.target)]
                  ], currentModel.dependencyData.label)
              });
              connection.___overlayVisible = false;
              connection.getOverlay("menuOverlay").hide();
              connection.getOverlay("label").show();
              connection.bind('click', this.overlayClickHandler);
              if(currentModel.dependencyData.type === '20'){
                connection.clearTypes();
                connection.addType('flow');
              } else if (currentModel.dependencyData.type === '10') {
                connection.clearTypes();
                connection.addType('constraint');
              } else {
                connection.clearTypes();
              }
          }
      }
      //clean up unnecessary canvas connection (no counterpart in model)
      for (var z = 0; z < canvasConnections.length; z++) {
          canvasConnections[z].removeOverlay("menuOverlay");
          canvasConnections[z].removeOverlay("label");
          jsPlumb.deleteConnection(canvasConnections[z]);
      }

      // iterate over all nodes
      for (var ii = 0; ii < this.props.nodes.length; ii++) {
          var __node = this.props.nodes[ii];
          var desiredActions = __node.action;
          var existingActions = jsPlumb.getConnections({
              scope: "WM_Action",
              source: '' + __node._id
          });
          // for every existing action
          for (var jj = 0; jj < existingActions.length; jj++) {
              var desired = false;
              for (var kk = 0; kk < desiredActions.length; kk++) {
                  if (existingActions[jj].targetId === desiredActions[kk]._id) {
                      desired = true;
                  }
              }
              // if not desired - remove it
              if (!desired) {
                  jsPlumb.deleteConnection(existingActions[jj]);
              }
          }
          // now we have only desired connections, but some may be missing
          for (var ll = 0; ll < desiredActions.length; ll++) {
              var existingNodeConnection = jsPlumb.getConnections({
                  scope: "WM_Action",
                  source: '' + __node._id,
                  target: '' + desiredActions[ll]._id
              });
              if (existingNodeConnection.length === 0) {
                  var connection = jsPlumb.connect({
                      source: __node._id,
                      target: desiredActions[ll]._id,
                      scope: "WM_Action",
                      anchors: [
                          "Right", "Left"
                      ],
                      paintStyle: actionEndpointOptions.connectorStyle,
                      endpoint: actionEndpointOptions.endpoint,
                      connector: actionEndpointOptions.connector,
                      endpointStyles: [
                          actionEndpointOptions.paintStyle, actionEndpointOptions.paintStyle
                      ],
                      overlays: this.getOverlays(actionEndpointOptions.connectorOverlays, [
                              ["pencil", SingleMapActions.openEditActionDialog.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, __node._id, desiredActions[ll]._id, desiredActions[ll].shortSummary, desiredActions[ll].description)],
                              ["remove", SingleMapActions.deleteAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, __node._id, desiredActions[ll]._id)]
                          ],
                          desiredActions[ll].shortSummary
                      )
                  });
                  connection.___overlayVisible = false;
                  connection.getOverlay("menuOverlay").hide();
                  connection.getOverlay("label").show();
                  connection.bind('click', this.overlayClickHandler);
              } else {
                  existingNodeConnection[0].removeOverlay("menuOverlay");
                  existingNodeConnection[0].removeOverlay("label");
                  var overlaysToReadd = this.getOverlays(null, [
                          ["pencil", SingleMapActions.openEditActionDialog.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, __node._id, desiredActions[ll]._id, desiredActions[ll].shortSummary, desiredActions[ll].description)],
                          ["remove", SingleMapActions.deleteAction.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, __node._id, desiredActions[ll]._id)]
                      ],
                      desiredActions[ll].shortSummary
                  );
                  for (var zz = 0; zz < overlaysToReadd.length; zz++) {
                      existingNodeConnection[0].addOverlay(overlaysToReadd[zz]);
                  }
                  if (!existingNodeConnection[0].___overlayVisible) {
                      existingNodeConnection[0].getOverlay("menuOverlay").hide();
                      existingNodeConnection[0].getOverlay("label").show();
                  } else {
                      existingNodeConnection[0].getOverlay("menuOverlay").show();
                      existingNodeConnection[0].getOverlay("label").hide();
                  }
              }
          }
      }

      //movement
      // iterate over all nodes
      // round one - find all the connections we should have
      let desiredMovementConnections = [];
      if(this.props.canvasStore.isDiffEnabled()){ // if diff is disable - remove everything
        for(let ii = 0; ii < this.props.diff.modified.length; ii++){
          if(this.props.diff.modified[ii].diff.x){ // evolution changed
            desiredMovementConnections.push(this.props.diff.modified[ii]._id);
          }
        }
      }
      jsPlumb.logEnabled = true;
      jsPlumb.select({scope:'WM_MOVED'}).each(function(connection){
        let index = desiredMovementConnections.indexOf(connection.targetId);
        if( index === -1){ // connection should not exist, delete it
          jsPlumb.deleteConnection(connection);
        } else { //connection should exist, remove it from further processing
          desiredMovementConnections.splice(index, 1);
        }
      });
      // now we have only missing connections left, so let's establish them
      for(let ii = 0; ii < desiredMovementConnections.length; ii++){
        let historicConnectionToCreate = desiredMovementConnections[ii];
        let createdHistoricConnection = jsPlumb.connect({
            source: historicConnectionToCreate + '_history',
            target: historicConnectionToCreate,
            scope: "WM_MOVED",
            anchors: [
                "Right", "Left"
            ],
            deleteEndpointsOnDetach : true,
            paintStyle: moveEndpointOptions.connectorStyle,
            endpoint: moveEndpointOptions.endpoint,
            connector: moveEndpointOptions.connector,
            endpointStyles: [
                moveEndpointOptions.paintStyle, moveEndpointOptions.paintStyle
            ],
            overlays: this.getOverlays(moveEndpointOptions.connectorOverlays, [  ])
        });
        if(createdHistoricConnection){
          createdHistoricConnection.addType('movement');
        }
      }
  }


  render() {
    // jsPlumb.setSuspendDrawing(true, false); // this will be cleaned in did update
    console.log('workaround for https://github.com/jsplumb/jsPlumb/issues/651 still active');
    var style = _.clone(mapCanvasStyle);
    if (this.state && this.state.dropTargetHighlight) {
      style = _.extend(style, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b'
      });
    }
    var size = {
      width: 0,
      height: 0
    };
    if(global.OPTS && global.OPTS.coords){
      size = global.OPTS.coords.size;
    } else if (this.state.coords && this.state.coords.size) {
      size = this.state.coords.size;
    }
    var components = null;
    var arrowends = [];
    var oldComponents = [];


    var mapID = this.props.mapID;
    let variantId = this.props.variantId;
    var workspaceID = this.props.workspaceID;
    var state = this.state;
    var canvasStore = this.props.canvasStore;
    var multiSelection = state ? state.multiNodeSelection : false;
    let diff = this.props.diff;
    let removed = diff.removed;
    for(let i = 0; i < removed.length; i++){
      var removedNode = removed[i];
      oldComponents.push(
        <HistoricComponent
          canvasStore={canvasStore}
          workspaceID={workspaceID}
          mapID={removedNode.parentMap} node={removedNode}
          size={size}
          key={removedNode._id}
          id={removedNode._id}
          inertia={removedNode.inertia}
          type="DELETED"
          />
      );
    }

    if (this.props.nodes) {
      components = this.props.nodes.map(function(component) {
        var focused = false;
        if (state && state.currentlySelectedNodes) {
            for (var i = 0; i < state.currentlySelectedNodes.length; i++) {
                if (component._id === state.currentlySelectedNodes[i]) {
                    focused = true;
                }
            }
        }

        if(canvasStore.isDiffEnabled()){
            for(let z = 0; z < diff.modified.length; z++){
              if( (diff.modified[z]._id === component._id) && diff.modified[z].diff.x){
                var ghost = JSON.parse(JSON.stringify(component));
                ghost.x = diff.modified[z].diff.x.old;
                oldComponents.push(
                  <HistoricComponent
                    canvasStore={canvasStore}
                    workspaceID={workspaceID}
                    mapID={ghost.parentMap} node={ghost}
                    size={size}
                    key={ghost._id + '_history'}
                    id={ghost._id + '_history'}
                    inertia={ghost.inertia}
                    type="MOVED"
                    />
                );
              }
            }
        }

        for (var j = 0; j < component.action.length; j++) {
          arrowends.push(
            <ArrowEnd workspaceID = {workspaceID}
              canvasStore = {canvasStore}
              mapID = {mapID}
              node = {component}
              size = {size}
              id = {component.action[j]._id}
              key = {component.action[j]._id}
              action = {component.action[j]}/>);
        }
        let nodeDiff =  null;
        for(let k = 0; k < diff.modified.length; k++){
          if(diff.modified[k]._id === component._id){
            nodeDiff = diff.modified[k].diff;
          }
        }

        for(let k = 0; k < diff.added.length; k++){
          if(diff.added[k]._id === component._id){
            nodeDiff = "ADDED";
          }
        }

        return (
            <MapComponent
              canvasStore={canvasStore}
              workspaceID={workspaceID}
              variantId={variantId}
              mapID={mapID} node={component}
              size={size}
              key={component._id}
              id={component._id}
              focused={focused}
              inertia={component.inertia}
              multi={multiSelection}
              diff={nodeDiff}/>);
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
                  multi={multiSelection}
                  />);
            }
        }
    return (
      <div style={style} ref={input => this.setContainer(input)} onClick={CanvasActions.deselectNodesAndConnections}>
        {components}
        {arrowends}
        {comments}
        {oldComponents}
      </div>
    );
  }
}
