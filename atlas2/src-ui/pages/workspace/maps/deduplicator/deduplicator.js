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
  ListGroup,
  Popover,
  OverlayTrigger,
  Breadcrumb
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import {getStyleForType} from './../editor/component-styles';
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
import _ from "underscore";
import CapabilitiesView from './capabilities-view';

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

  getAvailableComponents() {
    var _components = [];

    if (this.state.workspace && this.state.workspace.maps && Array.isArray(this.state.workspace.maps)) {
      this.state.workspace.maps.map(_map => {
        _map.nodes.map(_node => {
          _components.push({
            _id: _node._id,
            name: _node.name,
            type: _node.type,
            mapID: _map._id,
            mapName: _map.name,
            x: _node.x,
            y: _node.y,
            category: _node.category,
            categorized: _node.categorized,
            referencedNodes: _node.referencedNodes
          });
        });
      });
    }
    return _components;
  }

  renderComponentToDrag(node) {
    var linkToMap = "/map/" + node.mapID;
    var _popover = (
      <Popover id={node.name} title="Component details">
        <p>Name: {node.name}</p>
        <p>Map:
          <a href={linkToMap}>{node.mapName}</a>
        </p>
      </Popover>
    );
    return <OverlayTrigger trigger="click" placement="bottom" overlay={_popover}>
      <div data-item={node} draggable="true" style={draggableComponentStyle} onDragEnd={this.handleDragStop.bind(this, node)} onDragStart={this.handleDragStart.bind(this, node)}>
        <div style={getStyleForType(node.type)}></div>
        {node.name}
      </div>
    </OverlayTrigger>;
  }

  render() {
    var components = this.getAvailableComponents();

    var uncategorizedComponents = [];
    var categorizedComponents = [];
    var _toDisplayComponents = null;

    if (components) {
      for (var i = 0; i < components.length; i++) {
        var c = components[i];
        if (c.categorized) {
          categorizedComponents.push(c);
        } else {
          uncategorizedComponents.push(c);
        }
      }

      _toDisplayComponents = uncategorizedComponents.map(node => this.renderComponentToDrag(node));
    }
    var workspace = this.state.workspace;

    var name = this.state.workspace ? this.state.workspace.name : "no name";
    var purpose = this.state.workspace ? this.state.workspace.purpose : "no purpose";

    if (_toDisplayComponents && _toDisplayComponents.length > 0) {
      return (
        <Grid fluid={true}>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={"/workspace/"+workspace._id}>
            {name} - {purpose}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            Removing duplicates
          </Breadcrumb.Item>
        </Breadcrumb>
          <Row className="show-grid">
            <Col xs={3}>
              <h4>Unprocessed components:</h4>
              {_toDisplayComponents}
            </Col>
            <Col xs={9}>
              <CapabilitiesView dragStarted={dragStarted} workspace={workspace} categorizedComponents={categorizedComponents}/>
            </Col>
          </Row>
        </Grid>
      );
    } else {
      return (
        <Grid fluid={true}>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={"/workspace/"+workspace._id}>
            {name} - {purpose}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            Removing duplicates
          </Breadcrumb.Item>
        </Breadcrumb>
          <Row className="show-grid">
            <Col xs={12}>
              <CapabilitiesView dragStarted={dragStarted} workspace={workspace} categorizedComponents={categorizedComponents}/>
            </Col>
          </Row>
        </Grid>
      );
    }

  }
}
