/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import Actions from './single-map-actions';
import SubmapActions from './dialogs/form-submap/form-a-submap-actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {endpointOptions} from './component-styles';
import {actionEndpointOptions} from './component-styles';
import CanvasActions from './canvas-actions';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import ReactResizeDetector from 'react-resize-detector';
var createReactClass = require('create-react-class');
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

var activeStyle = {
  boxShadow: "0 0 10px #00789b",
  color: "#00789b"
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

var Comment = createReactClass({

  getInitialState : function(){
    return {focused:false};
  },

  resizeHandler : function(newWidth) {
      if(this.resizeHandlerTimeout){
        clearTimeout(this.resizeHandlerTimeout);
      }
      var id = this.props.id;
      var mapID = this.props.mapID;
      var workspaceID = this.props.workspaceID;
      var updateCall = function(){
        Actions.updateComment(workspaceID, mapID, id, null, newWidth);
      };
      this.resizeHandlerTimeout = setTimeout(updateCall,100);
  },

  onClickHandler : function(event){
    event.preventDefault();
    event.stopPropagation();
    if (this.state.hover === "remove") {
      var id = this.props.id;
      var mapID = this.props.mapID;
      var workspaceID = this.props.workspaceID;
      Actions.deleteComment(workspaceID, mapID, id);
      return;
    }
    if (this.state.hover === "pencil") {
      var id = this.props.id; //jshint ignore:line
      var mapID = this.props.mapID; //jshint ignore:line
      var workspaceID = this.props.workspaceID;//jshint ignore:line
      Actions.openEditCommentDialog(workspaceID, mapID, id, this.props.comment.text);
      return;
    }
    if (this.state.hover === "group") {
      SubmapActions.openFormASubmapDialog(
        this.props.workspaceID,
        this.props.mapID,
        this.props.canvasStore.getCanvasState().currentlySelectedNodes,
        this.props.canvasStore.getCanvasState().currentlySelectedComments);
    }

    if((event.nativeEvent.ctrlKey || event.nativeEvent.altKey)){
      if (this.props.focused) {
        CanvasActions.focusRemoveComment(this.props.id);
      } else {
        CanvasActions.focusAddComment(this.props.id);
      }
    } else if (this.props.focused) {
      CanvasActions.deselectNodesAndConnections();
    } else {
      CanvasActions.focusComment(this.props.id);
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

  renderMenu : function(focused){
      if (this.input) {
        jsPlumb.setDraggable(this.input, false);
      }
      if (!focused) {
        return null;
      }
      var groupStyle = {
        position: "absolute",
        fontSize: "20px",
        color: "silver",
        top: "-25px",
        left: "0px",
        zIndex: "30"
      };
      if (this.state.hover === "group") {
        groupStyle = _.extend(groupStyle, activeStyle);
      }
      var pencilStyle = {
        position: "absolute",
        fontSize: "20px",
        color: "silver",
        top: "-25px",
        left: "0px",
        zIndex: "30"
      };
      if (this.state.hover === "pencil") {
        pencilStyle = _.extend(pencilStyle, activeStyle);
        if (this.input) {
          jsPlumb.setDraggable(this.input, false);
        }
      }
      var removeStyle = {
        position: "absolute",
        color: "silver",
        top: "-25px",
        fontSize: "20px",
        left: "25px",
        zIndex: "30"
      };
      if (this.state.hover === "remove") {
        if (this.input) {
          jsPlumb.setDraggable(this.input, false);
        }
        removeStyle = _.extend(removeStyle, activeStyle);
      }
      var moveStyle = {
        position: "absolute",
        top: "-25px",
        color: "silver",
        left: "-25px",
        fontSize: "20px",
        zIndex: "30"
      };
      if (this.state.hover === "move") {
        moveStyle = _.extend(moveStyle, activeStyle);
        if (this.input) {
          jsPlumb.setDraggable(this.input, true);
        }
      }
      var menuItems = [];
      if(this.props.canvasStore.shouldShow("move")){
        menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "move")} onMouseOut={this.mouseOut} glyph="move" style={moveStyle}></Glyphicon>);
      }
      if(this.props.canvasStore.shouldShow("pencil")){
        menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "pencil")} onMouseOut={this.mouseOut} glyph="pencil" style={pencilStyle}></Glyphicon>);
      }
      if(this.props.canvasStore.shouldShow("remove")){
        menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "remove")} onMouseOut={this.mouseOut} glyph="remove" style={removeStyle}></Glyphicon>);
      }
      if(this.props.canvasStore.shouldShow("group")){
        menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "group")} onMouseOut={this.mouseOut} glyph="resize-small" style={groupStyle}></Glyphicon>);
      }
      return (
        <div>
          {menuItems}
        </div>
      );
    },
  render: function() {
    var comment = this.props.comment;

    var style = getStyleForType("GenericComment");

    var left = comment.x * this.props.size.width;
    var top = comment.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    var _this = this;
    var id = this.props.id;
    var mapID = this.props.mapID;
    var txt = comment.text;
    var focused = this.props.focused;
    var workspaceID = this.props.workspaceID;
    var menu = this.renderMenu(focused);
    var canvasStore = this.props.canvasStore;
    style.fontSize = canvasStore.getOtherFontSize();
    style.padding = style.fontSize / 6 + 'px';

    let textStyle = {};
    textStyle.width = comment.width ? comment.width + 'px' : '100px';
    textStyle.maxWidth =  '300px';
    if(focused){
      textStyle.resize = 'horizontal';
      textStyle.overflow = 'auto';
    }

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
            10, 10
          ],
          stop: function(event) {
            var offset = getElementOffset(input);
            var x = offset.left;
            var y = offset.top;
            var coords = canvasStore.normalizeComponentCoord({pos : [x,y] });
            Actions.updateComment(workspaceID, mapID, id, {x : coords.x,y:coords.y});
          }
        });
      }}>
      <div style={textStyle}>{txt}
        <ReactResizeDetector handleWidth onResize={this.resizeHandler} />
      </div> {menu}
      </div>
    );
  }
});

module.exports = Comment;
