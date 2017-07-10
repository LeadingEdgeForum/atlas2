/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import {getStyleForType} from './component-styles';


var Comment = React.createClass({

  getInitialState : function(){
    return {focused:false};
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
    style.fontSize = this.props.otherFontSize;
    style.padding = style.fontSize / 6 + 'px';
    style.width = comment.width ? comment.width + 'px' : '100px';
    style.maxWidth = '300px';

    var id = this.props.id;
    var txt = comment.text;

    return (
      <div style={style} id={id}> {txt}
      </div>
    );
  }
});

module.exports = Comment;
