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
  Col,
  Glyphicon
} from 'react-bootstrap';
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';
import {calculateMapName} from '../../map-list/map-name-calculator';

//TODO: validation of the workspace dialog

var EditMapDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    this.props.singleMapStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.singleMapStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    var newState = this.props.singleMapStore.getMapEditDialogState();
    var map = this.props.singleMapStore.getMap().map;

    this.internalState.workspaceID = this.props.singleMapStore.getWorkspaceId();

    this.internalState.mapID = map._id;
    this.internalState.user = map.user;
    this.internalState.purpose = map.purpose;
    this.internalState.responsiblePerson = map.responsiblePerson;
    this.internalState.name = map.name;
    this.internalState.isSubmap = !!map.isSubmap;

    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditMapDialog();
    this.internalState = {};
  },

  _submit: function() {
    SingleMapActions.submitEditMapDialog(this.internalState);
    this.internalState = {};
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
        e.stopPropagation();
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
    var form = this.internalState.isSubmap ? this._nameEdit(currentName, currentResponsiblePerson) : this._userPurposeEdit(currentUser, currentPurpose, currentResponsiblePerson);
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

module.exports = EditMapDialog;
