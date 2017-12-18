/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  PageHeader,
  ListGroup,
  ListGroupItem,
  Button,
  Modal
} from 'react-bootstrap';
import AtlasNavbar from '../atlas-navbar.js';
import $ from 'jquery';

export default class AcceptTosPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    /* globals ___AUTH0_ISSUER___ */
    const URL = 'https://' + ___AUTH0_ISSUER___ + '/continue?state=' + this.props.state;
    return (
      <DocumentTitle title='Atlas2 Terms of Service'>
      <Modal show={true}>
        <Modal.Header closeButton>
          <Modal.Title>
            One more thing...
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p> Accept <a href="/tos" target="_blank">Atlas2 terms of service</a> to proceed.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button href={URL} bsStyle="success">I accept</Button>
        </Modal.Footer>
      </Modal>
      </DocumentTitle>
    );
  }
}
