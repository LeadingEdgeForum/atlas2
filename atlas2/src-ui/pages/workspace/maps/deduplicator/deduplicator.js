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
import DeduplicatorStore from './deduplicator-store';
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
    this.store = new DeduplicatorStore(props.params.workspaceID);
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    this.store.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
    this.store.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
    this.setState(this.store.getAvailableComponents());
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

  // getAvailableComponents() {
  //   var _components = [];
  //
  //   if (this.state.workspace && this.state.workspace.maps && Array.isArray(this.state.workspace.maps)) {
  //     this.state.workspace.maps.map(_map => {
  //       _map.nodes.map(_node => {
  //         if(_node.type !== 'SUBMAP'){ //submaps cannot be duplicated as they are just references. duplication should be discovered on the level of submap map!
  //             _components.push({
  //               _id: _node._id,
  //               name: _node.name,
  //               type: _node.type,
  //               mapID: _map._id,
  //               mapName: _map.name,
  //               x: _node.x,
  //               y: _node.y,
  //               category: _node.category,
  //               categorized: _node.categorized,
  //               referencedNodes: _node.referencedNodes
  //             });
  //         }
  //       });
  //     });
  //   }
  //   return _components;
  // }
  //
  renderAvailableComponents(map) {
    var nodes = [];
    var linkToMap = "/map/" + map.mapID;
    nodes = map.nodes.map(node =>
      (<div data-item={node} draggable="true" style={draggableComponentStyle} onDragEnd={this.handleDragStop.bind(this, node)} onDragStart={this.handleDragStart.bind(this, node)}>
        <div style={getStyleForType(node.type)}></div>
            {node.name}
         </div>
      ));
    //     <div style={getStyleForType(node.type)}></div>
    //     {node.name}
    //   </div>);
    // var _popover = (
    //   <Popover id={node.name} title="Component details">
    //     <p>Name: {node.name}</p>
    //     <p>Map:
    //       <a href={linkToMap}>{node.mapName}</a>
    //     </p>
    //   </Popover>
    // );
    // return <OverlayTrigger trigger="click" placement="bottom" overlay={_popover}>
    //   <div data-item={node} draggable="true" style={draggableComponentStyle} onDragEnd={this.handleDragStop.bind(this, node)} onDragStart={this.handleDragStart.bind(this, node)}>
    //     <div style={getStyleForType(node.type)}></div>
    //     {node.name}
    //   </div>
    // </OverlayTrigger>;
    return (<div><a href={linkToMap}><h5>{map.user}{map.purpose}{map.name}</h5></a>{nodes}</div>);
  }

  render() {

    var unprocessedComponents = this.store.getAvailableComponents();

    var processedComponents = [];

    var _toDisplayComponents = unprocessedComponents.map(map => this.renderAvailableComponents(map));

    var categorizedComponents=[];

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
              <h4>Components to check:</h4>
              {_toDisplayComponents}
            </Col>
            <Col xs={9}>
              <h4>Capabilities:</h4>
              // <CapabilitiesView dragStarted={dragStarted} workspace={workspace} categorizedComponents={categorizedComponents}/>
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
              // <CapabilitiesView dragStarted={dragStarted} workspace={workspace} categorizedComponents={categorizedComponents}/>
            </Col>
          </Row>
        </Grid>
      );
    }

  }
}
