/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('../constants');
import Actions from './single-map-actions';
import SubmapActions from './dialogs/form-submap/form-a-submap-actions';
import {Button, Glyphicon} from 'react-bootstrap';
import {
  actionEndpointOptions,
  inactiveMenuStyle,
  activeMenuStyle,
  nonInlinedStyle,
  itemCaptionStyle,
  endpointOptions,
  getStyleForType,
  inertiaStyle,
  getElementOffset,
  getInertiaWidth,
  getMenuItemRelativePos
} from './component-styles';
import CanvasActions from './canvas-actions';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import ReactResizeDetector from 'react-resize-detector';
var createReactClass = require('create-react-class');
import MenuItem from './MenuItem';

var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;



var MapComponent = createReactClass({

  componentDidMount: function() {
    this.componentDidUpdate();
  },

  componentDidUpdate: function() {
    if (!this.input) {
      return;
    }
    if (!this.props.focused) {
      this.setNodeTarget();
    }
  },

  refreshAnchors(){
    let mapID = this.props.mapID;
    let node = this.props.node;
    let left = node.evolution * this.props.size.width;
    let top = this.getVisibility(mapID, node) * this.props.size.height;
    jsPlumb.repaint(this.input, {left:left,top:top});
  },

  // default, nothing is selected
  setNodeTarget(){
    if (!this.input) {
      return;
    }
    jsPlumb.setDraggable(this.input, false);
    jsPlumb.unmakeSource(this.input);
    jsPlumb.makeTarget(this.input,
      endpointOptions, {
        anchor: "TopCenter",
        scope: jsPlumb.Defaults.Scope + " WM_User WM_Action_EFFORT"
      });
    this.refreshAnchors();
  },

  setNodeSource(){
    if (!this.input) {
      return;
    }
    jsPlumb.setDraggable(this.input, false);
    jsPlumb.unmakeTarget(this.input);
    jsPlumb.unmakeSource(this.input);
    jsPlumb.makeSource(this.input, endpointOptions, {
      anchor: "BottomCenter"
    });
    this.refreshAnchors();
  },

  setNodeMovable(){
    if (!this.input) {
      return;
    }
    jsPlumb.setDraggable(this.input, true);
    jsPlumb.unmakeTarget(this.input);
    jsPlumb.unmakeSource(this.input);
    this.refreshAnchors();
  },

  setNodeActionSource(){
    if (!this.input) {
      return;
    }
    jsPlumb.setDraggable(this.input, false);
    jsPlumb.unmakeTarget(this.input);
    jsPlumb.unmakeSource(this.input);
    jsPlumb.makeSource(this.input, actionEndpointOptions, {
      anchor: "Right"
    });
    this.refreshAnchors();
  },

  /*node is focused, but we are not doing anything jsplumb related*/
  setNodeJsplumbDisabled(){
    if (!this.input) {
      return;
    }
    jsPlumb.setDraggable(this.input, false);
    jsPlumb.unmakeTarget(this.input);
    jsPlumb.unmakeSource(this.input);
    this.refreshAnchors();
  },

  shouldComponentUpdate(nextProps, nextState){
    if(!nextProps){
      return true;
    }
    if(nextProps.focused === false && this.props.focused === true){
      let n = this.props.node;
      if(n.action && n.action.length > 0){
        for(let i = 0; i < n.action.length; i++){
            jsPlumb.removeFromDragSelection(n.action[i]._id);
        }
      }
    }
    if(nextProps.focused === true && this.props.focused === false){
      let n = this.props.node;
      if(n.action && n.action.length > 0){
        for(let i = 0; i < n.action.length; i++){
            jsPlumb.addToDragSelection(n.action[i]._id);
        }
      }
    }
    return true;
  },

  resizeHandler : function(newWidth,x,y,z){
    if(this.resizeHandlerTimeout){
      clearTimeout(this.resizeHandlerTimeout);
    }
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    if(newWidth === this.props.node.width){
      clearTimeout(this.resizeHandlerTimeout);
      return;
    }
    var updateCall = function(){
      Actions.updateNode(workspaceID, mapID, id, null, newWidth);
    };
    this.resizeHandlerTimeout = setTimeout(updateCall,100);
  },

  onClickHandler: function(e) {

    e.preventDefault();
    e.stopPropagation();

    let nodeId = this.props.id;

    if ((e.nativeEvent.ctrlKey || e.nativeEvent.altKey)) {
      if (this.props.focused) {
        CanvasActions.deselectNode(nodeId);
      } else {
        CanvasActions.focusAdditionalNode(nodeId);
      }
    } else if (this.props.focused) {
      CanvasActions.deselectNodesAndConnections();
    } else {
      CanvasActions.focusNode(nodeId);
    }
  },

  renderInertia: function(inertia){
    if(inertia === 0 || inertia === null || inertia === undefined){
      return null;
    }

    var style = _.extend(inertiaStyle, {
        width : getInertiaWidth(inertia)
    });

    return <div style={style}></div>;
  },

  renderName(node){
    if(node.constraint === 20){
      return <span>{node.name}<Glyphicon glyph="minus-sign"/></span>;
    }
    if(node.constraint=== 10){
      return <span>{node.name}<Glyphicon glyph="exclamation-sign"/></span>;
    }
    return node.name;
  },

  getVisibility(mapId, node){
    let visibilityArray = node.visibility;
    for(let i = 0; i < visibilityArray.length; i++){
      if(visibilityArray[i].map === mapId){
        return visibilityArray[i].value;
      }
    }
    return null;
  },

  ___openFormASubmapDialog(){
    return SubmapActions.openFormASubmapDialog(this.props.workspaceID, this.props.mapID, this.props.canvasStore.getCanvasState().currentlySelectedNodes, this.props.canvasStore.getCanvasState().currentlySelectedComments);
  },

  render: function() {
    var node = this.props.node;
    var style = getStyleForType(node.type, true);
    var left = node.evolution * this.props.size.width;
    var mapID = this.props.mapID;
    var top = this.getVisibility(mapID, node) * this.props.size.height;
    if(!top){
      console.log('error, component without visiblity');
    }
    style = _.extend(style, {
      left: left,
      top: top,
    });

    var name = this.renderName(node);
    var id = this.props.id;
    var focused = this.props.focused;
    var workspaceID = this.props.workspaceID;
    var inertia = this.renderInertia(this.props.inertia);
    var canvasStore = this.props.canvasStore;

    let localItemCaptionStyle = _.clone(itemCaptionStyle);

    localItemCaptionStyle.fontSize = canvasStore.getNodeFontSize();
    localItemCaptionStyle.top = - localItemCaptionStyle.fontSize;
    localItemCaptionStyle.width = node.width ? node.width + 'px' : 'auto';

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
            10, 10
          ],
          stop: function(event) {
            var offset = getElementOffset(input);
            var x = offset.left;
            var y = offset.top;
            var coords = canvasStore.normalizeComponentCoord({pos : [x,y] });
            Actions.updateNode(workspaceID, mapID, id, {x : coords.x,y:coords.y});
          }
        });
      }}>
        <div style={localItemCaptionStyle} className="node-label">{name}
          <ReactResizeDetector handleWidth onResize={this.resizeHandler} />
        </div>
        {inertia}
        <MenuItem name="group" glyph="resize-small" parentFocused={focused} pos={getMenuItemRelativePos(- Math.PI / 4)}
            hint="Form a submap" placement="left"
            action={this.___openFormASubmapDialog}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="pencil" parentFocused={focused} pos={getMenuItemRelativePos(Math.PI / 4)}
            hint="Edit" placement="top"
            action={Actions.openEditNodeDialog.bind(Actions,mapID, id)}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="remove" parentFocused={focused} pos={getMenuItemRelativePos(-Math.PI/4)}
            hint="Remove" placement="right"
            action={Actions.deleteNode.bind(Actions,workspaceID, mapID, id)}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="link" parentFocused={focused} pos={getMenuItemRelativePos(-3*Math.PI/4)}
            hint="Drag to establish dependency" placement="right"
            jsPlumbOn={this.setNodeSource} jsPlumbOff={this.setNodeJsplumbDisabled}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="move" parentFocused={focused} pos={getMenuItemRelativePos(3*Math.PI/4)}
            hint="Move" placement="left"
            jsPlumbOn={this.setNodeMovable} jsPlumbOff={this.setNodeJsplumbDisabled}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="submap" glyph="zoom-in" parentFocused={focused} pos={getMenuItemRelativePos(Math.PI)}
            hint="Turn a node into a submap" placement="bottom"
            action={Actions.openTurnIntoSubmapNodeDialog.bind(Actions, this.props.workspaceID, this.props.mapID, this.props.id)}
            canvasStore={this.props.canvasStore}
            href={this.props.node.type === Constants.SUBMAP ? "/map/" + this.props.node.submapID : null}/>

        <MenuItem name="info" glyph="info-sign" parentFocused={focused} pos={getMenuItemRelativePos(0)}
            hint="Display detailed component info" placement="top"
            action={Actions.openReferencesDialog.bind(Actions,node.name, node, workspaceID)}
            canvasStore={this.props.canvasStore}/>

        <MenuItem name="action" glyph="arrow-right" parentFocused={focused} pos={getMenuItemRelativePos(-Math.PI/2)}
            hint="Draw an action you want to execute" placement="top"
            jsPlumbOn={this.setNodeActionSource} jsPlumbOff={this.setNodeJsplumbDisabled}
            canvasStore={this.props.canvasStore}/>

      </div>
    );
  }
});

module.exports = MapComponent;
