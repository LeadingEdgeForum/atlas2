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

var Comment = React.createClass({
  getInitialState : function(){
    return {focused:false};
  },
  onClickHandler : function(event){
    event.preventDefault();
    event.stopPropagation();
    var flipped = false;
    if(!this.state.focused){
      flipped = true;
      this.setState({focused:true, hover:null});
      return;
    }

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
      var workspaceID = this.props.workspaceID;
      Actions.openEditGenericCommentDialog(workspaceID, mapID, id, this.props.comment.text);
      return;
    }
    // is enabled and was not enabled in this call
    if(this.state.focused && !flipped){
      this.setState({focused:false, hover:null});
    }
  },
  mouseOver: function(target) {
    if(this.state.focused){
      this.setState({hover: target});
    }
  },
  mouseOut: function(target) {
    this.setState({hover: null});
  },
  renderMenu : function(focused){
      if (!focused) {
        return null;
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
        removeStyle = _.extend(removeStyle, activeStyle);
      }
      var menuItems = [];
      menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "pencil")} onMouseOut={this.mouseOut} glyph="pencil" style={pencilStyle}></Glyphicon>);
      menuItems.push(<Glyphicon onMouseOver={this.mouseOver.bind(this, "remove")} onMouseOut={this.mouseOut} glyph="remove" style={removeStyle}></Glyphicon>);
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
    var focused = this.state.focused;
    var workspaceID = this.props.workspaceID;
    var menu = this.renderMenu(focused);

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
            var x = event.e.pageX;
            var y = event.e.pageY;
            Actions.updateComment(workspaceID, mapID, id, {pos:[x,y]}, txt);
          }
        });
      }}> {txt} {menu}
      </div>
    );
  }
});

module.exports = Comment;
