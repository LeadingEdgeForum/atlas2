/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('../constants');
import Actions from './single-map-actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {userEndpointOptions} from './component-styles';
import CanvasActions from './canvas-actions';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import ReactResizeDetector from 'react-resize-detector';

var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

var activeStyle = {
  boxShadow: "0 0 10px #00789b",
  color: "#00789b"
};

var nonInlinedStyle = {
  position: 'absolute'
};

var itemCaptionStyle = {
  left: 15,
  position: 'absolute',
  zIndex: 20,
  textShadow: '0 0 5px white, 0 0 3px white, 0 0 7px white, 0 0 1px white',
  maxWidth: 300,
  maxHeight: 200,
  marginBottom: -20,
  lineHeight: 1.1,
  overflow: 'auto',
  resize :'horizontal'
};

/* globals document */
/* globals window */
function getElementOffset(element)
{
    var de = document.documentElement;
    var box = element.getBoundingClientRect();
    var top = box.top + window.pageYOffset - de.clientTop;
    var left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
}

var User = React.createClass({
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

  resizeHandler : function(newWidth){
    if(this.resizeHandlerTimeout){
      clearTimeout(this.resizeHandlerTimeout);
    }
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var updateCall = function(){
      Actions.updateUser(workspaceID, mapID, id, null, null, null,  newWidth);
    };
    this.resizeHandlerTimeout = setTimeout(updateCall,100);
  },

  onClickHandler: function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.state.hover === "remove") {
      let id = this.props.id;
      let mapID = this.props.mapID;
      let workspaceID = this.props.workspaceID;
      Actions.deleteUser(workspaceID, mapID, id);
    }
    if (this.state.hover === "pencil") {
      let id = this.props.id;
      let mapID = this.props.mapID;
      Actions.openEditUserDialog(mapID, id);
    }
    this.setState({focus:!this.state.focus});
  },

  mouseOver: function(target) {
    if(this.state.focus){
      this.setState({hover: target});
    }
  },

  mouseOut: function(target) {
    this.setState({hover: null});
  },

  renderMenu() {
    if (!this.state.focus) {
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
        jsPlumb.unmakeSource(this.input);
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
        jsPlumb.unmakeSource(this.input);
        jsPlumb.makeSource(this.input, userEndpointOptions, {anchor: "BottomCenter"});
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
        jsPlumb.unmakeSource(this.input);
      }
    }
    var menuItems = [];
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "pencil")} onMouseOut={this.mouseOut} glyph="pencil" style={pencilStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "remove")} onMouseOut={this.mouseOut} glyph="remove" style={removeStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "link")} onMouseOut={this.mouseOut} glyph="link" style={linkStyle}></Glyphicon>);
    menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "move")} onMouseOut={this.mouseOut} glyph="move" style={moveStyle}></Glyphicon>);
    return (
      <div>
        {menuItems}
      </div>
    );
  },

  // decorateDiffStyle(node, style, diff) {
  //   if (!this.props.canvasStore.isDiffEnabled()) {
  //     return;
  //   }
  //   if (!diff) {
  //     return;
  //   }
  //   if (diff === 'ADDED') {
  //     style.boxShadow = "0 0 3px 3px green";
  //     return;
  //   }
  //   style.boxShadow = "0 0 3px 3px orange";
  // },

  render: function() {
    let user = this.props.user;
    // var diff = this.props.diff;
    var style = getStyleForType(Constants.USER);
    var left = user.x * this.props.size.width;
    var top = user.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    // this.decorateDiffStyle(node, style, diff);
    var name = this.props.user.name;
    var menu = this.renderMenu();
    var shouldBeDraggable = this.props.focused;
    var _this = this;
    var id = this.props.id;
    var mapID = this.props.mapID;
    var focused = this.props.focused;
    var workspaceID = this.props.workspaceID;
    var canvasStore = this.props.canvasStore;
    itemCaptionStyle.fontSize = canvasStore.getNodeFontSize();
    itemCaptionStyle.top = - itemCaptionStyle.fontSize;
    itemCaptionStyle.width = this.props.user.width ? this.props.user.width + 'px' : 'auto';

    return (
      <div style={style} onClick={this.onClickHandler} id={id} key={id} ref={input => {
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
            var offset = getElementOffset(input);
            var x = offset.left;
            var y = offset.top;
            var coords = canvasStore.normalizeComponentCoord({pos : [x,y] });
            Actions.updateUser(workspaceID, mapID, id, null, null, {x : coords.x,y:coords.y});
          }
        });
      }}>
        <div style={itemCaptionStyle}>{name}
          <ReactResizeDetector handleWidth onResize={this.resizeHandler} />
        </div>
        {menu}
      </div>
    );
  }
});

module.exports = User;
