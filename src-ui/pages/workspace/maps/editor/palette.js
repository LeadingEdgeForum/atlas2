/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import Actions from '../../../../actions';
import CanvasActions from './canvas-actions';
import Constants from '../../../../constants';
var _ = require('underscore');
import {userNeedStyle, externalStyle, internalStyle, submapStyle, genericCommentPalletteStyle} from './component-styles';

var jsPlumb = require("../../../../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;

var makeDraggable = function(type, mapID, input) {
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  var d = jsPlumb.draggable(input, {
    clone: 'true',
    ignoreZoom: true,
    grid: [
      '100', '100'
    ],
    start: function(params) {
      CanvasActions.highlightCanvas(true);
    },
    drag: function(params) {},
    stop: function(params) {
      Actions.palletteDragStopped(type, mapID , params);
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
              <div ref={makeDraggable.bind(this, Constants.USERNEED,mapID)} style={HigherMargins}>
                <div style={userNeedStyle}></div>&nbsp;User need
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.INTERNAL,mapID)} style={HigherMargins}>
                <div style={internalStyle}></div>&nbsp;Internal
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.EXTERNAL,mapID)} style={HigherMargins}>
                <div style={externalStyle}></div>&nbsp;External
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.SUBMAP, mapID)} style={HigherMargins}>
                <div style={submapStyle}></div>&nbsp;Submap
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.GENERIC_COMMENT, mapID)} style={HigherMargins}>
                <div style={genericCommentPalletteStyle}></div>&nbsp;Comment
              </div>
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}
