/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  ListGroupItem,
  Grid,
  Row,
  Col,
  Button,
  Glyphicon
} from 'react-bootstrap';
import Actions from '../../../actions';

export default class MapListElement extends React.Component {
  archive(workspace, id) {
    Actions.archiveMap(workspace, id);
  }

  render() {
    var mapid = this.props.id;
    var workspaceID = this.props.workspaceID;
    var href = '/map/' + mapid;
    return (
      <ListGroupItem header={this.props.name}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={10}>{this.props.description}</Col>
            <Col xs={1}>
              <Button bsStyle="default" href={href}>Open</Button>
            </Col>
            <Col xs={1}>
              <Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID, mapid)}>
                <Glyphicon glyph="remove"></Glyphicon>
              </Button>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
