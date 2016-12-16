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

export {userNeedStyle, externalStyle, internalStyle, submapStyle, getStyleForType, endpointOptions};
