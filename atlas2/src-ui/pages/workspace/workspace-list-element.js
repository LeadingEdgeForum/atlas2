/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  ButtonGroup,
  Table,
  ListGroup,
  ListGroupItem,
  Glyphicon
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import Actions from '../../actions';

export default class WorkspaceListElement extends React.Component {
  archive(id) {
    Actions.archiveWorkspace(id);
  }
  render() {
    var workspaceID = this.props.id;
    var hrefOpen = 'workspace/' + workspaceID;
    var hrefDeduplicate = 'deduplicate/' + workspaceID;
    var mapsCount = this.props.maps.length;
    var mapsCountInfo = "";
    if(mapsCount === 0){
      mapsCountInfo = "(no maps)";
    } else if(mapsCount == 1){
      mapsCountInfo = "(1 map)";
    } else {
      mapsCountInfo = "(" + mapsCount + " maps)";
    }
    return (
      <ListGroupItem header={this.props.name + " - " + this.props.purpose}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={9}>{this.props.description} {mapsCountInfo}.</Col>
            <Col xs={3}>
              <ButtonGroup>
                <LinkContainer to={{ pathname: hrefOpen }}>
                  <Button bsStyle="default" href={hrefOpen}>
                    <Glyphicon glyph="edit"></Glyphicon> Edit
                  </Button>
                </LinkContainer>
                <Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID)}>
                  <Glyphicon glyph="remove"></Glyphicon> Remove
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
