/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import {getStyleForType} from './component-styles';
import {Glyphicon} from 'react-bootstrap';
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

var itemCaptionStyle = {
  left: 10,
  position: 'absolute',
  zIndex: 20,
  textShadow: '0 0 5px white, 0 0 3px white, 0 0 7px white, 0 0 1px white',
  height: 22,
  maxWidth: 100,
  maxHeight: 22,
  marginBottom: -20,
  fontSize: 10,
  lineHeight: 1.1
};

var inertiaStyle = {
  top: -15,
  left: 15,
  position: 'absolute',
  zIndex: 10,
  backgroundColor: 'grey',
  height: 40
};

var HistoricComponent = React.createClass({

  getInitialState: function() {
    return {focus: false};
  },

  renderInertia: function(inertia){
    if(inertia === 0 || inertia === null || inertia === undefined){
      return null;
    }
    var width = 15* inertia;

    var style = _.extend(inertiaStyle, {
        width : width
    });
    return <div style={style}></div>;
  },

  renderName(node){
    if(node.constraint == 20){
      return <span>{node.name}<Glyphicon glyph="minus-sign"/></span>;
    }
    if(node.constraint == 10){
      return <span>{node.name}<Glyphicon glyph="exclamation-sign"/></span>;
    }
    return node.name;
  },

  decorateDiffStyle(type, node, style, diff) {
    if(type === "DELETED"){
      style.boxShadow = "0 0 3px 3px red";
      style.opacity = "0.8";
    }
    if(type === "MOVED"){
      style.boxShadow = "0 0 3px 3px orange";
      style.opacity = "0.8";
      style.border = '1px solid dimgray';
    }
  },

  // very ugly workaround for https://github.com/cdaniel/atlas2/issues/170
  // jsPlumb caches endpoint position, and only deleteEveryEndpoint can invalidate it.
  // endpoint specific methods have no effect, and when the node gets rearranged by React
  // all connections start from 0,0. jsPlumb fails to pick up changes.
  componentWillUnmount : function(){
    if (this.props.canvasStore.isDiffEnabled() && this.props.type === "MOVED") {
      jsPlumb.deleteEveryEndpoint(this.props.id);
    }
  },

  render: function() {

    if (!this.props.canvasStore.isDiffEnabled()) {
      return null;
    }

    var node = this.props.node;
    var diff = this.props.diff;
    var style = getStyleForType(node.type);
    var left = node.x * this.props.size.width;
    var top = node.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    let type = this.props.type;
    this.decorateDiffStyle(type, node, style, diff);

    var name = this.renderName(node);
    var _this = this;
    var id = this.props.id;
    var mapID = this.props.mapID;
    var workspaceID = this.props.workspaceID;
    var inertia = this.renderInertia(this.props.inertia);
    var canvasStore = this.props.canvasStore;
    itemCaptionStyle.fontSize = canvasStore.getNodeFontSize();
    itemCaptionStyle.top = - itemCaptionStyle.fontSize;
    
    return (
      <div style={style} id={id} key={id}>
        <div style={itemCaptionStyle}>{name}</div>
        {inertia}
      </div>
    );
  }
});

module.exports = HistoricComponent;
