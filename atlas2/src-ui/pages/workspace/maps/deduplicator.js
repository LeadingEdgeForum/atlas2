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
import WorkspaceStore from '../workspace-store';
import MapListElement from './map-list-element.js';
import MapListElementNew from './map-list-element-new.js';
var CreateNewMapDialog = require('./create-new-map-dialog');
import {getStyleForType} from './editor/component-styles';
var Constants = require('./../../../constants');
import Actions from './../../../actions.js';
import _ from "underscore";

var draggableComponentStyle = {
  borderWidth: '1px',
  borderColor: 'silver',
  borderStyle: 'solid',
  minHeight: '14px',
  margin: '10px',
  display: 'inline-block',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '5px'
};

var acceptorStyle = {
  width: "100%",
  height: "35px",
  lineHeight: "35px",
  border: "1px dashed black",
  textAlign: "center",
  verticalAlign: "middle"
};

var dragStarted = false;

export default class Deduplicator extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
  }

  handleDragStart(node, e) {
    var target = e.target;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('json', JSON.stringify(node));
    dragStarted = true;
    // Actions.deduplicatorUnassignedComponentDragStarted();
    this.forceUpdate();
  }
  handleDragStop(node, e) {
    dragStarted = false;
    this.forceUpdate();
  }
  handleDrop(e) {
    // console.log('drop', e);
    e.stopPropagation();
    var item = JSON.parse(e.dataTransfer.getData('json'));
    console.log('item', item);
    dragStarted = false;
    // Actions.deduplicatorUnassignedComponentDragStarted();
    this.forceUpdate();
  }
  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'copy';
  }
  render() {
    var _components = [];
    var workspaceID = this.props.params.workspaceID;
    if (this.state && this.state.workspace && this.state.workspace.maps && Array.isArray(this.state.workspace.maps)) {
      this.state.workspace.maps.map(item => {
        _components = _components.concat(item.nodes);
      });
    }
    var acceptorStyleToSet = _.clone(acceptorStyle);
    if (dragStarted) {
      acceptorStyleToSet = _.extend(acceptorStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b'
      });
    }
    var _toDisplayComponents = _components.map(node => <div data-item={node} draggable="true" style={draggableComponentStyle} onDragEnd={this.handleDragStop.bind(this, node)} onDragStart={this.handleDragStart.bind(this, node)}>
      <div style={getStyleForType(node.type)}></div>
      {node.name}
    </div>);
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={3}>
            <h4>Your list of components in the workspace:</h4>
            {_toDisplayComponents}
          </Col>
          <Col xs={9}>
            <h4>Categories</h4>
            <div style={acceptorStyleToSet} onDrop={this.handleDrop.bind(this)} onDragOver={this.handleDragOver.bind(this)}>Nothing duplicates this component</div>
          </Col>
        </Row>
      </Grid>
    );
  }
}
