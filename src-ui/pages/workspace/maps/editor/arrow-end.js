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

var jsPlumb = require("../../../../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

var ArrowEnd = React.createClass({


  render: function() {
    var node = this.props.node;
    var action = this.props.action;

    var style = getStyleForType("ArrowEnd");

    var left = (node.x + action.x) * this.props.size.width;
    var top = (node.y + action.y) * this.props.size.height;
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
    var node_id = node._id;

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
            Actions.updateAction(workspaceID, mapID, node_id, id, {pos:[x,y]});
          }
        });
      }}>
      </div>
    );
  }
});

module.exports = ArrowEnd;
