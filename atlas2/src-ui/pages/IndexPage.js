/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table
} from 'react-bootstrap';
import {NotAuthenticated, Authenticated} from 'react-stormpath';
import WorkspaceList from './workspace/workspace-list';

export default class IndexPage extends React.Component {
  render() {
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12}>
            <NotAuthenticated>
              <Jumbotron>
                <h1>
                  Welcome, Cartographer!
                </h1>
                <p>
                  You are about to start a wonderful journey.
                </p>
                <p>
                  <Button href="/register" bsStyle="primary" bsSize="lg">Register now</Button>
                </p>
              </Jumbotron>
            </NotAuthenticated>
            <Authenticated>
              <WorkspaceList/>
            </Authenticated>
          </Col>
        </Row>
      </Grid>
    );
  }
}
