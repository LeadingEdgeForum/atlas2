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
var _ = require('underscore');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './../../workspace-store';

//TODO: validation of the workspace dialog

var CreateNewNodeDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange);
  },
  internalState: {},
  _onChange: function() {
    this.setState(WorkspaceStore.getNewNodeDialogState());
  },
  _close: function() {
    Actions.closeNewNodeDialog();
  },
  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.newNodeCreated(_.extend(this.state, this.internalState));
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  // catch enter and consider it to be 'submit'
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new node
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the component" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewNodeDialog;
