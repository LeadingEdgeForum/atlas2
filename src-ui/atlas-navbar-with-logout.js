/*jshint esversion: 6 */

import {Link} from 'react-router-dom';

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  Glyphicon
} from 'react-bootstrap';

const NavbarHeader = Navbar.Header;
const NavbarCollapse = Navbar.Collapse;
const NavbarToggle = Navbar.Toggle;


const logoStyle = {
    height: 30,
    marginTop: -5
};

export default class AtlasNavbarWithLogout extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
  }
  logout(){
    this.props.auth.logout(this.props.history);
  }
  render() {
    const mainMenuSection = this.props.mainMenu ? (<Nav>{this.props.mainMenu}</Nav>) : null;
    const rightMenuSection = (
      <Nav pullRight>
        {this.props.rightMenu}
        <NavItem eventKey={8} href="#" onClick={this.logout.bind(this)} key="logout">
          <Glyphicon glyph="king"></Glyphicon>Logout
        </NavItem>
      </Nav>);
    return (
      <Navbar fluid={true}>
        <NavbarHeader>
          <NavbarBrand>
            <Link to="/">
              <img src="/img/LEF_logo.png" alt="Home" style={logoStyle}></img>
            </Link>
          </NavbarBrand>
          <NavbarToggle/>
        </NavbarHeader>
        <NavbarCollapse>
          {mainMenuSection}
          {rightMenuSection}
        </NavbarCollapse>
      </Navbar>
    );
  }
}
AtlasNavbarWithLogout.propTypes = {
  mainMenu: PropTypes.array,
  rightMenu: PropTypes.array,
  auth : PropTypes.object.isRequired,
  history : PropTypes.object.isRequired
};
