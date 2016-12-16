/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('./../../../../constants');
import Actions from '../../../../actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {endpointOptions} from './component-styles';
import CanvasActions from './canvas-actions';
import CanvasStore from './canvas-store';
var LinkContainer = require('react-router-bootstrap').LinkContainer;


import jsPlumb from 'jsPlumb';


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

var MapComponent = React.createClass({
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
    if (this.state.hover === "submap") {
      return; //pass the event to link
    }
    e.preventDefault();
    e.stopPropagation();
    if (this.state.hover === "remove") {
      var id = this.props.id;
      var mapID = this.props.mapID;
      var workspaceID = this.props.workspaceID;
      Actions.removeNode(workspaceID, mapID, id);
    }
    if (this.state.hover === "pencil") {
      var nodeID = this.props.id; //jshint ignore:line
      var mapID = this.props.mapID; //jshint ignore:line
      Actions.openEditNodeDialog(mapID, nodeID);
    }
    if (this.state.hover === "group") {
      var mapID = this.props.mapID; //jshint ignore:line
      Actions.openCreateSubmapDialog({
        mapID:mapID,
        nodes:CanvasStore.getCanvasState().currentlySelectedNodes});
    }
    if (this.state.hover === "info") {
      var mapID = this.props.mapID; //jshint ignore:line
      var submapID = this.props.node.submapID;
      var currentName = this.props.node.name;
      var node = this.props.node; //jshint ignore:line
      var workspaceID = this.props.workspaceID;
      if(submapID){
        Actions.openSubmapReferencesDialog(
           currentName: currentName,
           mapID:mapID,
           submapID:submapID,
           node :node,
           workspaceID:workspaceID);
      } else {
        Actions.openReferencesDialog(
           currentName: currentName,
           node:node,
           workspaceID:workspaceID);
      }
    }
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
    if(this.props.focused){
      this.setState({hover: target});
    }
  },

  mouseOut: function(target) {
    this.setState({hover: null});
  },

  renderMenu() {
    if (!this.props.focused) {
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeSource(this.input);
        jsPlumb.makeTarget(this.input, endpointOptions, {anchor: "TopCenter"});
      }
      return null;
    }
    if(this.props.multi){
      var groupStyle = {
        position: "absolute",
        fontSize: "20px",
        color: "silver",
        top: "-25px",
        left: "-25px",
        zIndex: "30"
      };
      if (this.state.hover === "group") {
        groupStyle = _.extend(groupStyle, activeStyle);
        if (this.input) {
          jsPlumb.setDraggable(this.input, false);
          jsPlumb.unmakeTarget(this.input);
          jsPlumb.unmakeSource(this.input);
        }
      }
      return(<div><Glyphicon onMouseOver={this.mouseOver.bind(this, "group")} onMouseOut={this.mouseOut} glyph="resize-small" style={groupStyle}></Glyphicon></div>);
    }
    var pencilStyle = {
      position: "absolute",
      fontSize: "20px",
      color: "silver",
      top: "-25px",
      left: "-25px",
      zIndex: "30"
    };
    if (this.state.hover === "pencil") {
      pencilStyle = _.extend(pencilStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
      }
    }
    var removeStyle = {
      position: "absolute",
      color: "silver",
      top: "-25px",
      fontSize: "20px",
      left: "15px",
      zIndex: "30"
    };
    if (this.state.hover === "remove") {
      removeStyle = _.extend(removeStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
      }
    }
    var linkStyle = {
      position: "absolute",
      top: "15px",
      color: "silver",
      left: "15px",
      fontSize: "20px",
      zIndex: "30"
    };
    if (this.state.hover === "link") {
      linkStyle = _.extend(linkStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
        jsPlumb.makeSource(this.input, endpointOptions, {anchor: "BottomCenter"});
      }
    }
    var moveStyle = {
      position: "absolute",
      top: "15px",
      color: "silver",
      left: "-25px",
      fontSize: "20px",
      zIndex: "30"
    };
    if (this.state.hover === "move") {
      moveStyle = _.extend(moveStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, true);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
      }
    }
    var submapStyle = {
      position: "absolute",
      top: "20px",
      color: "silver",
      left: "-5px",
      fontSize: "20px",
      zIndex: "30"
    };
    if (this.state.hover === "submap") {
      submapStyle = _.extend(submapStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
      }
    }
    var infoStyle = {
      position: "absolute",
      top: "-30px",
      color: "silver",
      left: "-5px",
      fontSize: "20px",
      zIndex: "30"
    };
    if (this.state.hover === "info") {
      infoStyle = _.extend(infoStyle, activeStyle);
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeTarget(this.input);
        jsPlumb.unmakeSource(this.input);
      }
    }
    var menuItems = [];
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "pencil")} onMouseOut={this.mouseOut} glyph="pencil" style={pencilStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "remove")} onMouseOut={this.mouseOut} glyph="remove" style={removeStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "link")} onMouseOut={this.mouseOut} glyph="link" style={linkStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "move")} onMouseOut={this.mouseOut} glyph="move" style={moveStyle}></Glyphicon>);
    if(this.props.node.type === Constants.SUBMAP){
      var href = "/map/" + this.props.node.submapID;
      var linkContainer = (
        <a href={href}><Glyphicon onMouseOver={this.mouseOver.bind(this, "submap")} onMouseOut={this.mouseOut} glyph="hand-down" style={submapStyle}></Glyphicon></a>
      );
      var infoContainer = (<a href={href}><Glyphicon onMouseOver={this.mouseOver.bind(this, "info")} onMouseOut={this.mouseOut} glyph="info-sign" style={infoStyle}></Glyphicon></a>);
      menuItems.push(linkContainer);
      menuItems.push(infoContainer);
    } else {
      var infoContainer = (<a href={href}><Glyphicon onMouseOver={this.mouseOver.bind(this, "info")} onMouseOut={this.mouseOut} glyph="info-sign" style={infoStyle}></Glyphicon></a>);
      menuItems.push(infoContainer);
    }
    return (
      <div>
        {menuItems}
      </div>
    );
  },
  render: function() {
    var node = this.props.node;

    var style = getStyleForType(node.type);
    var left = node.x * this.props.size.width;
    var top = node.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    var name = node.name;
    var menu = this.renderMenu();
    var shouldBeDraggable = this.props.focused;
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
        jsPlumb.draggable(input, {
          containment: true,
          grid: [
            50, 50
          ],
          stop: function(event) {
            Actions.nodeDragged(workspaceID, mapID, id, event.finalPos);
          }
        });
      }}>
        <div style={itemCaptionStyle}>{name}</div>
        {menu}
      </div>
    );
  }
});

module.exports = MapComponent;
