/*jshint esversion: 6 */

import {Link} from 'react-router-dom';

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem
} from 'react-bootstrap';

const NavbarHeader = Navbar.Header;
const NavbarCollapse = Navbar.Collapse;
const NavbarToggle = Navbar.Toggle;


const logoStyle = {
    height: 30,
    marginTop: -5
};

export default class AtlasNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
  }
  render() {
    const mainMenuSection = this.props.mainMenu ? (<Nav>{this.props.mainMenu}</Nav>) : null;
    const rightMenuSection = this.props.rightMenu ? (<Nav pullRight>{this.props.rightMenu}</Nav>) : null;
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
AtlasNavbar.propTypes = {
  mainMenu: PropTypes.array,
  rightMenu: PropTypes.array
};
