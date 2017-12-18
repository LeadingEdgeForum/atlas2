/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
import {getStyleForType} from './component-styles';
var createReactClass = require('create-react-class');

var nonInlinedStyle = {
  position: 'absolute'
};

var itemCaptionStyle = {
  left: 10,
  position: 'absolute',
  zIndex: 20,
  textShadow: '0 0 5px white, 0 0 3px white, 0 0 7px white, 0 0 1px white',
  width : 'auto',
  maxWidth: 300,
  maxHeight: 200,
  marginBottom: -20,
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

var MapComponent = createReactClass({
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
      return <span>{node.name}<img alt="Minus" width="10" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+5pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOjY1RTYzOTA2ODZDRjExREJBNkUyRDg4N0NFQUNCNDA3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjJBNDNBQjg5MDY5RjExRTI5OUZEQTZGODg4RDc1ODdCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjJBNDNBQjg4MDY5RjExRTI5OUZEQTZGODg4RDc1ODdCIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTgwMTE3NDA3MjA2ODExODA4M0ZFMkJBM0M1RUU2NSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowNjgwMTE3NDA3MjA2ODExODA4M0U3NkRBMDNEMDVDMSIvPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPmdseXBoaWNvbnM8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnRpdGxlPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjBen84AAADMSURBVHjavJaNDYQgDIXFCRiBERjBERnNETqCG/RoUgwSwd6dvCYvJqbtF7E/OGZeLOacC/kRmteU48mUQEA9aeIkCcW1I1KfMMzVAXgN5i8lMd4Eyhaz9h8gRRIbhyCFHH9Aio4W1h7X/gKk/jJ/B0ovQs5/dgFpdfEkhRqUJoJSDaKJICpDYeaxnccnoG3gEEfdftMavTzbEGSFVLAuaF0wFtaHiR2tmR58CVcMsPJGNyxmBMGGKnRNwBYfdJVDLyezrlsOdYH8CDAAn5YfwrN58ucAAAAASUVORK5CYII=" /></span>;
    }
    if(node.constraint == 10){
      return <span>{node.name}<img alt="Exclamation" width="10" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+5pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOjY1RTYzOTA2ODZDRjExREJBNkUyRDg4N0NFQUNCNDA3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkEzRUY0MTREMDZBMDExRTI5OUZEQTZGODg4RDc1ODdCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkEzRUY0MTRDMDZBMDExRTI5OUZEQTZGODg4RDc1ODdCIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowMTgwMTE3NDA3MjA2ODExODA4M0ZFMkJBM0M1RUU2NSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowNjgwMTE3NDA3MjA2ODExODA4M0U3NkRBMDNEMDVDMSIvPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPmdseXBoaWNvbnM8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnRpdGxlPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsWZdZ8AAAD8SURBVHjavFaBDcQgCFTzA3SDukH7m3WU7yYd5UdwhG7gS4JN368F/AjJpaQRDhFEG2M0HLHW+vTxxe+Q7APLARDVgI5f4BCWVhBwjb/1VSEY0DgKATYDiyjJnPBuIMkA2/mWCEn2P0gy9pKsTBe1k7kIitrZcEVEnslFmskz+yLC6oodiGKuRodVvph+shx9RPTJT3SSLGBTG4cdPzKj8xX9TkbgcAKDXGlXOhmgE+a7lchoEYl3NFV0SsIDK44t6WAXvGIkEqTl3YJwbtiNGdkzGVkA6Eyb7dywOlcQjuO1w/WzHqNefUyoDT7VUa76OOn13LJaD8iPAAMABaJvADxmgE8AAAAASUVORK5CYII=" /></span>;
    }
    return node.name;
  },
  render: function() {
    var node = this.props.node;

    var style = getStyleForType(node.type);
    var left = node.x * this.props.size.width;
    var top = node.y * this.props.size.height;
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    var name = this.renderName(node);
    var id = this.props.id;
    var inertia = this.renderInertia(this.props.inertia);
    var nodeFontSize = this.props.nodeFontSize;
    let localItemCaptionStyle = _.clone(itemCaptionStyle);
    localItemCaptionStyle.fontSize = nodeFontSize;
    localItemCaptionStyle.top = - nodeFontSize;
    localItemCaptionStyle.width = node.width ? node.width + 'px' : '100px';

    var moved = this.props.moved;
    if(moved){
      style.boxShadow = "0 0 3px 3px orange";
      style.opacity = "0.8";
      style.border = '1px solid dimgray';
    }
    var added = this.props.added;
    if(added){
      style.boxShadow = "0 0 3px 3px green";
    }
    var removed = this.props.removed;
    if(removed){
      style.boxShadow = "0 0 3px 3px red";
      style.opacity = "0.8";
    }
    var changed = this.props.changed;
    if(changed){
      style.boxShadow = "0 0 3px 3px orange";
    }
    return (
      <div style={style}  id={id} >
        <div style={localItemCaptionStyle}>{name}</div>
        {inertia}
      </div>
    );
  }
});

module.exports = MapComponent;
