/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap';

export default class WorkspaceListElement extends React.Component {
  render() {
    var hrefOpen = 'workspace/' + this.props.id;
    var hrefDeduplicate = 'deduplicate/' + this.props.id;
    return (
      <ListGroupItem header={this.props.name}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={9}>{this.props.description}</Col>
            <Col xs={1}>
              <Button bsStyle="default" href={hrefOpen}>Open</Button>
            </Col>
            <Col xs={2}>
              <Button bsStyle="default" href={hrefDeduplicate}>Deduplicate</Button>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
