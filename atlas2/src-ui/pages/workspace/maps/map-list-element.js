/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  ListGroupItem,
  Grid,
  Row,
  Col,
  Button,
  ButtonGroup,
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
            <Col xs={9}>{this.props.description}</Col>
            <Col xs={3}>
              <ButtonGroup>
                <Button bsStyle="default" href={href}>
                  <Glyphicon glyph="edit"></Glyphicon> Edit
                </Button>
                <Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID, mapid)}>
                  <Glyphicon glyph="remove"></Glyphicon> Delete
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
