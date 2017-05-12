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
import EditNodeDialog from './dialogs/edit-node-dialog';
import EditActionDialog from './dialogs/edit-action-dialog';
import NewGenericCommentDialog from './dialogs/create-new-comment-dialog';
import EditGenericCommentDialog from './dialogs/edit-comment-dialog';
import CreateNewSubmapDialog from './dialogs/create-new-submap-dialog';
import SubmapReferencesDialog from './dialogs/submap-references-dialog';
import ReferencesDialog from './dialogs/references-dialog';
import ChangeIntoSubmapDialog from './dialogs/change-into-submap-dialog';
var GetHelpDialog = require('./dialogs/get-help-dialog');
import {LinkContainer} from 'react-router-bootstrap';
import SingleMapActions from './single-map-actions';
import {calculateMapName} from '../map-list/map-name-calculator';
import Palette from './palette';
import CanvasStore from './canvas-store';
import CanvasWithBackground from './canvas-with-background';
import $ from 'jquery';
var Blob = require('blob');
/* globals document */
/* globals window */

export default class MapEditorPage extends React.Component {

  constructor(props) {
    super(props);
    this.prepareMapMenu = this.prepareMapMenu.bind(this);
    this.render = this.render.bind(this);
    this.openEditMapDialog = this.openEditMapDialog.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.download = this.download.bind(this);
    this.state = this.props.singleMapStore.getMap();
    this.canvasStore = new CanvasStore();
    this.closeHelpDialog = this.closeHelpDialog.bind(this);
    this.openHelpDialog = this.openHelpDialog.bind(this);
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

  download(maplink, tempName) {
    $.ajax({
      url: maplink,
      type: 'GET',
      xhrFields: {
        responseType: 'blob'
      },
      success: function(data, textStatus, jqxhr) {
        var file = new Blob([data], {"type": jqxhr.getResponseHeader("Content-Type")});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(file);
        link.download = tempName;
        link.click();
      }
    });
  }

  prepareMapMenu(){
    const workspaceID = this.props.singleMapStore.getWorkspaceId();
    const deduplicateHref = '/fixit/' + workspaceID;
    var mapID = this.props.singleMapStore.getMapId();

    var tempName = mapID + '.png';
    var downloadMapHref = '/img/' + tempName;

    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditMapDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit map info
      </NavItem>,
      <NavItem eventKey={2} key="2" href="#" download={tempName} onClick={this.download.bind(this, downloadMapHref, tempName)}>
        <Glyphicon glyph="download"></Glyphicon>&nbsp; Download
      </NavItem>,
      <LinkContainer to={{pathname: deduplicateHref}} key="3">
          <NavItem eventKey={2} href={deduplicateHref}>
              <Glyphicon glyph="plus" style={{color: "basil"}}></Glyphicon>
              &nbsp;Fix it!
          </NavItem>
      </LinkContainer>
    ];
  }

  closeHelpDialog() {
    this.setState({openHelpDialog: false});
  }

  openHelpDialog() {
    this.setState({openHelpDialog: true});
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
    const helpDialog = <GetHelpDialog open={this.state.openHelpDialog} close={this.closeHelpDialog}/>;
    const helpMenu = <NavItem eventKey={7} href="#" onClick={this.openHelpDialog} key="help">
      <Glyphicon glyph="education"></Glyphicon>Get help!
    </NavItem>;

    return (
      <DocumentTitle title={mapName}>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16}>
              <AtlasNavbarWithLogout
                auth={auth}
                history={history}
                mainMenu={mapMenu}
                rightMenu={[helpMenu]}/>
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
          <EditGenericCommentDialog singleMapStore={singleMapStore}/>
          <EditNodeDialog singleMapStore={singleMapStore}/>
          <EditActionDialog singleMapStore={singleMapStore}/>
          <SubmapReferencesDialog singleMapStore={singleMapStore}/>
          <ReferencesDialog singleMapStore={singleMapStore}/>
          <ChangeIntoSubmapDialog singleMapStore={singleMapStore}/>
          {helpDialog}
        </Grid>
      </DocumentTitle>
    );
  }
}
