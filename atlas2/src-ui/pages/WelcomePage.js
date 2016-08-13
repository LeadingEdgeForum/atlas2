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

export default class WelcomePage extends React.Component {
  render() {
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
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
          </Col>
        </Row>
      </Grid>
    );
  }
}
