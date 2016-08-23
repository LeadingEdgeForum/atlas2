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
import $ from 'jquery';
import Actions from '../../../../actions';
var MapComponent = require('./map-component');

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
    this.state = WorkspaceStore.getCanvasState();
    this.handleResize = this.handleResize.bind(this);
    this.setConainer = this.setContainer.bind(this);
  }

  setContainer(input) {
    this.input = input;
    if (input === null) {
      //noop - component was destroyed, no need to worry about draggable
      return;
    }
    jsPlumb.setContainer(input);
  }

  handleResize() {
    if (!this.input) {
      return;
    }
    var coord = {
      offset: {
        top: $(this.input).offset().top,
        left: $(this.input).offset().left
      },
      size: {
        width: $(this.input).width(),
        height: $(this.input).height()
      }
    };
    Actions.canvasResized(coord);
    //repaint (if necessary)
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
    window.removeEventListener('resize', this.handleResize);
  }

  _onChange() {
    this.setState(WorkspaceStore.getCanvasState());
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
    var size = {
      width: 0,
      height: 0
    };
    if (this.state.coords && this.state.coords.size) {
      size = this.state.coords.size;
    }
    var components = null;
    var focusedNodeID = this.state.focusedNodeID;
    var mapID = this.props.mapID;
    if (this.props.nodes) {
      components = this.props.nodes.map(function(component) {
        var focused = focusedNodeID === component._id;
        return <MapComponent mapID={mapID} node={component} size={size} key={component._id} id={component._id} focused={focused}/>;
      });
    }
    return (
      <div style={style} ref={input => this.setContainer(input)}>
        {components}
      </div>
    );
  }
}
