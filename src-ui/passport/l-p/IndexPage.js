/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table
} from 'react-bootstrap';
import WorkspaceList from '../../pages/workspace/workspace-list';

export default class IndexPage extends React.Component {
  render() {
    var loggedIn = this.props.authStore.isLoggedIn();
    var content = loggedIn ? <WorkspaceList/> : (<Jumbotron>
      <h1>Welcome, Cartographer!</h1>
      <p>You are about to start a wonderful journey.</p>
      <p><Button href="/login" bsStyle="primary" bsSize="lg"> Login now! </Button></p>
    </Jumbotron>);
    return (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={12}>
            {content}
          </Col>
        </Row>
      </Grid>
    );
  }
}
