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

var HistoricUser = React.createClass({

  decorateDiffStyle(user, style, type) {
    if(type === "DELETED"){
      style.boxShadow = "0 0 3px 3px red";
      style.opacity = "0.8";
    }
  },

  render: function() {
    if (!this.props.canvasStore.isDiffEnabled()) {
      return null;
    }
    let user = this.props.user;
    var diff = this.props.diff;
    var style = getStyleForType(Constants.USER);
    var left = user.x * this.props.size.width;
    var top = user.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    this.decorateDiffStyle(user, style, this.props.type);
    var name = this.props.user.name;
    var _this = this;
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var canvasStore = this.props.canvasStore;
    itemCaptionStyle.fontSize = canvasStore.getNodeFontSize();
    itemCaptionStyle.top = - itemCaptionStyle.fontSize;
    itemCaptionStyle.width = this.props.user.width ? this.props.user.width + 'px' : 'auto';

    return (
      <div style={style} id={id} key={id}>
        <div style={itemCaptionStyle}>{name}</div>
      </div>
    );
  }
});

module.exports = HistoricUser;
