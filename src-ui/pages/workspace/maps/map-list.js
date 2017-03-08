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
import WorkspaceStore from '../workspace-store';
import Actions from './../../../actions.js';
import MapListElement from './map-list-element.js';
import MapListElementNew from './map-list-element-new.js';
var CreateNewMapDialog = require('./create-new-map-dialog');
var EditWorkspaceDialog = require('./../edit-workspace-dialog');
var InviteNewUserDialog = require('./invite-new-user-dialog');

export default class MapList extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    var _this = this;
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    WorkspaceStore.io.emit('workspace', {
      type: 'sub',
      id: _this.props.params.workspaceID
    });
  }

  componentWillUnmount() {
    var _this = this;
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
    WorkspaceStore.io.emit('workspace', {
      type: 'unsub',
      id: _this.props.params.workspaceID
    });
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
  }

  render() {
    var _mapsToShow = [];
    var workspaceID = this.props.params.workspaceID;
    var purpose = "";
    var name = null;
    var editors = [];
    if (this.state && this.state.workspace && this.state.workspace.maps && Array.isArray(this.state.workspace.maps)) {
      _mapsToShow = this.state.workspace.maps.map(item => <MapListElement workspaceID={workspaceID} key={item._id} id={item._id} user={item.user} purpose={item.purpose} name={item.name} isSubmap={item.isSubmap}></MapListElement>);
      purpose = this.state.workspace.purpose;
      name = this.state.workspace.name;
      if (this.state.workspace.owner) {
          editors = this.state.workspace.owner.map(owner => < li className = "list-group-item" key={owner}> {owner}
          <Button bsSize="xsmall" onClick={Actions.deleteUser.bind(Actions,{workspaceID:workspaceID, email:owner})}> X </Button>
          </li>);
          }
    } else {
      return (
        <p>Something went really wrong :-(</p>
      );
    }

    return (
      <Grid fluid={true}>
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href={"/workspace/"+workspaceID} active>
          {name} - {purpose}
        </Breadcrumb.Item>
      </Breadcrumb>
        <Row className="show-grid">
        <Col xs={9} sm={9} md={9} lg={7} lgOffset={1}>
            <h4>Your maps</h4>
          </Col>
          <Col xs={3} sm={3} md={3} lg={2}>
            <h4>Editors:</h4>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={9} sm={9} md={9} lg={7} lgOffset={1}>
            <ListGroup>
              {_mapsToShow}
              <MapListElementNew></MapListElementNew>
            </ListGroup>
          </Col>
          <Col xs={3} sm={3} md={3} lg={2}>
              <ListGroup>
                {editors}
              </ListGroup>
              <Button bsStyle="link" onClick={Actions.openInviteNewUserMapDialog}>Invite more editors...</Button>
              <InviteNewUserDialog workspaceID={workspaceID}/>
          </Col>
        </Row>
        <CreateNewMapDialog workspaceID={workspaceID}/>
        <EditWorkspaceDialog workspaceID={workspaceID}/>
      </Grid>
    );
  }
}
