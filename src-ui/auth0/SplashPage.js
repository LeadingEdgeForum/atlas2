/*jshint esversion: 6 */

import {Link} from 'react-router';
import {LinkContainer} from 'react-router-bootstrap';

import React  from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  Glyphicon,
  PageHeader,
  Jumbotron,
  Button,
  Table
} from 'react-bootstrap';
import AtlasNavbar from '../atlas-navbar';
import { Timeline } from 'react-twitter-widgets';


export default class SplashPage extends React.Component {
  constructor(props) {
    super(props);
  }
  login(){
    this.props.auth.setHistory(this.props.history);
    this.props.auth.login(this.props.history);
  }
  signUp(){
    this.props.auth.history = this.props.history;
    this.props.auth.signUp(this.props.history);
  }
  render() {
    var loginNav = [
        <NavItem eventKey={8} href="#" onClick={this.login.bind(this)} key="login">
          <Glyphicon glyph="king"></Glyphicon>
          Login
        </NavItem>
    ];
    return (
      <DocumentTitle title='Atlas2, the mapping Tool'>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={16} md={16}>
              <AtlasNavbar rightMenu={loginNav}/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={10}>
              <Jumbotron>
                <h1>Welcome, Cartographer!</h1>
                <p>You are about to start a wonderful journey.</p>
                <p><Button href="#" bsStyle="primary" bsSize="lg" onClick={this.signUp.bind(this)}> Register now </Button></p>
              </Jumbotron>
            </Col>
            <Col xs={2}>
              <Timeline
                dataSource={{
                  sourceType: 'profile',
                  screenName: 'atlas2_news'
                }}
                options={{
                  username: 'atlas2_news',
                  height: '400',
                  chrome: 'noheader nofooter noscrollbar'
                }}/>
            </Col>
          </Row>
        </Grid>
      </DocumentTitle>
    );
  }
}
SplashPage.propTypes = {
  auth : React.PropTypes.object.isRequired,
  history : React.PropTypes.object.isRequired
};
