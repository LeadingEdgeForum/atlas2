/*jshint esversion: 6 */

var React = require('react');
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  Input,
  Modal,
  Button
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./single-workspace-constants');
import Actions from './single-workspace-actions';
var createReactClass = require('create-react-class');
//TODO: validation of the workspace dialog

var InviteNewUserDialog = createReactClass({

  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    this.setState(this.props.singleWorkspaceStore.getInviteNewUserDialogState());
  },

  _close: function() {
    Actions.closeInviteDialog();
    this.internalState = {};
  },

  _submit: function() {
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.submitInviteDialog(this.internalState);
    this.internalState = {};
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
