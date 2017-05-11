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
var ArrowEnd = require('./arrow-end');
var Comment = require('./comment');
import {endpointOptions, actionEndpointOptions} from './component-styles';

var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

//this is style applied to the place where actuall components can be drawn
var mapCanvasStyle = {
  position: 'relative',
  top: 0,
  height: '98%',
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
    var coord = {
      offset: {
        top: getElementOffset(this.input).top,
        left: getElementOffset(this.input).left
      },
      size: {
        width: this.input.offsetWidth,
        height: this.input.offsetHeight
      }
    };
    if(global.OPTS && global.OPTS.coords){
      coord = global.OPTS.coords;
    }
    this.setState({coords:coord});
    if (this.props.canvasStore) { // no store means rendering on the server
      CanvasActions.updateCanvasSizeAndOffset(coord);
      jsPlumb.revalidate(this.input);
    }
  }

  componentDidMount() {
    if (this.props.canvasStore) {
        this.props.canvasStore.addChangeListener(this._onChange.bind(this));
        window.addEventListener('resize', this.handleResize);
    }
    this.handleResize();
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
    jsPlumb.bind("ready", function() {
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
              modelConnections.push({
                  source: _node._id,
                  target: _node.outboundDependencies[j],
                  scope: jsPlumb.Defaults.Scope
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
                  var overlaysToReadd = this.getOverlays(null, [
                          ["remove", SingleMapActions.deleteConnection.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, currentModel.source, currentModel.target)]
                      ]
                  );
                  for (var zz = 0; zz < overlaysToReadd.length; zz++) {
                      existing.addOverlay(overlaysToReadd[zz]);
                  }
                  if(existing.___overlayVisible){
                      existing.getOverlay("menuOverlay").show();
                  } else {
                      existing.getOverlay("menuOverlay").hide();
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
                      ["remove", SingleMapActions.deleteConnection.bind(SingleMapActions, this.props.workspaceID, this.props.mapID, currentModel.source, currentModel.target)]
                  ])
              });
              connection.___overlayVisible = false;
              connection.getOverlay("menuOverlay").hide();
              connection.bind('click', this.overlayClickHandler);
          }
      }
      //clean up unnecessary canvas connection (no counterpart in model)
      for (var z = 0; z < canvasConnections.length; z++) {
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
                  jsPlumb.detach(existingActions[jj]);
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
  }


  render() {
    jsPlumb.setSuspendDrawing(true, true); // this will be cleaned in did update
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
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var state = this.state;
    var canvasStore = this.props.canvasStore;
    var multiSelection = state ? state.multiNodeSelection : false;
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
        return (<MapComponent canvasStore={canvasStore} workspaceID={workspaceID} mapID={mapID} node={component} size={size} key={component._id} id={component._id} focused={focused} inertia={component.inertia} multi={multiSelection}/>);
      });
    }
    var arrowends = [];
if (this.props.nodes) {
    for (var i = 0; i < this.props.nodes.length; i++) {
        var n = this.props.nodes[i];
        for(var j = 0; j < n.action.length;j++){
          arrowends.push( < ArrowEnd workspaceID = {
                  workspaceID
              }
              canvasStore = {canvasStore}
              mapID = {
                  mapID
              }
              node = {
                  n
              }
              size = {
                  size
              }
              id = {
                  n.action[j]._id
              }
              key = {
                  n.action[j]._id
              }
              action = {
                n.action[j]
              }
              />);
        }
        }
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
              comments.push( <Comment workspaceID = {
                      workspaceID
                  }
                  canvasStore = {canvasStore}
                  mapID = {
                      mapID
                  }
                  comment = {
                      this.props.comments[i]
                  }
                  id = {
                      this.props.comments[i]._id
                  }
                  key = {
                      this.props.comments[i]._id
                  }
                  size = {
                      size
                  }
                  focused = {
                    focused
                  }
                  multi={multiSelection}
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
