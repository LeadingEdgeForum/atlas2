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
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from '../workspace-store';

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
      this.internalState.name = this.internalState.map.name;
      this.internalState.description = this.internalState.map.description;
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
              Edit your map
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
                  <HelpBlock>Name of your map</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter description (this is optional, but usefull)" onChange={this._handleDialogChange.bind(this, 'description')} value={currentDescription}/>
                  <HelpBlock>Description of your map</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
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
