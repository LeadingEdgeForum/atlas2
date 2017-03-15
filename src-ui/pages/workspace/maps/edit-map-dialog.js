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
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from '../workspace-store';
import {calculateMapName} from './map-name-calculator';

//TODO: validation of the workspace dialog

var CreateNewMapDialog = React.createClass({
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
    var newState = WorkspaceStore.isMapEditDialogOpen();
    var map = WorkspaceStore.getMapInfo(newState.mapID);
    //load the map
    if (!this.internalState.map && map && map.map && !map.map.loading) {
      this.internalState.map = map.map;
      this.internalState.user = this.internalState.map.user;
      this.internalState.purpose = this.internalState.map.purpose;
      this.internalState.responsiblePerson = this.internalState.map.responsiblePerson;
      this.internalState.name = this.internalState.map.name;
      this.internalState.workspaceID = this.props.workspaceID;
    }
    //dialog is going to be closed, clean internal state
    if (!newState.open) {
      this.internalState = {};
    }
    this.setState(newState);
  },
  _close: function() {
    Actions.closeEditMapDialog();
  },
  _submit: function() {
    Actions.submitEditMapDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },
  _summary: function(){
    return calculateMapName("Edit your map", this.internalState.user, this.internalState.purpose, this.internalState.name);
  },
  // catch enter and consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation()
    }
  },
  _userPurposeEdit : function(currentUser,currentPurpose, currentResponsiblePerson){
    return (<Form horizontal>
      <FormGroup controlId="user">
        <Col sm={2}>
          <ControlLabel>User</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="text" placeholder="Enter user name" onChange={this._handleDialogChange.bind(this, 'user')} value={currentUser}/>
          <HelpBlock>Who is the main user that you are going to serve?</HelpBlock>
        </Col>
      </FormGroup>
      <FormGroup controlId="purpose">
        <Col sm={2}>
          <ControlLabel>Purpose</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="textarea" placeholder="Enter purpose" onChange={this._handleDialogChange.bind(this, 'purpose')} value={currentPurpose}/>
          <HelpBlock>What is this user trying to accomplish?</HelpBlock>
        </Col>
      </FormGroup>
      <FormGroup controlId="responsiblePerson">
        <Col sm={2}>
          <ControlLabel>Responsible Person</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} value={currentResponsiblePerson}/>
          <HelpBlock>Who will be held responsible for this map?</HelpBlock>
        </Col>
      </FormGroup>
    </Form>);
  },
  _nameEdit : function(currentName, currentResponsiblePerson){
    return (<Form horizontal>
      <FormGroup controlId="name">
        <Col sm={2}>
          <ControlLabel>Name</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} value={currentName} onKeyDown={this._enterInterceptor.bind(this)}/>
          <HelpBlock>What name would describe the best what the system is doing?</HelpBlock>
        </Col>
      </FormGroup>
      <FormGroup controlId="responsiblePerson">
        <Col sm={2}>
          <ControlLabel>Responsible Person</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} value={currentResponsiblePerson}/>
          <HelpBlock>Who will be held responsible for this map?</HelpBlock>
        </Col>
      </FormGroup>
    </Form>);
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentUser = this.internalState.user;
    var currentPurpose = this.internalState.purpose;
    var currentName = this.internalState.name;
    var currentResponsiblePerson = this.internalState.responsiblePerson;
    var summary = this._summary();
    var form = this.internalState.map.isSubmap ? this._nameEdit(currentName, currentResponsiblePerson) : this._userPurposeEdit(currentUser, currentPurpose, currentResponsiblePerson);
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              {summary}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {form}
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Change" onClick={this._submit}>Change</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewMapDialog;
