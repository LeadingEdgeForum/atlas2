/*jshint esversion: 6 */

import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import { NotAuthenticated, Authenticated } from 'react-stormpath';
import {Grid, Row, Col, Navbar, NavbarBrand, Nav, NavItem, Glyphicon, PageHeader} from 'react-bootstrap';

var NavbarHeader = Navbar.Header;
var NavbarCollapse = Navbar.Collapse;

var logoStyle = {
        height : 30,
        marginTop : -5
      };

export default class MasterPage extends React.Component {
  constructor (props){
    super(props);
    this.navMenu = props.navMenu;
    this.mainContent = props.mainContent;
  }
  render() {
    this.navMenu = this.props.navMenu;
    this.mainContent = this.props.mainContent;
    return (
      <DocumentTitle title='Atlas2, the new, revamped Mapping Tool'>
      <Grid fluid={true}>
      <Row className="show-grid">
        <Col xs={16} md={16}>
          <Navbar fluid={true}>
            <NavbarHeader>
              <NavbarBrand>
                <Link to="/"><img src="/img/LEF_logo.png" alt="Home" style={logoStyle}></img></Link>
              </NavbarBrand>
            </NavbarHeader>
              {this.navMenu}
              <Authenticated>
            <Nav pullRight>
              <LinkContainer to={{ pathname: '/profile'}}>
              <NavItem eventKey={8} href="/profile">
                <Glyphicon glyph="user">
                </Glyphicon> My Account
              </NavItem>
            </LinkContainer>
              <NavItem eventKey={9} href="/logout">
                <Glyphicon glyph="log-out">
                </Glyphicon> Logout
              </NavItem>
            </Nav>
            </Authenticated>
            <NotAuthenticated>
              <Nav pullRight>
              <LinkContainer to={{ pathname: '/register'}}>
              <NavItem eventKey={8} href="/register">
                <Glyphicon glyph="knight">
                </Glyphicon> Create Account
              </NavItem>
            </LinkContainer>
            </Nav>
            <Nav pullRight>
            <LinkContainer to={{ pathname: '/login'}}>
            <NavItem eventKey={8} href="/login">
              <Glyphicon glyph="king">
              </Glyphicon> Login
            </NavItem>
          </LinkContainer>
          </Nav>
            </NotAuthenticated>
          </Navbar>
        </Col>
      </Row>
      <Row className="show-grid">
        {this.mainContent}
      </Row>
    </Grid>
      </DocumentTitle>
    );
  }
}
MasterPage.propTypes = {navMenu : React.PropTypes.element, mainContent : React.PropTypes.element};
