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
  openEditMapDialog(mapid) {
    Actions.openEditMapDialog(mapid);
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
            <Col xs={2}>
              <ButtonGroup>
                <Button bsStyle="default" href="#" onClick={this.openEditMapDialog.bind(this, mapid)}>
                  <Glyphicon glyph="edit"></Glyphicon>
                </Button>
                <Button bsStyle="default" href={href}>
                  <Glyphicon glyph="open"></Glyphicon>
                </Button>
                <Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID, mapid)}>
                  <Glyphicon glyph="remove"></Glyphicon>
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
