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

var CreateNewWorkspaceDialog = React.createClass({
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
    this.setState(WorkspaceStore.isWorkspaceNewDialogOpen());
  },
  _close: function() {
    Actions.closeNewWorkspaceDialog();
  },
  _submit: function() {
    Actions.submitNewWorkspaceDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new workspace
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name (at least 3 characters)" onChange={this._handleDialogChange.bind(this, 'name')}/>
                  <HelpBlock>This should be a name of the company you are trying to analyse. It might be wise to include a date, for example 'FooCompany 2016'</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="purpose">
                <Col sm={2}>
                  <ControlLabel>Purpose</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter purpose (this is very recommended)" onChange={this._handleDialogChange.bind(this, 'purpose')}/>
                  <HelpBlock>Purpose consists of scope (f.e. 'We do electric cars') and moral imperative (f.e. 'because we want to speed up migration to renewable energy sources').
                  Examples include:
                  <ul>
                  <li>Transportation as reliable as running water, everywhere, for everyone. (Uber)</li>
                  <li>We accelerate world’s transition to sustainable energy. (Tesla)</li>
                  </ul></HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')}/>
                  <HelpBlock>This should express why you analyse certain unit. It may be f.e. <ul>
                  <li>I want to find a meaningful strategy for this company.</li>
                  <li>I want to find out if I can disrupt them.</li>
                  <li>I want to look for sources of inertia.</li>
                  </ul></HelpBlock>
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

module.exports = CreateNewWorkspaceDialog;
