/*jshint esversion: 6 */
/* globals document */
/* globals window */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
var MapComponent = require('./map-component');
var ArrowEnd = require('./arrow-end');
var Comment = require('./comment');
var User = require('./user');
import {userEndpointOptions, endpointOptions, actionEndpointOptions, moveEndpointOptions} from './component-styles';

var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
jsPlumb.registerConnectionType("constraint", {paintStyle : {stroke:'#EC7063'}});
jsPlumb.registerConnectionType("flow", {paintStyle : {stroke:'#1ABC9C'}});
jsPlumb.registerConnectionType("movement", {paintStyle : {stroke:'orange'}});
jsPlumb.registerConnectionType("antimovement", {paintStyle : {stroke:'#E74C3C'}});

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
    this.state = {coords:global.OPTS.coords};
    this.setContainer = this.setContainer.bind(this);
    this.reconcileDependencies = this.reconcileDependencies.bind(this);
  }


  setContainer(input) {
    this.input = input;
    if (input === null) {
      //noop - component was destroyed, no need to worry about draggable
      return;
    }
    jsPlumb.setContainer(input);
  }

  componentDidMount(prevProps, prevState) {
    this.reconcileDependencies();
    jsPlumb.setSuspendDrawing(false, true);
  }

  getOverlays(fromStyle, menuDefinition, labelText) {
    if (fromStyle) {
        fromStyle = [].concat(fromStyle);
    } else {
        fromStyle = [];
    }
    let fontStyle = this.props.otherFontSize + 'px Helvetica Neue,Helvetica,Arial,sans-serif';
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

  reconcileDependencies() {
    var modelConnections = [];
    if (!this.props.nodes) {
      return;
    }

    for (var i = 0; i < this.props.nodes.length; i++) {
      var _node = this.props.nodes[i];
      // for each node - create connections
      var iterator_length = _node.outboundDependencies ? _node.outboundDependencies.length : 0;
      for (var j = 0; j < iterator_length; j++) {
        var type = '0';
        var label = '';
        if(_node.dependencyData && _node.dependencyData.outbound && _node.dependencyData.outbound[_node.outboundDependencies[j]]){
          type = _node.dependencyData.outbound[_node.outboundDependencies[j]].type;
          label = _node.dependencyData.outbound[_node.outboundDependencies[j]].label;
        }

        var connection = jsPlumb.connect({
          source: _node._id,
          target: _node.outboundDependencies[j],
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
          overlays: this.getOverlays(null, [],
            label
          )
        });

        if(type == '20'){
          connection.addType('flow');
        } else if (type == '10') {
          connection.addType('constraint');
        }
      }

        var desiredActions = _node.action;
        for (var ll = 0; ll < desiredActions.length; ll++) {
          var connection2 = jsPlumb.connect({
            source: _node._id,
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
            overlays: this.getOverlays(actionEndpointOptions.connectorOverlays, [],
              desiredActions[ll].shortSummary
            )
          });
          connection2.getOverlay("label").show();
        }

        if (_node.moved) {
          let createdHistoricConnection = jsPlumb.connect({
            source: _node._id,
            target: _node.originalId,
            scope: "WM_MOVED",
            anchors: [
              "AutoDefault", "AutoDefault"
            ],
            deleteEndpointsOnDetach: true,
            paintStyle: moveEndpointOptions.connectorStyle,
            endpoint: moveEndpointOptions.endpoint,
            connector: moveEndpointOptions.connector,
            endpointStyles: [
              moveEndpointOptions.paintStyle, moveEndpointOptions.paintStyle
            ],
            overlays: this.getOverlays(moveEndpointOptions.connectorOverlays, [])
          });
          if (createdHistoricConnection) {
            if (createdHistoricConnection.source.offsetLeft < createdHistoricConnection.target.offsetLeft) {
              createdHistoricConnection.addType('movement');
            } else {
              createdHistoricConnection.addType('antimovement');
            }
          }
        }
    }
    for (let i = 0; i < this.props.users.length; i++) {
        for(let j = 0; j < this.props.users[i].associatedNeeds.length; j++){
          jsPlumb.connect({
            source: this.props.users[i]._id,
            target: this.props.users[i].associatedNeeds[j],
            scope: "WM_User",
            anchors: [
              "BottomCenter", "TopCenter"
            ],
            paintStyle: userEndpointOptions.connectorStyle,
            endpoint: userEndpointOptions.endpoint,
            connector: userEndpointOptions.connector,
            endpointStyles: [
              userEndpointOptions.paintStyle, userEndpointOptions.paintStyle
            ],
            overlays: this.getOverlays(null, [],
              ""
            )
        });
      }
    }
  }


  render() {
    jsPlumb.setSuspendDrawing(true, true); // this will be cleaned in did update
    var size = global.OPTS.coords.size;
    var nodeFontSize = this.props.nodeFontSize;
    var otherFontSize = this.props.otherFontSize;

    var components = null;
    if (this.props.nodes) {
      components = this.props.nodes.map(function(component) {
        return (<MapComponent node={component} size={size} key={component._id} id={component._id} inertia={component.inertia} nodeFontSize={nodeFontSize}
           moved={component.moved}
           added={component.added}
           removed={component.removed}
           changed={component.changed}/>);
      });
    }
    var arrowends = [];
    if (this.props.nodes) {
      for (var i = 0; i < this.props.nodes.length; i++) {
        var n = this.props.nodes[i];
        for (var j = 0; j < n.action.length; j++) {
          arrowends.push( < ArrowEnd
              node = { n }
              size = { size }
              id = { n.action[j]._id }
              key = { n.action[j]._id }
              action = { n.action[j] } />);
        }
      }
    }
    var comments = [];
    if (this.props.comments) {
        for (var ii = 0; ii < this.props.comments.length; ii++) {
              comments.push( <Comment comment = { this.props.comments[ii] }
                  id = { this.props.comments[ii]._id }
                  key = { this.props.comments[ii]._id }
                  size = {size} otherFontSize={otherFontSize} />);
            }
        }
    var users = [];
    if (this.props.users) {
            for (var iii = 0; iii < this.props.users.length; iii++) {
              users.push(
                <User
                  user = {this.props.users[iii]}
                  id = {this.props.users[iii]._id}
                  key = {this.props.users[iii]._id}
                  added = {this.props.users[iii].added}
                  removed = {this.props.users[iii].removed}
                  size = {size}
                  otherFontSize={otherFontSize}
                  />);
            }
        }
    return (
      <div style={mapCanvasStyle} ref={input => this.setContainer(input)}>
        {components}
        {arrowends}
        {comments}
        {users}
      </div>
    );
  }
}
