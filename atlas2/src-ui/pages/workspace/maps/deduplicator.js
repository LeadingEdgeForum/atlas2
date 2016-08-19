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
  Popover, OverlayTrigger
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
  verticalAlign: "middle",
  margin : "1px"
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
    this.setState(WorkspaceStore.getAvailableComponents(this.props.params.workspaceID));
    this.setState(WorkspaceStore.getAvailableCategories(this.props.params.workspaceID));
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
  handleDrop(category, e) {
    // console.log('drop', e);
    e.stopPropagation();
    var item = JSON.parse(e.dataTransfer.getData('json'));
    dragStarted = false;
    if(!category.nodes){
      category.nodes = [];
    }
    category.nodes.push(item);
    // Actions.deduplicatorUnassignedComponentDragStarted();
    this.forceUpdate();
  }
  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'copy';
  }
  renderNodeInACategory(node) {
    var style = getStyleForType(node.type);
    style.left = node.x * 100 +  '%';
    style.position = 'absolute';
    style.top = "10px";

    var _popover = (<Popover id={node.name} title="Component details"><span>Name: {node.name}</span></Popover>);
//
    return (<OverlayTrigger trigger="click" placement="bottom" overlay={_popover}>
      <div style={style}></div>
    </OverlayTrigger>);
  }
  renderCategory(category){
    var itemsInACategory = category.nodes;
    var _itemsToDisplay = null;
    if(itemsInACategory){
      _itemsToDisplay = itemsInACategory.map(node => this.renderNodeInACategory(node));
    }
    var acceptorStyleToSet = _.clone(acceptorStyle);
    if (dragStarted) {
      acceptorStyleToSet = _.extend(acceptorStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b'
      });
    }

    return <div key={category.description} style={acceptorStyleToSet} onDrop={this.handleDrop.bind(this, category)} onDragOver={this.handleDragOver.bind(this)}>
      <Col xs={3}>{category.description}</Col>
      <Col xs={6}>
        <div style={{textAlign:"center"}}>
          {_itemsToDisplay}
        </div>
      </Col>
    </div>;
  }

  render() {
    var acceptorStyleToSet = _.clone(acceptorStyle);
    if (dragStarted) {
      acceptorStyleToSet = _.extend(acceptorStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b'
      });
    }


    var _toDisplayComponents = null;
    if (this.state.components) {
      _toDisplayComponents = this.state.components.map(node => <div data-item={node} draggable="true" style={draggableComponentStyle} onDragEnd={this.handleDragStop.bind(this, node)} onDragStart={this.handleDragStart.bind(this, node)}>
        <div style={getStyleForType(node.type)}></div>
        {node.name}
      </div>);
    }

    var _categoriesToShow = null;
    if(this.state.categories){
      _categoriesToShow = this.state.categories.map(category => this.renderCategory(category));
    }
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={3}>
            <h4>Your list of components in the workspace:</h4>
            {_toDisplayComponents}
          </Col>
          <Col xs={9}>
            <h4>Categories</h4>
            {_categoriesToShow}
            <div style={acceptorStyleToSet} onDrop={this.handleDrop.bind(this)} onDragOver={this.handleDragOver.bind(this)}>Nothing duplicates this component</div>
          </Col>
        </Row>
      </Grid>
    );
  }
}
