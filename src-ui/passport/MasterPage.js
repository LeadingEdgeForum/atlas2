/*jshint esversion: 6 */

import {Link} from 'react-router';
import {LinkContainer} from 'react-router-bootstrap';

import React, {PropTypes} from 'react';
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
  PageHeader
} from 'react-bootstrap';

var NavbarHeader = Navbar.Header;
var NavbarCollapse = Navbar.Collapse;

var logoStyle = {
  height: 30,
  marginTop: -5
};

export default class MasterPage extends React.Component {
  constructor(props) {
    super(props);
    this.navMenu = props.navMenu;
    this.mainContent = props.mainContent;
    this.componentDidMount.bind(this);
    this.componentWillUnmount.bind(this);
    this.render.bind(this);
    this.logout.bind(this);
    this.forceRedrawListener.bind(this);
  }
  logout(){
    var _this = this;
    this.props.route.authStore.logout(function(){
      _this.props.router.push('/');
    });
  }
  forceRedrawListener(){
    this.forceUpdate();
  }
  componentDidMount(){
    var _this = this;
    _this.props.route.authStore.addChangeListener(_this.forceRedrawListener.bind(_this));
  }
  componentWillUnmount(){
    this.props.route.authStore.removeChangeListener(_this.forceRedrawListener.bind(_this));
  }
  render() {
    this.navMenu = this.props.navMenu;
    this.mainContent = this.props.mainContent;
    if(this.navMenu){
      this.navMenu = React.cloneElement(this.navMenu, {
        authStore: this.props.route.authStore //sends auth instance from route to children
      });
    }
    if(this.mainContent){
      this.mainContent = React.cloneElement(this.mainContent, {
        authStore: this.props.route.authStore //sends auth instance from route to children
      });
    }
    var auth  = this.props.route.authStore;
    var additionalMenu = auth.isLoggedIn() ? (<Nav pullRight>
      <NavItem eventKey={9} href="#" onClick={this.logout.bind(this)}>
        <Glyphicon glyph="log-out"></Glyphicon>
        Logout
      </NavItem>
    </Nav>) : null;
    return (
      <DocumentTitle title='Atlas2, the new, revamped Mapping Tool'>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={16} md={16}>
              <Navbar fluid={true}>
                <NavbarHeader>
                  <NavbarBrand>
                    <Link to="/">
                      <img src="/img/LEF_logo.png" alt="Home" style={logoStyle}></img>
                    </Link>
                  </NavbarBrand>
                </NavbarHeader>
                {this.navMenu}
                {additionalMenu}
              </Navbar>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={16} md={16}>
              {this.mainContent}
            </Col>
          </Row>
        </Grid>
      </DocumentTitle>
    );
  }
}
MasterPage.propTypes = {
  navMenu: React.PropTypes.element,
  mainContent: React.PropTypes.element
};
