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
var _ = require('underscore');



export default class CustomerJourneyEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {expanded:false};
    this.render = this.render.bind(this);
    // this.componentDidMount = this.componentDidMount.bind(this);
    // this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  // componentDidMount() {
  //   WorkspaceStore.addChangeListener(this._onChange.bind(this));
  // }
  //
  // componentWillUnmount() {
  //   WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  // }
  //
  // _onChange() {
  //   this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
  //   this.setState(WorkspaceStore.getWorkspaceInfo(this.state.map.workspace));
  // }

  render() {
    return (
      <Row className="show-grid">
        <Col xs={1}>
        <Button style={null}>Expand >>></Button>
        </Col>
        <Col xs={11}>Customer Journey</Col>
      </Row>
    );
  }
}
