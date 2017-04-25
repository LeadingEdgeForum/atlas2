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
  Button,
  Glyphicon
} from 'react-bootstrap';
import Actions from '../map-list/single-workspace-actions';

//TODO: validation of the workspace dialog

var EditWorkspaceDialog = React.createClass({

  getInitialState: function() {
    return this.props.singleWorkspaceStore.getWorkspaceEditDialogState();
  },

  componentDidMount: function() {
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    var newState = this.props.singleWorkspaceStore.getWorkspaceEditDialogState();

    this.internalState.name = newState.name;
    this.internalState.description = newState.description;
    this.internalState.purpose = newState.purpose;

    this.setState(newState);
},

  _close: function() {
    Actions.closeEditWorkspaceDialog();
    this.internalState = {};
  },

  _submit: function() {
    Actions.submitEditWorkspaceDialog(this.state.workspaceID, this.internalState);
    this.internalState = {};
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
    var currentPurpose = this.internalState.purpose;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit existing organization
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
                </Col>
              </FormGroup>
              <FormGroup controlId="purpose">
                <Col sm={2}>
                  <ControlLabel>Purpose</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter purpose (this is very recommended)" onChange={this._handleDialogChange.bind(this, 'purpose')} value={currentPurpose}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')} value={currentDescription}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Save" onClick={this._submit}>Save</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditWorkspaceDialog;
