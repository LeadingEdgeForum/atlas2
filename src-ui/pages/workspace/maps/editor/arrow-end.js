/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('./../../../../constants');
import Actions from '../../../../actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {endpointOptions} from './component-styles';
import {actionEndpointOptions} from './component-styles';
import CanvasActions from './canvas-actions';
import CanvasStore from './canvas-store';
var LinkContainer = require('react-router-bootstrap').LinkContainer;

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

var activeStyle = {
  boxShadow: "0 0 10px #00789b",
  color: "#00789b"
};

var nonInlinedStyle = {
  position: 'absolute'
};

var itemCaptionStyle = {
  top: -10,
  left: 10,
  position: 'absolute',
  zIndex: 20,
  textShadow: '2px 2px white',
  height: 22,
  maxWidth: 100,
  maxHeight: 22,
  marginBottom: -20,
  fontSize: 10,
  lineHeight: '11px'
};

var ArrowEnd = React.createClass({
  getInitialState: function() {
    return {focus: false};
  },

  componentWillUnmount: function() {},

  shouldComponentUpdate(nextProps, nextState){
    if(nextProps.focused === false){
      nextState.hover = null;
    }
    return true;
  },

  onClickHandler: function(e) {
    // if (this.state.hover === "submap") {
    //   return; //pass the event to link
    // }
    // e.preventDefault();
    // e.stopPropagation();
    // if (this.state.hover === "remove") {
    //   var id = this.props.id;
    //   var mapID = this.props.mapID;
    //   var workspaceID = this.props.workspaceID;
    //   Actions.removeNode(workspaceID, mapID, id);
    // }
    // if (this.state.hover === "pencil") {
    //   var nodeID = this.props.id; //jshint ignore:line
    //   var mapID = this.props.mapID; //jshint ignore:line
    //   Actions.openEditNodeDialog(mapID, nodeID);
    // }
    // if (this.state.hover === "group") {
    //   var mapID = this.props.mapID; //jshint ignore:line
    //   Actions.openCreateSubmapDialog({
    //     mapID:mapID,
    //     nodes:CanvasStore.getCanvasState().currentlySelectedNodes});
    // }
    // if (this.state.hover === "info") {
    //   var mapID = this.props.mapID; //jshint ignore:line
    //   var submapID = this.props.node.submapID;
    //   var currentName = this.props.node.name;
    //   var node = this.props.node; //jshint ignore:line
    //   var workspaceID = this.props.workspaceID;
    //   if(submapID){
    //     Actions.openSubmapReferencesDialog(
    //        currentName: currentName,
    //        mapID:mapID,
    //        submapID:submapID,
    //        node :node,
    //        workspaceID:workspaceID);
    //   } else {
    //     Actions.openReferencesDialog(
    //        currentName: currentName,
    //        node:node,
    //        workspaceID:workspaceID);
    //   }
    // }
    // if(this.state.hover === 'action'){
    //   console.log('action!!!');
    // }
    if((e.nativeEvent.ctrlKey || e.nativeEvent.altKey)){
      if (this.props.focused) {
        CanvasActions.deselectNode(this.props.id);
      } else {
        CanvasActions.focusAdditionalNode(this.props.id);
      }
    } else if (this.props.focused) {
      CanvasActions.deselectNodesAndConnections();
    } else {
      CanvasActions.focusNode(this.props.id);
    }
  },

  mouseOver: function(target) {
    // if(this.props.focused){
    //   this.setState({hover: target});
    // }
  },

  mouseOut: function(target) {
    // this.setState({hover: null});
  },

  render: function() {
    var node = this.props.node;

    var style = getStyleForType("ArrowEnd");
    var left = (node.x + node.action.x) * this.props.size.width;
    var top = (node.y + node.action.y) * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    var _this = this;
    var id = this.props.id;
    var mapID = this.props.mapID;
    var focused = this.props.focused;
    var workspaceID = this.props.workspaceID;
    return (
      <div style={style} onClick={this.onClickHandler} id={id} ref={input => {
        if (input) {
          this.input = input;
        }
        if (!input) {
          return;
        }
        // jsPlumb.draggable(input, {
        //   containment: true,
        //   grid: [
        //     50, 50
        //   ],
        //   stop: function(event) {
        //     Actions.nodeDragged(workspaceID, mapID, id, event.finalPos);
        //   }
        // });
      }}>
      </div>
    );
  }
});

module.exports = ArrowEnd;
