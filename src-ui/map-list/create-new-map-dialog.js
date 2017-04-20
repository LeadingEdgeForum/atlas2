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
import {calculateMapName} from './map-name-calculator';
//TODO: validation of the workspace dialog

var CreateNewMapDialog = React.createClass({
  getInitialState: function() {
    return this.props.singleWorkspaceStore.getNewMapDialogState();
  },
  componentDidMount() {
    this.props.singleWorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  internalState: {},

  _onChange: function() {
    this.setState(this.props.singleWorkspaceStore.getNewMapDialogState());
  },

  _close: function() {
    Actions.closeNewMapDialog();
    this.internalState = {};
  },

  _submit: function() {
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.submitNewMapDialog(this.internalState);
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  _summary: function() {
    return calculateMapName("Create a new map", this.internalState.user, this.internalState.purpose);
  },

  render: function() {
    var show = this.state.open;
    var summary = this._summary();
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              {summary}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="user">
                <Col sm={2}>
                  <ControlLabel>User</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter user name" onChange={this._handleDialogChange.bind(this, 'user')}/>
                  <HelpBlock>Who is the main user that you are going to serve?</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="purpose">
                <Col sm={2}>
                  <ControlLabel>Purpose</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter purpose" onChange={this._handleDialogChange.bind(this, 'purpose')}/>
                  <HelpBlock>What is this user trying to accomplish?</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="responsiblePerson">
                <Col sm={2}>
                  <ControlLabel>Responsible Person</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')}/>
                  <HelpBlock>Who will be held responsible for this map?</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create a new map</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewMapDialog;
