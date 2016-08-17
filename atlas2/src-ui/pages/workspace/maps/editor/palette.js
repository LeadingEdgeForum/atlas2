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
var _ = require('underscore');

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

var mapComponentStyle = {
  minHeight: 20,
  minWidth: 20,
  maxWidth: 20,
  maxHeight: 20,
  borderRadius: 10,
  zIndex: 2,
  border: '3px solid black',
  backgroundColor: 'silver',
  float: 'left'

};

var makeDraggable = function(input) {
  console.log('input', input);
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  console.log('calling draggable', jsPlumb.draggable);
  var d = jsPlumb.draggable(input, {
    clone: 'true',
    ignoreZoom: true,
    grid: [
      '100', '100'
    ],
    start: function(params) {
      Actions.palletteDragStarted();
    },
    drag: function(params) {
      // if (params.screenX > 500) {
      //   return false;
      // }
      // console.log('drag', params);
    },
    stop: function(params) {
      Actions.palletteDragStopped(params);
      console.log(params);
    }
  });
  console.log(d);
};

var buttonStyle = {
  position: 'relative'
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
              <div ref={makeDraggable}>
                <div style={mapComponentStyle}></div>&nbsp;User need
              </div>
            </Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>&nbsp;Internal</Button>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12}>
            <Button href="#" style={buttonStyle} bsStyle={null}>&nbsp;External</Button>
          </Col>
        </Row>
      </Grid>
    );
  }
}
