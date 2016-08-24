/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('./../../../../constants');
import Actions from '../../../../actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {endpointOptions} from './component-styles';

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

var MapComponent = React.createClass({
  getInitialState: function() {
    return {focus: false};
  },

  componentWillUnmount: function() {},

  //
  // editNode: function() {
  //   MapActions.editNode(this.id);
  // },

  onClickHandler: function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.hover === "remove") {
      var id = this.props.id;
      var mapID = this.props.mapID;
      Actions.removeNode(mapID, id);
    }
    if (this.state.hover === "pencil") {
      var nodeID = this.props.id; //jshint ignore:line
      var mapID = this.props.mapID; //jshint ignore:line
      Actions.openEditNodeDialog(mapID, nodeID);
    }
    if (this.props.focused) {
      Actions.blurNodes();
    } else {
      Actions.focusNode(this.props.id);
    }
  },

  mouseOver: function(target) {
    this.setState({hover: target});
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
    return (
      <div>
        <Glyphicon onMouseOver={this.mouseOver.bind(this, "pencil")} onMouseOut={this.mouseOut} glyph="pencil" style={pencilStyle}></Glyphicon>
        <Glyphicon onMouseOver={this.mouseOver.bind(this, "remove")} onMouseOut={this.mouseOut} glyph="remove" style={removeStyle}></Glyphicon>
        <Glyphicon onMouseOver={this.mouseOver.bind(this, "link")} onMouseOut={this.mouseOut} glyph="link" style={linkStyle}></Glyphicon>
        <Glyphicon onMouseOver={this.mouseOver.bind(this, "move")} onMouseOut={this.mouseOut} glyph="move" style={moveStyle}></Glyphicon>
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
            Actions.nodeDragged(mapID, id, event.finalPos);
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
