/* Copyright 2016,2018 Krzysztof Daniel.

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
  maxWidth: '30em',
  maxHeight: '20em',
  marginBottom: -20,
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
    let de = document.documentElement;
    let box = element.getBoundingClientRect();
    let top = box.top + window.pageYOffset - de.clientTop;
    let left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
}

function getInertiaWidth(inertia){
  return 15 * inertia;
}

function getMenuItemRelativePos(rad){
  let left = (_diameter / 2); //initial starting position
  left -= 2.8 * (Math.sin(rad) * (_diameter)); //magic number says how big is the circle
  left -= parseInt(inactiveMenuStyle.fontSize, 10) / 2;

  let top = (_diameter / 2); //initial starting position
  top -= 2.8 * (Math.cos(rad) * (_diameter));
  top -= parseInt(inactiveMenuStyle.fontSize, 10) / 2;
  return {
      left: left + 'px',
      top: top + 'px'
  };
}

//this is style applied to the place where actuall components can be drawn
let mapCanvasStyle = {
    position: 'relative',
    top: 0,
    minHeight: '500px',
    width: '98%',
    left: '2%',
    zIndex: 4
};

let mapCanvasHighlightStyle = {
  borderColor: "#00789b",
  boxShadow: "0 0 10px #00789b",
  border: '1px solid #00789b'
};

let componentForDeletionShadow = {
    boxShadow : "0 0 3px 3px red",
    opacity : "0.8"
};

let componentProposedShadow = {
    boxShadow : "0 0 3px 3px green",
    opacity : "0.8"
};

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
    getInertiaWidth,
    getMenuItemRelativePos,
    mapCanvasStyle,
    mapCanvasHighlightStyle,
    componentForDeletionShadow,
    componentProposedShadow
};
