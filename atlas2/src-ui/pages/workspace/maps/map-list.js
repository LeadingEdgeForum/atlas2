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

export default class MapList extends React.Component {
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
      _workspacesToShow = this.state.workspaces.map(item => <MapListElement key={item.workspace._id} id={item.workspace._id} name={item.workspace.name} description={item.workspace.description}></MapListElement>);
    }
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <ListGroup>
              {_workspacesToShow}
              <MapListElementNew></MapListElementNew>
            </ListGroup>
          </Col>
        </Row>
        <CreateNewMapDialog/>
      </Grid>
    );
  }
}
