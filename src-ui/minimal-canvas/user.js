/*jshint esversion: 6 */

var React = require('react');
var _ = require('underscore');
var Constants = require('../constants');
import {getStyleForType} from './component-styles';

var activeStyle = {
  boxShadow: "0 0 10px #00789b",
  color: "#00789b"
};

var nonInlinedStyle = {
  position: 'absolute'
};

var itemCaptionStyle = {
  left: 15,
  top: 0,
  position: 'absolute',
  zIndex: 20,
  textShadow: '0 0 5px white, 0 0 3px white, 0 0 7px white, 0 0 1px white',
  maxWidth: 300,
  maxHeight: 200,
  marginBottom: -20,
  lineHeight: 1.1
};


var humanFigureBase64 = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8IS0tIENyZWF0b3I6IENvcmVsRFJBVyAtLT4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMTYwcHgiIGhlaWdodD0iMzIwcHgiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyB0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IGltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVF1YWxpdHk7IGZpbGwtcnVsZTpldmVub2RkOyBjbGlwLXJ1bGU6ZXZlbm9kZCINCnZpZXdCb3g9IjAgMCAxNjAgMzIwIg0KIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIg0KIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyINCiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIg0KIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIg0KIHZlcnNpb249IjEuMSI+DQogPGRlZnM+DQogIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQogICA8IVtDREFUQVsNCiAgICAuZmlsMCB7ZmlsbDojNDQ2OTkxO2ZpbGwtcnVsZTpub256ZXJvfQ0KICAgXV0+DQogIDwvc3R5bGU+DQogPC9kZWZzPg0KIDxnIGlkPSJDYXBhX3gwMDIwXzEiPg0KICA8bWV0YWRhdGEgaWQ9IkNvcmVsQ29ycElEXzBDb3JlbC1MYXllciIvPg0KICA8ZyBpZD0iXzQ3ODE3MzA0Ij4NCiAgIDxnIGlkPSJnNDkzMSI+DQogICAgPHBhdGggaWQ9InBhdGg0OTMzIiBjbGFzcz0iZmlsMCIgZD0iTTgwLjAwMzUgNjAuMDQ2NGMxMy40NDU3LDAgMjQuMzUyMSwtMTAuOTAyOCAyNC4zNTIxLC0yNC4zNTIxIDAsLTEzLjQ0NTcgLTEwLjkwNjQsLTI0LjM0NzQgLTI0LjM1MjEsLTI0LjM0NzQgLTEzLjQ0OTMsMCAtMjQuMzUyMSwxMC45MDI4IC0yNC4zNTIxLDI0LjM0NzQgMCwxMy40NDkzIDEwLjkwMjgsMjQuMzUyMSAyNC4zNTIxLDI0LjM1MjF6Ii8+DQogICA8L2c+DQogICA8ZyBpZD0iZzQ5MzUiPg0KICAgIDxwYXRoIGlkPSJwYXRoNDkzNyIgY2xhc3M9ImZpbDAiIGQ9Ik0xMDYuOSA2Ni4yODVjMTcuMjI2NSwwIDMxLjMzNiwxMy45NjU0IDMxLjMzNiwzMS4xOTU0bDAgNzUuNTExOGMwLDUuODg2NjQgLTQuNjI4NzYsMTAuNjYwNyAtMTAuNTE1NCwxMC42NjA3IC01Ljg5MDE5LDAgLTEwLjY2NDIsLTQuNzc0MDQgLTEwLjY2NDIsLTEwLjY2MDdsMCAtNjguMDg2MiAtNS40OTIxNSAwIDAgMTg5LjQ2MmMwLDcuODkwOTggLTYuNDU3MTIsMTQuMjg1NSAtMTQuMzQ4MSwxNC4yODU1IC03Ljg5MDk4LDAgLTE0LjI4NTUsLTYuMzk0NTIgLTE0LjI4NTUsLTE0LjI4NTVsMCAtMTEwLjAxNyAtNS44NTU5MyAwIDAgMTEwLjAxN2MwLDcuODkwOTggLTYuMzk4MDYsMTQuMjg1NSAtMTQuMjg1NSwxNC4yODU1IC03Ljg5MDk4LDAgLTE0LjI4NTUsLTYuMzk0NTIgLTE0LjI4NTUsLTE0LjI4NTUgMCwtMTEuNjg3MSAtMC4xMjUxOTcsLTE4OS40NjIgLTAuMTI1MTk3LC0xODkuNDYybC01LjQyOTU1IDAgMCA2OC4wODYyYzAsNS44ODY2NCAtNC43NzQwNCwxMC42NjA3IC0xMC42NjQyLDEwLjY2MDcgLTUuODg2NjQsMCAtMTAuNTIwMSwtNC43NzQwNCAtMTAuNTIwMSwtMTAuNjYwN2wwIC03NS41MTE4YzAsLTE3LjIzIDE0LjExMzEsLTMxLjE5NTQgMzEuMzM5NSwtMzEuMTk1NGw1My43OTU5IDB6Ii8+DQogICA8L2c+DQogIDwvZz4NCiA8L2c+DQo8L3N2Zz4=";

var User = React.createClass({

  render: function() {
    let user = this.props.user;
    var style = getStyleForType(Constants.USER);
    var left = user.x * this.props.size.width;
    var top = Math.round(user.y * this.props.size.height);
    style = _.extend(style, {
      left: left,
      top: top,
      position: 'absolute',
      cursor: 'pointer'
    });
    var added = this.props.added;
    if(added){
      style.boxShadow = "0 0 3px 3px green";
    }
    var removed = this.props.removed;
    if(removed){
      style.boxShadow = "0 0 3px 3px red";
      style.opacity = "0.8";
    }
    style.backgroundImage = "url(\"data:image/svg+xml;base64," + humanFigureBase64 + "\")";
    // this.decorateDiffStyle(node, style, diff);
    var name = this.props.user.name;
    var _this = this;
    var id = this.props.id;
    itemCaptionStyle.fontSize = this.props.nodeFontSize;
    itemCaptionStyle.top = - itemCaptionStyle.fontSize;
    itemCaptionStyle.width = this.props.user.width ? this.props.user.width + 'px' : 'auto';

    return (
      <div style={style} id={id} key={id}>
        <div style={itemCaptionStyle}>{name}</div>
      </div>
    );
  }
});

module.exports = User;
