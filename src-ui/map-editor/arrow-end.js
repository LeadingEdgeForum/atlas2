/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import Actions from './single-map-actions';
import {getStyleForType} from './component-styles';
import {Button, Glyphicon} from 'react-bootstrap';
import {endpointOptions} from './component-styles';
import {actionEndpointOptions} from './component-styles';
import CanvasActions from './canvas-actions';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
var createReactClass = require('create-react-class');
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

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

var ArrowEnd = createReactClass({


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
    var canvasStore = this.props.canvasStore;

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
              /* Gently skip update of this is source node is dragged together. This is a relative action, so it does not require manual update in this case, as the relative position does not change*/
              if(event.selection && event.selection.length > 0){
                let foundAction = false;
                let foundNode = false;
                for(let i  = 0; i< event.selection.length; i++){
                  if(event.selection[i][0].id === id){
                    foundAction = true;
                  }
                  if(event.selection[i][0].id === node_id){
                    foundNode = true;
                  }
                }
                if(foundAction && foundNode){
                  return;
                }
              }
              var offset = getElementOffset(input);
              var x = offset.left;
              var y = offset.top;
              var coords = canvasStore.normalizeComponentCoord({pos : [x,y] });
              Actions.updateAction(workspaceID, mapID, node_id, id, {pos:[coords.x,coords.y]});
          }
        });
      }}>
      </div>
    );
  }
});

module.exports = ArrowEnd;
