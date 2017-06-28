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
import AtlasNavbar from '../../atlas-navbar';


export default class SplashPage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    var loginNav = [
        <NavItem eventKey={8} href="/login" key="login">
          <Glyphicon glyph="king"></Glyphicon>
          Login
        </NavItem>
    ];
    return (
      <DocumentTitle title='Atlas2, the mapping Tool'>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={16} md={16}>
              <AtlasNavbar/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={12}>
              <Jumbotron>
                <h1>Welcome, Cartographer!</h1>
                <p>You are about to start a wonderful journey.</p>
                <p><LinkContainer to="/login"><Button href="/login" bsStyle="primary" bsSize="lg"> Login now!</Button></LinkContainer></p>
              </Jumbotron>
            </Col>
          </Row>
        </Grid>
      </DocumentTitle>
    );
  }
}
SplashPage.propTypes = {
  auth : React.PropTypes.object.isRequired
};
