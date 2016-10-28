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
import {userNeedStyle, externalStyle, internalStyle} from './component-styles';

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

var makeDraggable = function(type, input) {
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
      Actions.palletteDragStopped(type, params);
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
              <div ref={makeDraggable.bind(this, Constants.USERNEED)} style={HigherMargins}>
                <div style={userNeedStyle}></div>&nbsp;User need
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.INTERNAL)} style={HigherMargins}>
                <div style={internalStyle}></div>&nbsp;Internal
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>
              <div ref={makeDraggable.bind(this, Constants.EXTERNAL)} style={HigherMargins}>
                <div style={externalStyle}></div>&nbsp;External
              </div>
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}
