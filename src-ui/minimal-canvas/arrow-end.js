/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import {getStyleForType} from './component-styles';



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
    var id = this.props.id;

    return (
      <div style={style} id={id} >
      </div>
    );
  }
});

module.exports = ArrowEnd;
