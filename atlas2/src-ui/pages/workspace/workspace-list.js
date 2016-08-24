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
import {NotAuthenticated, Authenticated} from 'react-stormpath';
import WorkspaceStore from './workspace-store';
import WorkspaceListElement from './workspace-list-element.js';
import WorkspaceListElementNew from './workspace-list-element-new.js';
var CreateNewWorkspaceDialog = require('./create-new-workspace-dialog');
var EditWorkspaceDialog = require('./edit-workspace-dialog');

export default class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getWorkspaces();
    this.render = this.render.bind(this);
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaces());
  }

  render() {
    var _workspacesToShow = [];
    if (this.state && this.state.workspaces && Array.isArray(this.state.workspaces)) {
      _workspacesToShow = this.state.workspaces.map(item => <WorkspaceListElement key={item.workspace._id} id={item.workspace._id} name={item.workspace.name} description={item.workspace.description}></WorkspaceListElement>);
    }
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <h4>A list of your workspaces:</h4>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <ListGroup>
              {_workspacesToShow}
              <WorkspaceListElementNew></WorkspaceListElementNew>
            </ListGroup>
          </Col>
        </Row>
        <CreateNewWorkspaceDialog/>
        <EditWorkspaceDialog/>
      </Grid>
    );
  }
}
