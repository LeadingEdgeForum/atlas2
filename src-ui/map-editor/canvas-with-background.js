/*jshint esversion: 6 */
// import React 'react');
var React = require('react');
var PropTypes = React.PropTypes;
var MapCanvas  = require('./canvas').default;
var calculateMapName = require('../map-list/map-name-calculator').calculateMapName;
var _ = require('underscore');

var outerStyle = { //this is style applied to the entire map area (without palette)
  width: 'auto',
  left: 0,
  right: 0,
  // height: '100%',
  minHeight: '500px',
  float: 'left',
  position: 'absolute',
  minWidth: '800px'
};

var axisSupport = {
  position: 'absolute',
  borderWidth: 1,
  top: '3%',
  bottom: '2%',
  border: '1px dashed silver',
  zIndex: '1'

};

//TODO: align this properly (relative to the canvas)
var axisSupport1 = _.extend(_.clone(axisSupport), {left: '25.5%'});
var axisSupport2 = _.extend(_.clone(axisSupport), {left: '51%'});
var axisSupport3 = _.extend(_.clone(axisSupport), {left: '76.5%'});

var axisX = {
  position: 'absolute',
  bottom: '2%',
  height: 1,
  left: '2%',
  right: '2%',
  border: '1px solid gray',
  marginRight: 0,
  marginLeft: 0,
  zIndex: 2,
  backgroundColor : 'gray'
};

var arrowX = {
  position: 'absolute',
  width: 0,
  height: 0,
  borderTop: '4px solid transparent',
  borderBottom: '2px solid transparent',
  borderLeft: '10px solid gray',
  right: '2%',
  bottom: '2%',
  zIndex: 2
};

var axisY = {
  position: 'absolute',
  width: 1,
  borderWidth: 1,
  top: '2%',
  bottom: '2%',
  left: '2%',
  border: '1px solid gray',
  zIndex: 2,
  backgroundColor :'gray'
};

var arrowY = {
  position: 'absolute',
  width: 0,
  height: 0,
  left: '2%',
  top: '2%',
  borderLeft: '2px solid transparent',
  borderRight: '4px solid transparent',
  borderBottom: '10px solid gray',
  zIndex: 2
};

var valueCaption = {
  position: 'absolute',
  zIndex: 3,
  fontSize: 'smaller',
  top: '3%',
  left: '3%'
};

var evolutionCaption = {
  position: 'absolute',
  zIndex: 3,
  fontSize: 'smaller',
  bottom: '3%',
  right: '3%'
};

var genesisStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '5%'
};
var customBuiltStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '31%'
};
var productStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '57%'
};
var commodityStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '81%'
};

export default class CanvasWithBackground extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var users = this.props.users;
    var nodes = this.props.nodes;
    var comments = this.props.comments;
    var workspaceID = this.props.workspaceID;
    var mapID = this.props.mapID;
    let variantId = this.props.variantId;
    var background = this.props.background;
    let diff = this.props.diff;
    if(background){
      outerStyle.backgroundColor = 'white';
      outerStyle.marginTop= '-7px';
    }
    var canvasStore = this.props.canvasStore;
    return (
            <div style={outerStyle}>
              <MapCanvas
                  users={users}
                  nodes={nodes}
                  comments={comments}
                  mapID={mapID}
                  workspaceID={workspaceID}
                  variantId={variantId}
                  background={background}
                  canvasStore={canvasStore}
                  diff={diff}>
              </MapCanvas>
              <div>
                <div style={axisX}>
                  <div style={genesisStyle}>Genesis</div>
                  <div style={customBuiltStyle}>Custom Built</div>
                  <div style={productStyle}>Product or Rental</div>
                  <div style={commodityStyle}>Commodity/Utility</div>
                </div>
                <div style={arrowX}/>
                <div style={valueCaption}>Visibility</div>
                <div style={axisY}/>
                <div style={arrowY}/>
                <div style={evolutionCaption}>Evolution</div>
                <div style={axisSupport1}/>
                <div style={axisSupport2}/>
                <div style={axisSupport3}/>
              </div>
            </div>
    );
  }
}
