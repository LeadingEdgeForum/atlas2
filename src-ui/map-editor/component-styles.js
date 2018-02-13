/*jshint esversion: 6 */

var _ = require('underscore');
var Constants = require('./../constants');

var _diameter = 10;
var mapComponentStyle = {
  minHeight: _diameter,
  minWidth: _diameter,
  maxWidth: _diameter,
  maxHeight: _diameter,
  borderRadius: _diameter / 2,
  zIndex: 5,
  border: '3px solid black',
  backgroundColor: 'silver',
  float: 'left'
};
var userStyle = {
  zIndex: 5,
  width : 15,
  height : 30,
  backgroundImage: "url(\"/img/human-figure.svg\")",
  backgroundSize: "100% 100%",
  float: 'left'
};
var userNeedStyle = _.extend(_.clone(mapComponentStyle), {
  border: '3px solid #00789b',
  backgroundColor: '#00789b'
});
var externalStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid black',
  backgroundColor: 'silver'
});
var internalStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid black',
  backgroundColor: 'white'
});

var submapStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid black',
  backgroundColor: 'black'
});

var marketReferenceStyle = _.extend(_.clone(externalStyle), {
  border: '1px dotted black',
  zIndex : 4,
  backgroundColor : '#f8f8f8'
});

var arrowEndStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid silver',
  backgroundColor: 'silver',
  borderRadius: _diameter / 4,
  minHeight: _diameter / 2,
  minWidth: _diameter / 2,
  maxWidth: _diameter / 2,
  maxHeight: _diameter / 2,
});

var genericCommentPalletteStyle = {
  minHeight: _diameter * 1.2,
  minWidth: _diameter * 1.2,
  maxWidth: _diameter * 1.2,
  maxHeight: _diameter * 1.2,
  borderRadius: _diameter / 3,
  zIndex: 5,
  border: '1px solid orange',
  backgroundColor: 'yellow',
  float: 'left'
};

var genericCommentStyle = {
  minHeight: _diameter * 1.2,
  minWidth: _diameter * 1.2,
  borderRadius: _diameter / 3,
  zIndex: 5,
  border: '1px solid orange',
  backgroundColor: 'yellow',
  fontSize: 10,
  lineHeight: 1.1,
  padding: '1px',
  float: 'left'
};

var canvasComponent = {
  position: 'absolute',
  cursor: 'pointer'
};

var getStyleForType = function(type, forCanvas) {
  var style = null;
  switch (type) {
    case Constants.USER:
      style = userStyle;
      break;
    case Constants.USERNEED:
      style = userNeedStyle;
      break;
    case Constants.INTERNAL:
      style = internalStyle;
      break;
    case Constants.EXTERNAL:
      style = externalStyle;
      break;
    case Constants.SUBMAP:
      style = submapStyle;
      break;
    case "MARKET_REFERENCE":
      style = marketReferenceStyle;
      break;
    case "ArrowEnd":
      style = arrowEndStyle;
      break;
    case "GenericComment":
      style = genericCommentStyle;
      break;
  }
  style = _.clone(style);
  if(forCanvas){
    style = _.extend(style, canvasComponent);
  }
  return style;
};

var endpointOptions = {
  paintStyle: {
    fillStyle: "transparent",
    outlineColor: 'transparent'
  },
  allowLoopback: false,
  connector: "Straight",
  connectorStyle: {
    strokeWidth: 1,
    stroke: 'silver',
    outlineStroke: "transparent",
    outlineWidth: 10
  },
  endpoint: [
    "Dot", {
      radius: 1
    }
  ],
  deleteEndpointsOnDetach: false,
  uniqueEndpoints: true
};

var userEndpointOptions = {
  paintStyle: {
    fillStyle: "transparent",
    outlineColor: 'transparent'
  },
  allowLoopback: false,
  connector: "Straight",
  connectorStyle: {
    strokeWidth: 1,
    stroke: 'silver',
    outlineStroke: "transparent",
    outlineWidth: 10,
    dashstyle: '6 6'
  },
  scope: "WM_User",
  endpoint: [
    "Dot", {
      radius: 1
    }
  ],
  deleteEndpointsOnDetach: false,
  uniqueEndpoints: true
};

var actionEndpointOptions = {
  paintStyle: {
    fillStyle: "transparent",
    outlineColor: 'transparent'
  },
  allowLoopback: false,
  connector: "Straight",
  connectorStyle: {
    strokeWidth: 2,
    stroke: 'gray',
    outlineStroke: 'transparent',
    outlineWidth: 10
  },
  endpoint: [
    "Dot", {
      radius: 1
    }
  ],
  deleteEndpointsOnDetach: false,
  uniqueEndpoints: true,
  scope: "WM_Action_EFFORT",
  connectorOverlays: [
    ["Arrow", {
      width: 10,
      length: 10,
      location: 1,
      direction: 1
    }]
  ]
};
var moveEndpointOptions = {
  paintStyle: {
    fillStyle: "transparent",
    outlineColor: 'transparent',
    stroke:'orange'
  },
  allowLoopback: false,
  connector: "Straight",
  connectorStyle: {
    strokeWidth: 2,
    stroke: 'gray',
    outlineStroke: 'transparent',
    outlineWidth: 10
  },
  endpoint: [
    "Dot", {
      radius: 1
    }
  ],
  scope: "WM_MOVED",
  connectorOverlays: [
    ["Arrow", {
      width: 10,
      length: 10,
      location: 1,
      direction: 1
    }]
  ]
};

let inactiveMenuStyle = {
  position: "absolute",
  fontSize: "20px",
  color: "silver",
  zIndex: "30"
};

let activeMenuStyle = {
  boxShadow: "0 0 10px #00789b",
  color: "#00789b"
};

var itemCaptionStyle = {
  left: 10,
  position: 'absolute',
  zIndex: 20,
  textShadow: '0 0 5px white, 0 0 3px white, 0 0 7px white, 0 0 1px white',
  maxWidth: 300,
  maxHeight: 200,
  marginBottom: -20,
  lineHeight: 1.1,
  overflow: 'auto',
  resize :'horizontal'
};

var inertiaStyle = {
  top: -15,
  left: 15,
  position: 'absolute',
  zIndex: 10,
  backgroundColor: 'grey',
  height: 40
};
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

function getInertiaWidth(inertia){
  return 15 * inertia;
}
export {
  userStyle,
  userNeedStyle,
  externalStyle,
  internalStyle,
  submapStyle,
  genericCommentPalletteStyle,
  getStyleForType,
  endpointOptions,
  userEndpointOptions,
  actionEndpointOptions,
  moveEndpointOptions,
  inactiveMenuStyle,
  activeMenuStyle,
  canvasComponent,
  itemCaptionStyle,
  inertiaStyle,
  getElementOffset,
  getInertiaWidth
};
