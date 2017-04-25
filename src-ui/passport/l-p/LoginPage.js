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
  Table,
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  ButtonToolbar
} from 'react-bootstrap';
import AtlasNavbar from '../../atlas-navbar';


export class Login extends React.Component {

  getAuthParams() {
    return {
      email: ReactDOM.findDOMNode(this.refs.email).value,
      password: ReactDOM.findDOMNode(this.refs.password).value
    };
  }

  login(e) {
    e.preventDefault();
    const { email, password } = this.getAuthParams();
    var _this = this;
    this.props.auth.loginPasswordLogin(email, password, function(){
      _this.props.history.push('/');
    });
  }

  render() {
    return (
      <DocumentTitle title='Atlas2, the mapping Tool'>
        <Grid fluid={true}>
        <Row className="show-grid">
          <Col sm={6} smOffset={3} lg={4} lgOffset={4}>
          <h2>Login</h2>
          <Form onSubmit={this.login.bind(this)}>
            <FormGroup controlId="email">
              <ControlLabel>Email, or for LDAP, Login</ControlLabel>
              <FormControl type="text" ref="email" placeholder="yours@example.com" required />
            </FormGroup>

            <FormGroup controlId="password">
              <ControlLabel>Password</ControlLabel>
              <FormControl type="password" ref="password" placeholder="Password" required />
            </FormGroup>

            <ButtonToolbar>
              <Button type="submit" bsStyle="primary">Log In</Button>
            </ButtonToolbar>
          </Form>
          </Col>
        </Row>
        </Grid>
      </DocumentTitle>
    );
  }
}

export default Login;
