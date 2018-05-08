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
var Constants = require('./workspace-constants');
import Actions from './workspace-actions.js';
var createReactClass = require('create-react-class');

//TODO: validation of the workspace dialog

var CreateNewWorkspaceDialog = createReactClass({
  getInitialState: function() {
    return this.props.workspaceListStore.isWorkspaceNewDialogOpen();
  },

  componentDidMount: function() {
    this.internalState = {};
    this.props.workspaceListStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.workspaceListStore.removeChangeListener(this._onChange);
  },
  internalState: {},
  _onChange: function() {
    this.setState(this.props.workspaceListStore.isWorkspaceNewDialogOpen());
  },
  _close: function() {
    Actions.closeNewWorkspaceDialog();
    this.internalState = {};
  },
  _submit: function(event) {
    event.stopPropagation();
    this.state.isSubmitDisabled = true;
    Actions.submitNewWorkspaceDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  render: function() {
    var show = this.state.open;
    var isSubmitDisabled = this.state.isSubmitDisabled;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new organization
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
                  <HelpBlock>Purpose consists of scope (f.e. 'We do electric cars') and moral imperative (f.e. 'because we want to speed up migration to renewable energy sources'). Examples include:
                    <ul>
                      <li>Transportation as reliable as running water, everywhere, for everyone. (Uber)</li>
                      <li>We accelerate world’s transition to sustainable energy. (Tesla)</li>
                    </ul>
                  </HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')}/>
                  <HelpBlock>This should express why you analyse certain unit. It may be f.e.
                    <ul>
                      <li>I want to find a meaningful strategy for this company.</li>
                      <li>I want to find out if I can disrupt them.</li>
                      <li>I want to look for sources of inertia.</li>
                    </ul>
                  </HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit} disabled={isSubmitDisabled}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewWorkspaceDialog;
