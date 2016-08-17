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
var _ = require('underscore');

//one day - make it proper require, but JsPlumb 2.2.0 must be released
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */

var mapCanvasStyle = { //this is style applied to the place where actuall components can be drawn
  position: 'relative',
  top: 0,
  height: '98%',
  width: '98%',
  left: '2%',
  zIndex: 4
  // backgroundColor: 'silver',
  // backgroundImage: 'transparent url(1x1_transparent.png) repeat center top'
};

var setContainer = function(input) {
  if (input === null) {
    //noop - component was destroyed, no need to worry about draggable
    return;
  }
  jsPlumb.setContainer(input);
};

export default class MapCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getCanvasHighlight();
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    console.log(WorkspaceStore.getCanvasHighlight());
    this.setState(WorkspaceStore.getCanvasHighlight());
  }

  render() {
    var style = _.clone(mapCanvasStyle);
    if (this.state.highlight) {
      style = _.extend(style, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b'
      });
    }
    return (
      <div style={style} ref={input => setContainer(input)}></div>
    );
  }
}
