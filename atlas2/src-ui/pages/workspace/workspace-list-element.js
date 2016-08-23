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
  ListGroupItem,
  Glyphicon
} from 'react-bootstrap';
import LinkContainer from 'react-router-bootstrap';
import Actions from '../../actions';

export default class WorkspaceListElement extends React.Component {
  archive(id) {
    Actions.archiveWorkspace(id);
  }
  render() {
    var workspaceID = this.props.id;
    var hrefOpen = 'workspace/' + workspaceID;
    var hrefDeduplicate = 'deduplicate/' + workspaceID;
    return (
      <ListGroupItem header={this.props.name}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={8}>{this.props.description}</Col>
            <Col xs={1}>
              <Button bsStyle="default" href={hrefOpen}>Open</Button>
            </Col>
            <Col xs={2}>
              <Button bsStyle="default" href={hrefDeduplicate}>Deduplicate</Button>
            </Col>
            <Col xs={1}>
              <Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID)}>
                <Glyphicon glyph="remove"></Glyphicon>
              </Button>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
