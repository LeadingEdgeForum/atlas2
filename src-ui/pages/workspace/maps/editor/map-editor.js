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
  Breadcrumb
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import Palette from './palette';
import CanvasWithBackground from './canvas-with-background';
import CreateNewNodeDialog from './create-new-node-dialog';
import CreateNewSubmapDialog from './create-new-submap-dialog';
import SubmapReferencesDialog from './submap-references-dialog';
import ReferencesDialog from './references-dialog';
import EditNodeDialog from './edit-node-dialog';
import NewGenericCommentDialog from './create-new-comment-dialog';
import EditGenericCommentDialog from './edit-comment-dialog';
import EditActionDialog from './edit-action-dialog';
var _ = require('underscore');
var EditMapDialog = require('./../edit-map-dialog');
import {calculateMapName} from './../map-name-calculator';
import CanvasStore from './canvas-store';

export default class MapEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getMapInfo(props.params.mapID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    var _this = this;
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    WorkspaceStore.io.emit('map', {
      type: 'sub',
      id: _this.props.params.mapID
    });
  }

  componentWillUnmount() {
    var _this = this;
    WorkspaceStore.io.emit('map', {
      type: 'unsub',
      id: _this.props.params.mapID
    });
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
    this.setState(WorkspaceStore.getWorkspaceInfo(this.state.map.workspace));
  }

  render() {
    var nodes = this.state.map.nodes;
    var comments = this.state.map.comments;
    var name = this.state.workspace
      ? this.state.workspace.name
      : "no name";
    var purpose = this.state.workspace
      ? this.state.workspace.purpose
      : "no purpose";
    var workspaceID = this.state.map.workspace || "";
    var mapName = calculateMapName("I like being lost.", this.state.map.user, this.state.map.purpose, this.state.map.name);
    return (
      <Grid fluid={true}>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={"/workspace/" + workspaceID}>
            {name}
            - {purpose}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {mapName}
          </Breadcrumb.Item>
        </Breadcrumb>
        <Row className="show-grid">
          <Col xs={3} sm={2} md={2} lg={1}>
            <Palette mapID={this.props.params.mapID}></Palette>
          </Col>
          <Col xs={9} sm={10} md={10} lg={11}>
              <CanvasWithBackground nodes={nodes} comments={comments} mapID={this.props.params.mapID} workspaceID={workspaceID} canvasStore={CanvasStore}></CanvasWithBackground>
          </Col>
        </Row>
        <EditMapDialog workspaceID={workspaceID}/>
        <CreateNewNodeDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
        <CreateNewSubmapDialog workspaceID={workspaceID}/>
        <EditNodeDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
        <NewGenericCommentDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
        <EditGenericCommentDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
        <EditActionDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
        <SubmapReferencesDialog/>
        <ReferencesDialog/>
      </Grid>
    );
  }
}
