/*jshint esversion: 6 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from '../../workspace-store';

//TODO: validation

var CreateNewCapabilityDialog = React.createClass({

  internalState: {},

  _submit: function() {
    this.props.submitDialog(this.props.capabilityCategory, this.internalState.description, this.props.nodeBeingAssigned);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  render: function() {
    var show = this.props.open;
    var nodeName = this.props.nodeBeingAssigned
      ? (this.props.nodeBeingAssigned.name) //jshint ignore:line
      : '';
    var cancel = this.props.cancel;
    return (
      <div>
        <Modal show={show} onHide={cancel}>
          <Modal.Header closeButton>
            <Modal.Title>
              Describe a new capability
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h6>Node&nbsp;
              <b>{nodeName}</b>&nbsp;will be assigned to this capability</h6>
            <Form horizontal>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description here" onChange={this._handleDialogChange.bind(this, 'description')}/>
                  <HelpBlock>Describe what this component actually does.</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={cancel}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit.bind(this)}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewCapabilityDialog;
