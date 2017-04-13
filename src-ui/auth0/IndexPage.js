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
import WorkspaceList from '../pages/workspace/workspace-list';
import { Timeline } from 'react-twitter-widgets';


export default class IndexPage extends React.Component {
  signUp(){
    this.props.auth.signUp();
  }
  render() {
    var loggedIn = this.props.auth.loggedIn();
    var contentIn = (<Row className="show-grid"><Col xs={12}><WorkspaceList/></Col></Row>);
    var contentOut = (<Row className="show-grid"><Col xs={8}><Jumbotron>
      <h1>Welcome, Cartographer!</h1>
      <p>You are about to start a wonderful journey.</p>
      <p><Button href="#" bsStyle="primary" bsSize="lg" onClick={this.signUp.bind(this)}> Register now </Button></p>
    </Jumbotron></Col>
    <Col xs={4}><Timeline
      dataSource={{
        sourceType: 'profile',
        screenName: 'atlas2_news'
      }}
      options={{
        username: 'atlas2_news',
        height: '400',
        chrome: 'noheader nofooter noscrollbar'
      }}/></Col></Row>);
    var content = loggedIn ?  contentIn : contentOut;
    return (
      <Grid fluid={true}>

          {content}

      </Grid>
    );
  }
}
