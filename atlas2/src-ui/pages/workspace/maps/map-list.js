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

  render() {
    var _mapsToShow = [];
    var workspaceID = this.props.params.workspaceID;
    if (this.state && this.state.workspace && this.state.workspace.maps && Array.isArray(this.state.workspace.maps)) {
      _mapsToShow = this.state.workspace.maps.map(item => <MapListElement workspaceID={workspaceID} key={item._id} id={item._id} name={item.name} description={item.description}></MapListElement>);
    } else {
      return (
        <p>Something went really wrong :-(</p>
      );
    }
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <h4>Your list of maps in current workspace:</h4>
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <ListGroup>
              {_mapsToShow}
              <MapListElementNew></MapListElementNew>
            </ListGroup>
          </Col>
        </Row>
        <CreateNewMapDialog workspaceID={workspaceID}/>
      </Grid>
    );
  }
}
