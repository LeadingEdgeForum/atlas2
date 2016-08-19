/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('./../../../../constants');
import Actions from '../../../../actions';
import {getStyleForType} from './component-styles';

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

// var endpointOptions = {
//   paintStyle: {
//     fillStyle: "transparent",
//     outlineColor: 'transparent'
//   },
//   allowLoopback: false,
//   connector: "Straight",
//   connectorStyle: {
//     lineWidth: 2,
//     strokeStyle: 'silver',
//     outlineColor: "transparent",
//     outlineWidth: 10
//   },
//   endpoint: [
//     "Dot", {
//       radius: 1
//     }
//   ],
//   deleteEndpointsOnDetach: false,
//   uniqueEndpoints: true
// };
//
// var actionEndpointOptions = {
//   paintStyle: {
//     fillStyle: "transparent",
//     outlineColor: 'transparent'
//   },
//   allowLoopback: false,
//   connector: "Straight",
//   connectorStyle: {
//     lineWidth: 2,
//     strokeStyle: '#339933',
//     outlineColor: "transparent",
//     outlineWidth: 10
//   },
//   endpoint: [
//     "Dot", {
//       radius: 1
//     }
//   ],
//   connectorOverlays: [
//     [
//       "Arrow", {
//         location: 1.0,
//         width: 8,
//         height: 3
//       }
//     ]
//   ],
//   deleteEndpointsOnDetach: false,
//   uniqueEndpoints: true
// };

var nonInlinedStyle = {
  position: 'absolute'
};

// var itemCaptionStyle = {
//   top: -10,
//   left: 23,
//   position: 'absolute',
//   zIndex: 2,
//   textShadow: '2px 2px white',
//   width: 100,
//   height: 22,
//   maxWidth: 100,
//   maxHeight: 22,
//   marginBottom: -20,
//   fontSize: 10,
//   lineHeight: '11px'
// };

var MapComponent = React.createClass({
  // id: null, left: 0, top: 0, positioned: false,
  // relatedConnections: [],
  // relatedConnectionListeners: [],

  // getAnchors: function(scope) {
  //   if (scope === jsPlumb.getDefaultScope()) {
  //     return ["BottomCenter", "TopCenter"];
  //   }
  //   if (scope === 'Actions') {
  //     return ["Right", "Left"];
  //   }
  // },

  // getConnector: function(scope) {
  //   if (scope === jsPlumb.getDefaultScope()) {
  //     return endpointOptions.connector;
  //   }
  //   if (scope === 'Actions') {
  //     return actionEndpointOptions.connector;
  //   }
  // },
  //
  // getConnectorStyle: function(scope) {
  //   if (scope === jsPlumb.getDefaultScope()) {
  //     return endpointOptions.connectorStyle;
  //   }
  //   if (scope === 'Actions') {
  //     return actionEndpointOptions.connectorStyle;
  //   }
  // },
  //
  // getOverlays: function(scope) {
  //   if (scope === jsPlumb.getDefaultScope()) {
  //     return [];
  //   }
  //   if (scope === 'Actions') {
  //     return actionEndpointOptions.connectorOverlays;
  //   }
  // },
  //
  // sortOutDeps: function() {
  //   var _this = this;
  //   var connections = _this.props.store.getAll().connections;
  //   _this.relatedConnections = [];
  //   for (var i = 0; i < connections.length; i++) {
  //     if (connections[i].sourceId === _this.id) {
  //       _this.relatedConnections.push(connections[i]);
  //     }
  //   }
  //
  //   //TODO: check if all connections exist and reconcile them
  //   for (var k = 0; k < this.relatedConnections.length; k++) {
  //     if (this.relatedConnections[k].conn) {
  //       continue;
  //     } //the connection exists
  //     var _conn = this.relatedConnections[k];
  //     var connectionData = {
  //       source: _conn.sourceId,
  //       target: _conn.targetId,
  //       scope: _conn.scope,
  //       anchors: this.getAnchors(_conn.scope),
  //       paintStyle: this.getConnectorStyle(_conn.scope),
  //       endpoint: endpointOptions.endpoint,
  //       connector: this.getConnector(_conn.scope),
  //       endpointStyles: [
  //         endpointOptions.paintStyle, endpointOptions.paintStyle
  //       ],
  //       overlays: this.getOverlays(_conn.scope)
  //     };
  //     this.relatedConnections[k].conn = jsPlumb.connect(connectionData);
  //   }
  // },
  // connectionDelete: function(_conn) {
  //   jsPlumb.detach(_conn); //remove from jsPlumb
  //   MapActions.deleteConnection(_conn); //update the state
  // },

  componentDidMount: function() {
    // this.sortOutDeps();
  },

  componentWillUnmount: function() {
    // if (this === undefined || this.id === undefined) {
    //   return;
    // }
    // jsPlumb.detachAllConnections(this.id);
    // jsPlumb.removeAllEndpoints(this.id);
    // jsPlumb.detach(this.id);
  },

  componentDidUpdate: function(prevProps, prevState) {

    // this.sortOutDeps();
    //
    // if (this === undefined || this.id === undefined) {
    //   jsPlumb.repaintEverything();
    //   return;
    // }
    //
    // if (this.props.mapMode !== MapConstants.MAP_EDITOR_DRAG_MODE) {
    //   jsPlumb.setDraggable(this.id, false);
    // }
    // if (this.props.mapMode !== MapConstants.MAP_EDITOR_CONNECT_MODE) {
    //   jsPlumb.unmakeSource(this.id);
    //   jsPlumb.unmakeTarget(this.id);
    // }
    // if (this.props.mapMode !== MapConstants.MAP_EDITOR_DELETE_MODE) {
    //   //connections. nodes are handled by a direct listener
    //   for (var j = 0; j < this.relatedConnections.length; j++) {
    //     if (this.relatedConnections[j].conn) {
    //       this.relatedConnections[j].conn.unbind('click');
    //     }
    //   }
    // }
    //
    // if (this.props.mapMode === MapConstants.MAP_EDITOR_DRAG_MODE) {
    //   var _this = this;
    //   jsPlumb.draggable(this.id, {
    //     ignoreZoom: true,
    //     containment: true,
    //     grid: [
    //       50, 50
    //     ],
    //     stop: function(params) {
    //       MapActions.nodeDragged({
    //         id: _this.id,
    //         pos: {
    //           left: params.pos[0] / _this.props.canvasSize.width,
    //           top: params.pos[1] / _this.props.canvasSize.height
    //         }
    //       });
    //     }
    //   });
    //   jsPlumb.setDraggable(this.id, true);
    // }
    //
    // if (this.props.mapMode === MapConstants.MAP_EDITOR_CONNECT_MODE) {
    //   jsPlumb.makeTarget(this.id, endpointOptions, {anchor: "TopCenter"});
    //   jsPlumb.makeSource(this.id, endpointOptions, {anchor: "BottomCenter"});
    // }
    //
    // if (this.props.mapMode === MapConstants.MAP_EDITOR_DELETE_MODE) {
    //   for (var i = 0; i < this.relatedConnections.length; i++) {
    //     var conn = this.relatedConnections[i].conn;
    //     conn.bind('click', this.connectionDelete);
    //   }
    // }
  },

  // delete: function() {
  //   jsPlumb.detachAllConnections(this.id);
  //   jsPlumb.removeAllEndpoints(this.id);
  //   jsPlumb.detach(this.id);
  //   MapActions.deleteNode(this.id);
  // },
  //
  // editNode: function() {
  //   MapActions.editNode(this.id);
  // },

  render: function() {
    console.log("trying to render", this.props.node);
    var node = this.props.node;
    // var that = this;
    //
    // var styleToSet = _.clone(mapComponentStyle);
    // if (that.props.inline) {
    //   styleToSet = _.extend(styleToSet, inlinedStyle);
    // } else {
    //   styleToSet = _.extend(styleToSet, nonInlinedStyle);
    // }
    // styleToSet = _.extend(styleToSet, that.props.styleOverride);
    //
    // if (that.props.position) {
    //   this.left = this.props.position.positionX * this.props.canvasSize.width;
    //   styleToSet.left = this.left;
    //   this.top = this.props.position.positionY * this.props.canvasSize.height;
    //   styleToSet.top = this.top;
    //   this.positioned = true;
    // }
    //
    // that.id = this.props.id;
    // var name = this.props.name;
    // // var onClickHandler = null;
    // // onClickHandler = this.props.mapMode === MapConstants.MAP_EDITOR_DELETE_MODE
    // //   ? this.delete
    // //   : null;
    // // if (this.props.mapMode === MapConstants.MAP_EDITOR_EDIT_MODE) {
    // //   onClickHandler = this.editNode;
    // // }
    // return (
    //   <div style={styleToSet} id={this.props.id} onClick={onClickHandler}>
    //     <div style={itemCaptionStyle}>
    //       {name}
    //     </div>
    //   </div>
    // );
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
    return (
      <div style={style}>
        {name}
      </div>
    );
  }
});

module.exports = MapComponent;
