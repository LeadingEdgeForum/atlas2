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
var Constants = require('./../../../constants');
import Actions from './../../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from '../workspace-store';
//TODO: validation of the workspace dialog

var InviteNewUserDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },
  internalState: {},
  _onChange: function() {
    this.setState(WorkspaceStore.isInviteNewUserDialogOpen());
  },
  _close: function() {
    Actions.closeInviteNewUserDialog();
  },
  _submit: function() {
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.submitInviteNewUserDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Add a new editor.
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="user">
                <Col sm={2}>
                  <ControlLabel>Editor</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter e-mail address" onChange={this._handleDialogChange.bind(this, 'email')}/>
                  <HelpBlock>Who would you like to work with?</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Invite" onClick={this._submit}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = InviteNewUserDialog;
