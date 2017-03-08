/*jshint esversion: 6 */

var _ = require('underscore');
var Constants = require('./../../../../constants');

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

var arrowEndStyle = _.extend(_.clone(mapComponentStyle), {
  border: '1px solid silver',
  backgroundColor: 'silver',
  borderRadius: _diameter / 4,
  minHeight: _diameter/2,
  minWidth: _diameter/2,
  maxWidth: _diameter/2,
  maxHeight: _diameter/2,
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
  lineHeight: '11px',
  padding: '1px',
  float: 'left',
  maxWidth : '150px'
};

var getStyleForType = function(type) {
  var style = null;
  switch (type) {
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
    case "ArrowEnd":
      style = arrowEndStyle;
      break;
    case "GenericComment":
      style = genericCommentStyle;
      break;
  }
  return _.clone(style);
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

var actionEndpointOptions= {
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
  scope : "WM_Action",
  connectorOverlays: [
      ["Arrow", {
          width: 10,
          length: 10,
          location: 1,
          direction: 1
      }]
  ]
  };
export {
    userNeedStyle,
    externalStyle,
    internalStyle,
    submapStyle,
    genericCommentPalletteStyle,
    getStyleForType,
    endpointOptions,
    actionEndpointOptions
};
