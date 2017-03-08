/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import CanvasStore from './canvas-store';
var _ = require('underscore');
import $ from 'jquery';
import Actions from '../../../../actions';
import CanvasActions from './canvas-actions';
var MapComponent = require('./map-component');
var ArrowEnd = require('./arrow-end');
var Comment = require('./comment');
import {endpointOptions, actionEndpointOptions} from './component-styles';

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

var mapCanvasStyle = { //this is style applied to the place where actuall components can be drawn
  position: 'relative',
  top: 0,
  height: '98%',
  width: '98%',
  left: '2%',
  zIndex: 4
  // backgroundColor: 'silver',
  // backgroundImage: 'transparent url(1x1_transparent.png) repeat center top'
};

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
    this.state = CanvasStore.getCanvasState();
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
    Actions.recordConnection(this.props.workspaceID, this.props.mapID, connection.sourceId, connection.targetId);
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
          Actions.recordAction(this.props.workspaceID, this.props.mapID, info.sourceId, {
              pos: [e.x, e.y]
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

  handleResize() {
    if (!this.input) {
      return;
    }
    var coord = {
      offset: {
        top: $(this.input).offset().top,
        left: $(this.input).offset().left
      },
      size: {
        width: $(this.input).width(),
        height: $(this.input).height()
      }
    };
    CanvasActions.updateCanvasSizeAndOffset(coord);
    jsPlumb.repaintEverything();
  }

  componentDidMount() {
    CanvasStore.addChangeListener(this._onChange.bind(this));
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.reconcileDependencies();
  }

  componentWillUnmount() {
    CanvasStore.removeChangeListener(this._onChange.bind(this));
    jsPlumb.reset();
    window.removeEventListener('resize', this.handleResize);
  }

  _onChange() {
    this.setState(CanvasStore.getCanvasState());
  }

  componentDidUpdate(prevProps, prevState) {
    this.reconcileDependencies();
    jsPlumb.revalidate(this.input);
    jsPlumb.repaintEverything();
  }

  getOverlays(fromStyle) {
    if(!fromStyle){
      fromStyle = [];
    }
    fromStyle.push([
      "Custom", {
        create: function(component) {
          return $("<div><span class='glyphicon glyphicon-remove' style='color: #a98c74;z-index: 50;cursor: pointer'></span></div>");
        },
        location: 0.5,
        id: "deleteOverlay"
      }
    ]);
    return fromStyle;
  }
  overlayClickHandler(obj) {
    if (obj.component && obj.component.scope === jsPlumb.Defaults.Scope) {
      //hurray, overlay clicked. So far there is only one, so it is not an issue
      Actions.deleteConnection(this.props.workspaceID, this.props.mapID, obj.component.sourceId, obj.component.targetId);
      return;
    }
    if (obj.component && obj.component.scope === "WM_Action") {
      //hurray, overlay clicked. So far there is only one, so it is not an issue

      Actions.deleteAction(this.props.workspaceID, this.props.mapID, obj.component.sourceId, obj.component.targetId);
      return;
    }
    // we got pure connection
    var conn = obj;
    conn.___overlayVisible = !conn.___overlayVisible;
    conn.getOverlay("deleteOverlay").setVisible(conn.___overlayVisible);
  }

  reconcileDependencies() {
    var modelConnections = [];
    if (!this.props.nodes) {
      return;
    }

    for (var i = 0; i < this.props.nodes.length; i++) {
      var _node = this.props.nodes[i];
      var iterator_length = _node.outboundDependencies
        ? _node.outboundDependencies.length
        : 0;
      for (var j = 0; j < iterator_length; j++) {
        modelConnections.push({source: _node._id, target: _node.outboundDependencies[j], scope: jsPlumb.Defaults.Scope});
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
          canvasConnections.splice(canvasIterator, 1);
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
          overlays: this.getOverlays()
        });
        connection.___overlayVisible = false;
        connection.getOverlay("deleteOverlay").hide();
        connection.bind('click', this.overlayClickHandler);
      }
    }
    //clean up unnecessary canvas connection (no counterpart in model)
    for (var z = 0; z < canvasConnections.length; z++) {
      jsPlumb.detach(canvasConnections[z]);
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
                overlays: this.getOverlays(actionEndpointOptions.connectorOverlays)
            });
            connection.___overlayVisible = false;
            connection.getOverlay("deleteOverlay").hide();
            connection.bind('click', this.overlayClickHandler);
        }
    }

}

}

  render() {
    var style = _.clone(mapCanvasStyle);
    if (this.state.dropTargetHighlight) {
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
    if (this.state.coords && this.state.coords.size) {
      size = this.state.coords.size;
    }
    var components = null;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var state = this.state;
    if (this.props.nodes) {
      components = this.props.nodes.map(function(component) {
        var focused = false;
        for (var i = 0; i < state.currentlySelectedNodes.length; i++) {
          if (component._id === state.currentlySelectedNodes[i]) {
            focused = true;
          }
        }
        return (<MapComponent workspaceID={workspaceID} mapID={mapID} node={component} size={size} key={component._id} id={component._id} focused={focused} multi={state.multiNodeSelection}/>);
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
              for (var ii = 0; ii < state.currentlySelectedComments.length; ii++) {
                if (this.props.comments[i]._id === state.currentlySelectedComments[ii]) {
                  focused = true;
                }
              }
              comments.push( <Comment workspaceID = {
                      workspaceID
                  }
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
                  multi={state.multiNodeSelection}
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
