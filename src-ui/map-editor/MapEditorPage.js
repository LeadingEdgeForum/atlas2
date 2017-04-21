/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Breadcrumb,
  NavItem,
  Glyphicon
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import EditMapDialog from './dialogs/edit-map-dialog';
import CreateNewNodeDialog from './dialogs/create-new-node-dialog';
import NewGenericCommentDialog from './dialogs/create-new-comment-dialog';
import CreateNewSubmapDialog from './dialogs/create-new-submap-dialog';
import {LinkContainer} from 'react-router-bootstrap';
import SingleMapActions from './single-map-actions';
import {calculateMapName} from '../map-list/map-name-calculator';
import Palette from './palette';
import CanvasStore from './canvas-store';
import CanvasWithBackground from './canvas-with-background';

export default class MapEditorPage extends React.Component {

  constructor(props) {
    super(props);
    this.prepareMapMenu = this.prepareMapMenu.bind(this);
    this.render = this.render.bind(this);
    this.openEditMapDialog = this.openEditMapDialog.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.state = this.props.singleMapStore.getMap();
    this.canvasStore = new CanvasStore();
  }

  componentDidMount() {
    this.props.singleMapStore.addChangeListener(this._onChange);
    this.props.singleMapStore.io.emit('map', {
      type: 'sub',
      id: this.props.singleMapStore.getMapId()
    });
  }

  componentWillUnmount() {
    this.props.singleMapStore.removeChangeListener(this._onChange);
    this.props.singleMapStore.io.emit('map', {
      type: 'unsub',
      id: this.props.singleMapStore.getMapId()
    });
  }

  _onChange() {
    this.setState(this.props.singleMapStore.getMap());
  }

  openEditMapDialog() {
    SingleMapActions.openEditMapDialog();
  }

  prepareMapMenu(){
    const workspaceID = this.props.singleMapStore.getWorkspaceId();
    const deduplicateHref = '/deduplicate/' + workspaceID;
    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditMapDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit map info
      </NavItem>,
      <LinkContainer to={{pathname: deduplicateHref}} key="2">
          <NavItem eventKey={2} href={deduplicateHref} key="2">
              <Glyphicon glyph="pawn"></Glyphicon>
              <Glyphicon glyph="pawn" style={{color: "silver"}}></Glyphicon>
              &nbsp;Deduplicate
          </NavItem>
      </LinkContainer>
    ];
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const singleMapStore = this.props.singleMapStore;
    const mapMenu = this.prepareMapMenu();

    const nameAndPurpose = singleMapStore.getWorkspaceNameAndPurpose();
    const workspaceID = singleMapStore.getWorkspaceId();
    const workspaceName = nameAndPurpose ? nameAndPurpose.name + ' - ' + nameAndPurpose.purpose : workspaceID;

    const mapName = calculateMapName('wait...', this.state.map.user, this.state.map.purpose, this.state.map.name);
    const mapID = singleMapStore.getMapId();
    const nodes = singleMapStore.getMap().map.nodes;
    const connections = singleMapStore.getMap().map.connections;
    const comments = singleMapStore.getMap().map.comments;

    const canvasStore = this.canvasStore;

    return (
      <DocumentTitle title={mapName}>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16}>
              <AtlasNavbarWithLogout
                auth={auth}
                history={history}
                mainMenu={mapMenu}/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Breadcrumb>
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item href={"/workspace/" + workspaceID}>
                {workspaceName}
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                {mapName}
              </Breadcrumb.Item>
            </Breadcrumb>
          </Row>
          <Row className="show-grid">
            <Col xs={3} sm={2} md={2} lg={1}>
                <Palette mapID={mapID} canvasStore={canvasStore}/>
            </Col>
            <Col xs={9} sm={10} md={10} lg={11}>
                <CanvasWithBackground
                  nodes={nodes}
                  comments={comments}
                  mapID={mapID}
                  workspaceID={workspaceID}
                  canvasStore={canvasStore} />
            </Col>
          </Row>
          <EditMapDialog singleMapStore={singleMapStore}/>
          <CreateNewNodeDialog singleMapStore={singleMapStore}/>
          <NewGenericCommentDialog singleMapStore={singleMapStore}/>
          <CreateNewSubmapDialog singleMapStore={singleMapStore}/>
          {/*
          <EditNodeDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
          <EditGenericCommentDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
          <EditActionDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
          <SubmapReferencesDialog/>
          <ReferencesDialog/>*/}
        </Grid>
      </DocumentTitle>
    );
  }
}
