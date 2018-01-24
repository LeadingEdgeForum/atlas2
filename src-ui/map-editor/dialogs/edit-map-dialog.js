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
var createReactClass = require('create-react-class');
//TODO: validation of the workspace dialog

var EditMapDialog = createReactClass({
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

  componentDidUpdate(oldProps, oldState){
    if(oldProps.singleMapStore.getMap().map._id !== this.props.singleMapStore.getMap().map._id){
      // map changed, pretend to remount
      oldProps.singleMapStore.removeChangeListener(this._onChange);
      this.props.singleMapStore.addChangeListener(this._onChange);
      this._onChange();
    }
  },

  internalState: {},

  _onChange: function() {
    if(this.props.singleMapStore.getErrorCode()){
      return;
    }
    var newState = this.props.singleMapStore.getMapEditDialogState();
    var map = this.props.singleMapStore.getMap().map;

    this.internalState.workspaceID = this.props.singleMapStore.getWorkspaceId();

    this.internalState.mapID = map._id;
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
    this.internalState[parameterName] = event.target.checked || event.target.value;
    this.forceUpdate();
  },
  _summary: function(){
    return calculateMapName("Edit your map", this.internalState.name, this.internalState.isSubmap);
  },

  // catch enter and consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation();
    }
  },

  _nameEdit : function(currentName, currentResponsiblePerson, isSubmap){
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
      <FormGroup controlId="submap">
        <Col sm={2}>
          <ControlLabel>Is this map a submap?</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="checkbox" placeholder="Is this a submap" onChange={this._handleDialogChange.bind(this, 'isSubmap')} value={isSubmap}/>
          <HelpBlock>Submaps are used to make a more detailed map of a given component.</HelpBlock>
        </Col>
      </FormGroup>
    </Form>);
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentName = this.internalState.name;
    var currentResponsiblePerson = this.internalState.responsiblePerson;
    let isSubmap = this.internalState.isSubmap;
    var summary = this._summary();
    var form = this._nameEdit(currentName, currentResponsiblePerson, isSubmap); /* jshint ignore:line */ // == has to be here, as false is sometimes represented as "false"
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
