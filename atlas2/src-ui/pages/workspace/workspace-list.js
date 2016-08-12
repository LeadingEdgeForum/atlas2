/*jshint esversion: 6 */


import React, { PropTypes } from 'react';
import DocumentTitle from 'react-document-title';
import {Grid, Row, Col, Jumbotron, Button, Table, ListGroup} from 'react-bootstrap';
import { NotAuthenticated, Authenticated } from 'react-stormpath';
import WorskpaceListElementNew from './workspace-list-element-new.js';

export default class WorkspaceList extends React.Component {
  render() {
    return (
      <Grid fluid={true}>
          <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <ListGroup>
              <WorskpaceListElementNew></WorskpaceListElementNew>
            </ListGroup>
          </Col>
          </Row>
      </Grid>
    );
  }
}
