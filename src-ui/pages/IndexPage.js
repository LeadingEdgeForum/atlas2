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
import WorkspaceList from './workspace/workspace-list';

export default class IndexPage extends React.Component {
  signUp(){
    this.props.auth.signUp();
  }
  render() {
    var loggedIn = this.props.auth.loggedIn();
    var content = loggedIn ? <WorkspaceList/> : (<Jumbotron>
      <h1>Welcome, Cartographer!</h1>
      <p>You are about to start a wonderful journey.</p>
      <p><Button href="#" bsStyle="primary" bsSize="lg" onClick={this.signUp.bind(this)}> Register now </Button></p>
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
