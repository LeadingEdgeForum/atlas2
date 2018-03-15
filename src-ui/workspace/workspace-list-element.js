/* Copyright 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */

import React from 'react';
import {
  Grid,
  Row,
  Col,
  Table,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import Actions from './workspace-actions';

export default class WorkspaceListElement extends React.Component {
  delete(id, event) {
    event.stopPropagation();
    event.preventDefault();
    Actions.deleteWorkspace(id);
  }
  showWorkspaceHistory(workspaceID, event){
    Actions.showWorkspaceHistory(workspaceID);
  }
  stopPropagation(event){
    event.stopPropagation();
    event.preventDefault();
  }
  render() {
    var workspaceID = this.props.id;
    var hrefOpen = 'workspace/' + workspaceID;
    var hrefDeduplicate = 'deduplicate/' + workspaceID;
    var mapsCount = this.props.maps.length;
    var mapsCountInfo = "";
    if(mapsCount === 0){
      mapsCountInfo = "(no maps)";
    } else if(mapsCount === 1){
      mapsCountInfo = "(1 map)";
    } else {
      mapsCountInfo = "(" + mapsCount + " maps)";
    }
    var dropDownTitle = <Glyphicon glyph="cog"></Glyphicon>;
    return (
      <LinkContainer to={{ pathname: hrefOpen }}>
        <ListGroupItem header={this.props.name + " - " + this.props.purpose} href={hrefOpen}>
          <Grid fluid={true}>
            <Row className="show-grid">
              <Col xs={11}>{this.props.description} {mapsCountInfo}.</Col>
              <Col xs={1}>
                <DropdownButton title={dropDownTitle} onClick={this.stopPropagation}>
                  <MenuItem eventKey="1" onClick={this.showWorkspaceHistory.bind(this, workspaceID)}><Glyphicon glyph="film"></Glyphicon> Fetch XHR History</MenuItem>
                  <MenuItem eventKey="2" onClick={this.delete.bind(this, workspaceID)}><Glyphicon glyph="remove"></Glyphicon> Remove</MenuItem>
                </DropdownButton>
                </Col>
              </Row>
          </Grid>
          </ListGroupItem>
      </LinkContainer>
    );
  }
}
