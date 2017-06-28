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
  Glyphicon,
  NavDropdown,
  MenuItem
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import EditMapDialog from './dialogs/edit-map-dialog';
import CreateNewNodeDialog from './dialogs/create-new-node-dialog';
import EditNodeDialog from './dialogs/edit-node-dialog';
import EditActionDialog from './dialogs/edit-action-dialog';
import EditConnectionDialog from './dialogs/edit-connection-dialog';
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
import ToParentMap from './to-parent-map';
import $ from 'jquery';
var Blob = require('blob');
var jsPlumb = require("../../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
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
    this.prepareGoBackForSubmap = this.prepareGoBackForSubmap.bind(this);
    this.prepareVariantsSwitch = this.prepareVariantsSwitch.bind(this);
    this.state.diff = this.props.singleMapStore.getDiff();
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
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

  componentDidUpdate(oldProps, oldState){
    if(oldProps.singleMapStore.getMap().map._id !== this.props.singleMapStore.getMap().map._id){
      // map changed, pretend to remount
      oldProps.singleMapStore.removeChangeListener(this._onChange);
      oldProps.singleMapStore.io.emit('map', {
        type: 'sub',
        id: oldProps.singleMapStore.getMapId()
      });
      this.props.singleMapStore.addChangeListener(this._onChange);
      this.props.singleMapStore.io.emit('map', {
        type: 'sub',
        id: this.props.singleMapStore.getMapId()
      });
      this.setState(this.props.singleMapStore.getMap());
      this.setState({diff:this.props.singleMapStore.getDiff()});
      jsPlumb.reset();
    }
  }

  _onChange() {
    this.setState(this.props.singleMapStore.getMap());
    this.setState({diff:this.props.singleMapStore.getDiff()});
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

  prepareGoBackForSubmap(){
    var map = this.state.map;
    if(!map.isSubmap){
      return null;
    }
    return <ToParentMap map={map} />;

  }

  prepareVariantsSwitch(variants){
    if(!variants || !(variants.alternatives.length || variants.past || variants.futures.length )){
      return null;
    }
    let variantItems = [];
    if(variants.past){
      let name = variants.past.name;
      let href = '/map/' + variants.past.mapId;
      variantItems.push(<LinkContainer to={href}><MenuItem href={href}>{name} (past)</MenuItem></LinkContainer>);
      variantItems.push(<MenuItem divider />);
    }
    for(let i = 0; i < variants.alternatives.length; i++){
      let name = variants.alternatives[i].name;
      let href = '/map/' + variants.alternatives[i].mapId;
      variantItems.push(<LinkContainer to={href}><MenuItem href={href}>{name} (alternative)</MenuItem></LinkContainer>);
    }
    variantItems.push(<MenuItem divider />);
    for(let i = 0; i < variants.futures.length; i++){
      let name = variants.futures[i].name;
      let href = '/map/' + variants.futures[i].mapId;
      variantItems.push(<LinkContainer to={href}><MenuItem href={href}>{name} (future)</MenuItem></LinkContainer>);
    }
    return <NavDropdown eventKey="4" title="Related" id="nav-dropdown">
        {variantItems}
      </NavDropdown>;
  }

  prepareMapMenu(currentMap){
    const workspaceID = this.props.singleMapStore.getWorkspaceId();
    const variants = this.props.singleMapStore.getVariants();

    const deduplicateHref = '/fixit/' + workspaceID + '/variant/' + (currentMap ? currentMap.timesliceId : null);
    var mapID = this.props.singleMapStore.getMapId();

    var tempName = mapID + '.png';
    var downloadMapHref = '/img/' + tempName;

    const goBack = this.prepareGoBackForSubmap();
    const variantSwitch = this.prepareVariantsSwitch(variants);

    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditMapDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit map info
      </NavItem>,
      <NavItem eventKey={2} key="2" href="#" download={tempName} onClick={this.download.bind(this, downloadMapHref, tempName)}>
        <Glyphicon glyph="download"></Glyphicon>&nbsp; Download
      </NavItem>,
      goBack,
      <LinkContainer to={{pathname: deduplicateHref}} key="3">
          <NavItem eventKey={2} href={deduplicateHref}>
              <Glyphicon glyph="plus" style={{color: "basil"}}></Glyphicon>
              &nbsp;Fix it!
          </NavItem>
      </LinkContainer>,
      <NavItem eventKey={5} href="#" key="5" onClick={this.toggleDiff.bind(this)}>
          <Glyphicon glyph="tags" style={{color: "basil"}}></Glyphicon>
          &nbsp;Diff
      </NavItem>,
      variantSwitch
    ];
  }

  toggleDiff(){
    this.canvasStore.toggleDiff();
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

    const nameAndPurpose = singleMapStore.getWorkspaceNameAndPurpose();
    const workspaceID = singleMapStore.getWorkspaceId();
    const workspaceName = nameAndPurpose ? nameAndPurpose.name + ' - ' + nameAndPurpose.purpose : workspaceID;

    const mapName = calculateMapName('wait...', this.state.map.user, this.state.map.purpose, this.state.map.name);
    const mapID = singleMapStore.getMapId();
    const nodes = singleMapStore.getMap().map.nodes;
    const variantId = singleMapStore.getMap().map.timesliceId;
    const diff = this.state.diff;
    const connections = singleMapStore.getMap().map.connections;
    const comments = singleMapStore.getMap().map.comments;

    const canvasStore = this.canvasStore;
    const mapMenu = this.prepareMapMenu(this.state.map);

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
                  variantId={variantId}
                  canvasStore={canvasStore}
                  diff={diff}/>
            </Col>
          </Row>
          <EditMapDialog singleMapStore={singleMapStore}/>
          <CreateNewNodeDialog singleMapStore={singleMapStore}/>
          <NewGenericCommentDialog singleMapStore={singleMapStore}/>
          <CreateNewSubmapDialog singleMapStore={singleMapStore}/>
          <EditGenericCommentDialog singleMapStore={singleMapStore}/>
          <EditNodeDialog singleMapStore={singleMapStore}/>
          <EditActionDialog singleMapStore={singleMapStore}/>
          <EditConnectionDialog singleMapStore={singleMapStore}/>
          <SubmapReferencesDialog singleMapStore={singleMapStore}/>
          <ReferencesDialog singleMapStore={singleMapStore}/>
          <ChangeIntoSubmapDialog singleMapStore={singleMapStore}/>
          {helpDialog}
        </Grid>
      </DocumentTitle>
    );
  }
}
