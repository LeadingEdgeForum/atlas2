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
var Constants = require('./../../constants');
import Actions from './../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './workspace-store';

//TODO: validation of the workspace dialog

var EditWorkspaceDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange);
  },
  internalState: {},
  _onChange: function() {
    var newState = WorkspaceStore.isWorkspaceEditDialogOpen();
    var workspace = WorkspaceStore.getWorkspaceInfo(newState.editedWorkspace);
    //load the workspace only once after it is loadeds
    if (!this.internalState.workspace && workspace && workspace.workspace && !workspace.loading) {
      this.internalState.workspace = workspace.workspace;
      this.internalState.name = this.internalState.workspace.name;
      this.internalState.description = this.internalState.workspace.description;
    }
    //dialog is going to be closed, clean internal state
    if (!newState.open) {
      this.internalState = {};
    }
    this.setState(newState);
  },
  _close: function() {
    Actions.closeEditWorkspaceDialog();
  },
  _submit: function() {
    Actions.submitEditWorkspaceDialog(this.state.editedWorkspace, this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentName = this.internalState.name;
    var currentDescription = this.internalState.description;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit existing workspace
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name (at least 5 characters)" onChange={this._handleDialogChange.bind(this, 'name')} value={currentName}/>
                  <HelpBlock>Name of the workspace</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')} value={currentDescription}/>
                  <HelpBlock>Description of the workspace</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Change</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditWorkspaceDialog;
