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

const React = require('react');
const _ = require('underscore');
const Constants = require('../constants');
import Actions from './single-map-actions';
import SubmapActions from './dialogs/form-submap/form-a-submap-actions';
import {Glyphicon} from 'react-bootstrap';
import {
  actionEndpointOptions,
  itemCaptionStyle,
  endpointOptions,
  getStyleForType,
  inertiaStyle,
  getElementOffset,
  getInertiaWidth,
  getMenuItemRelativePos
} from './component-styles';
import CanvasActions from './canvas-actions';
import ReactResizeDetector from 'react-resize-detector';
const createReactClass = require('create-react-class');
import MenuItem from './MenuItem';

const jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;


const MapComponent = createReactClass({

  componentDidMount: function() {
    this.componentDidUpdate();
  },

  componentDidUpdate: function() {
    if (!this.input) {
      return;
    }
    if (!this.isFocused()) {
      this.setNodeTarget();
    }
    this.refreshAnchors();
  },

  isFocused(){
    return this.props.canvasStore.shouldBeFocused(this.props.node);
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
    if(this.props.node.type === Constants.USER){
      /* users do not accept connections */
      jsPlumb.unmakeTarget(this.input);
    } else {
      jsPlumb.makeTarget(this.input,
        endpointOptions, {
          anchor: "TopCenter",
          scope: jsPlumb.Defaults.Scope + " WM_Users WM_Action_EFFORT"
        });
    }
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

    resizeHandler : function(newWidth,x,y,z){
        // newWidth comes with px. We want to use em.
        newWidth = (newWidth / this.props.canvasStore.getNodeFontSize());

        if(this.resizeHandlerTimeout){
            clearTimeout(this.resizeHandlerTimeout);
        }

        const id = this.props.id;
        const mapID = this.props.mapID;
        const workspaceID = this.props.workspaceID;

        if(newWidth === this.props.node.width){
            clearTimeout(this.resizeHandlerTimeout);
            return;
        }


        let updateCall;
        if(this.props.node.type === Constants.USER){
            updateCall = function(){
                Actions.updateUser(workspaceID, mapID, id, null, null, null,  newWidth);
            };
        } else {
            updateCall = function(){
                Actions.updateNode(workspaceID, mapID, id, null, newWidth);
            };
        }
        this.resizeHandlerTimeout = setTimeout(updateCall,100);
    },

  onClickHandler: function(e) {

    e.preventDefault();
    e.stopPropagation();

    let node = this.props.node;


    if ((e.nativeEvent.ctrlKey || e.nativeEvent.altKey)) {
      if (this.isFocused()) {
        if(this.props.node.type === Constants.USER){
          CanvasActions.focusRemoveUser(this.props.id);
        } else {
          CanvasActions.deselectNode(node);
        }
      } else {
        if(this.props.node.type === Constants.USER){
          CanvasActions.focusAddUser(this.props.id);
        } else {
          CanvasActions.focusAdditionalNode(node);
        }
      }
    } else if (this.isFocused()) {
      if(this.props.node.type === Constants.USER){
        CanvasActions.focusRemoveUser(this.props.id);
      } else {
        CanvasActions.deselectNodesAndConnections();
      }
    } else {
      if(this.props.node.type === Constants.USER){
        CanvasActions.focusUser(this.props.id);
      } else {
        CanvasActions.focusNode(node);
      }
    }
  },

  jsPlumbDragStopHandler: function(event){
      let offset = getElementOffset(this.input);
      let x = offset.left;
      let y = offset.top;
      let coords = this.props.canvasStore.normalizeComponentCoord({pos : [x,y] });
      let workspaceID = this.props.workspaceID;
      let mapID = this.props.mapID;
      if(this.type === Constants.USER){
          Actions.updateUser(workspaceID, mapID, this.props.id, null, null, {x : coords.x,y:coords.y});
      } else {
          Actions.updateNode(workspaceID, mapID, this.props.id, {x : coords.x,y:coords.y});
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

  ___openEditDialog(){
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var node = this.props.node;
    if(node.type === Constants.USER){
        Actions.openEditUserDialog(workspaceID, mapID, id, node.name, node.description);
    } else {
        Actions.openEditNodeDialog(mapID, id);
    }
  },

  ___remove(){
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var node = this.props.node;
    if(this.type === Constants.USER){
        Actions.deleteUser(workspaceID, mapID, id);
    } else {
        Actions.deleteNode(workspaceID, mapID, id);
    }
  },

  constructComponentMenu(workspaceID, mapID, node, id, focused){
    let results = [];

    if(node.type !== Constants.USER){
      results.push(<MenuItem name="group" glyph="resize-small" parentFocused={focused} pos={getMenuItemRelativePos(- Math.PI / 4)}
          hint="Form a submap" placement="left" key="group"
          action={this.___openFormASubmapDialog}
          canvasStore={this.props.canvasStore}/>);
    }

    results.push(<MenuItem name="pencil" parentFocused={focused} pos={getMenuItemRelativePos(Math.PI / 4)}
        hint="Edit" placement="top" key="pencil"
        action={this.___openEditDialog.bind(this, node)}
        canvasStore={this.props.canvasStore}/>);

    results.push(<MenuItem name="remove" parentFocused={focused} pos={getMenuItemRelativePos(-Math.PI/4)}
            hint="Remove" placement="right" key="remove"
            action={this.___remove}
            canvasStore={this.props.canvasStore}/>);

    results.push(<MenuItem name="link" parentFocused={focused} pos={getMenuItemRelativePos(-3*Math.PI/4)}
          hint="Drag to establish dependency" placement="right" key="link"
          jsPlumbOn={this.setNodeSource} jsPlumbOff={this.setNodeJsplumbDisabled}
          canvasStore={this.props.canvasStore}/>);

    results.push(<MenuItem name="move" parentFocused={focused} pos={getMenuItemRelativePos(3*Math.PI/4)}
        hint="Move" placement="left" key="move"
        jsPlumbOn={this.setNodeMovable} jsPlumbOff={this.setNodeJsplumbDisabled}
        canvasStore={this.props.canvasStore}/>);

    if(node.type !== Constants.USER && node.type !== Constants.USERNEED){
      results.push(<MenuItem name="submap" glyph="zoom-in" parentFocused={focused} pos={getMenuItemRelativePos(Math.PI)}
          hint="Turn a node into a submap" placement="top" key="submap"
          action={Actions.openTurnIntoSubmapNodeDialog.bind(Actions, this.props.workspaceID, this.props.mapID, this.props.id)}
          canvasStore={this.props.canvasStore}
          href={this.props.node.type === Constants.SUBMAP ? "/map/" + this.props.node.submapID : null}/>);
    }

    if(node.type !== Constants.USER){
      results.push(<MenuItem name="info" glyph="info-sign" parentFocused={focused} pos={getMenuItemRelativePos(0)}
          hint="Display detailed component info" placement="top" key="info"
          action={Actions.openReferencesDialog.bind(Actions,node.name, node, workspaceID)}
          canvasStore={this.props.canvasStore}/>);
    }

    if(node.type !== Constants.USER && node.type !== Constants.USERNEED){
      results.push(<MenuItem name="action" glyph="arrow-right" parentFocused={focused} pos={getMenuItemRelativePos(-Math.PI/2)}
          hint="Draw an action you want to execute" placement="top" key="action"
          jsPlumbOn={this.setNodeActionSource} jsPlumbOff={this.setNodeJsplumbDisabled}
          canvasStore={this.props.canvasStore}/>);
    }
    return results;
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
    let focused = this.props.canvasStore.shouldBeFocused(node);
    var workspaceID = this.props.workspaceID;
    var inertia = this.renderInertia(this.props.inertia);
    var canvasStore = this.props.canvasStore;

    let localItemCaptionStyle = _.clone(itemCaptionStyle);

    localItemCaptionStyle.fontSize = canvasStore.getNodeFontSize();
    localItemCaptionStyle.top = - localItemCaptionStyle.fontSize;
    localItemCaptionStyle.width = node.width ? node.width + 'em' : 'auto';
    console.log(localItemCaptionStyle.width, canvasStore.getNodeFontSize());

    let menu = this.constructComponentMenu(workspaceID, mapID, node, id, focused);

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
          stop: this.jsPlumbDragStopHandler
        });
      }}>
        <div style={localItemCaptionStyle} className="node-label">{name}
          <ReactResizeDetector handleWidth onResize={this.resizeHandler} />
        </div>
        {inertia}
        {menu}
      </div>
    );
  }
});

module.exports = MapComponent;
