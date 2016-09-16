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
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import Actions from '../../../actions';
import {calculateMapName} from './map-name-calculator';

export default class MapListElement extends React.Component {
  archive(workspace, id) {
    Actions.archiveMap(workspace, id);
  }
  render() {
    var mapid = this.props.id;
    var workspaceID = this.props.workspaceID;
    var href = '/map/' + mapid;
    var mapName = calculateMapName("I like being lost.", this.props.user, this.props.purpose);
    return (
      <ListGroupItem header={mapName}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={9}></Col>
            <Col xs={3}>
              <ButtonGroup>
                <LinkContainer to={{ pathname: href }}>
                  <Button bsStyle="default" href={href}>
                    <Glyphicon glyph="edit"></Glyphicon> Edit
                  </Button>
                </LinkContainer>
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
