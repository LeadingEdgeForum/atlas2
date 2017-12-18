/*jshint esversion: 6 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Row,
  Col,
  Button
} from 'react-bootstrap';
import SingleMapActions from './single-map-actions';
import CanvasActions from './canvas-actions';
import Constants from '../constants';
import {
  userStyle,
  userNeedStyle,
  externalStyle,
  internalStyle,
  submapStyle,
  genericCommentPalletteStyle
} from './component-styles';
import _ from 'underscore';

var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;


var makeDraggable = function(type, mapID, canvasStore, input) {
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  var d = jsPlumb.draggable(input, {
    clone: 'true',
    ignoreZoom: true,
    grid: [
      '10', '10'
    ],
    start: function(params) {
      CanvasActions.highlightCanvas(true);
    },
    drag: function(params) {},
    stop: function(params) {
      CanvasActions.highlightCanvas(false);
      var coords = canvasStore.normalizeComponentCoord(params);
      if(type === Constants.SUBMAP){
        SingleMapActions.openAddSubmapDialog(coords, type);
      } else if (type === Constants.GENERIC_COMMENT){
        SingleMapActions.openAddCommentDialog(coords, type);
      } else if (type === Constants.USER){
        SingleMapActions.openAddNewUserDialog(coords, type);
      } else {
        SingleMapActions.openAddNodeDialog(coords, type);
      }
    }
  });
};

var buttonStyle = {
  position: 'relative',
  padding: 0
};

var HigherMargins = {
  marginBottom: '6px',
  marginTop: '6px'
};

export default class Palette extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    var mapID = this.props.mapID;
    var canvasStore = this.props.canvasStore;
    var userStyleWithLimitedSize = _.clone(userStyle);
    userStyleWithLimitedSize.height = 20;
    userStyleWithLimitedSize.width = 10;
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12}>
            <h6>Components</h6>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.USER, mapID, canvasStore)} style={HigherMargins}>
                <div style={userStyleWithLimitedSize}></div>&nbsp;User
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.USERNEED,mapID,canvasStore)} style={HigherMargins}>
                <div style={userNeedStyle}></div>&nbsp;User need
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.INTERNAL,mapID, canvasStore)} style={HigherMargins}>
                <div style={internalStyle}></div>&nbsp;Internal
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.EXTERNAL,mapID, canvasStore)} style={HigherMargins}>
                <div style={externalStyle}></div>&nbsp;External
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.SUBMAP, mapID, canvasStore)} style={HigherMargins}>
                <div style={submapStyle}></div>&nbsp;Submap
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.GENERIC_COMMENT, mapID, canvasStore)} style={HigherMargins}>
                <div style={genericCommentPalletteStyle}></div>&nbsp;Comment
              </div>
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}
