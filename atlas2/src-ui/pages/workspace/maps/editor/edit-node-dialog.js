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
  Radio
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var _ = require('underscore');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './../../workspace-store';

//TODO: validation of the workspace dialog

var EditNodeDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },
  internalState: {},
  _onChange: function() {
    var newState = WorkspaceStore.isNodeEditDialogOpen();
    var map = WorkspaceStore.getMapInfo(newState.mapID);
    var nodeID = newState.nodeID;
    //load the map
    if (!this.internalState.map && map && map.map && !map.map.loading) {
      this.internalState.map = map.map;
      for (var i = 0; i < this.internalState.map.nodes.length; i++) {
        if (this.internalState.map.nodes[i]._id === nodeID) {
          this.internalState.name = this.internalState.map.nodes[i].name;
          this.internalState.type = this.internalState.map.nodes[i].type;
        }
      }
    }
    //dialog is going to be closed, clean internal state
    if (!newState.open) {
      this.internalState = {};
    }
    this.setState(newState);
  },
  _close: function() {
    Actions.closeEditNodeDialog();
  },
  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.state.workspaceID;
    this.internalState.nodeID = this.state.nodeID;
    Actions.submitEditNodeDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },
  // catch enter and consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation()
    }
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var name = this.internalState.name;
    var type = this.internalState.type;

    var typeGroup = type != Constants.SUBMAP ? (<FormGroup controlId="type">
      <Col sm={2}>
        <ControlLabel>Type</ControlLabel>
      </Col>
      <Col sm={9}>
        <Radio inline checked={Constants.USERNEED === type} value={Constants.USERNEED} onChange={this._handleDialogChange.bind(this, 'type')}>User need</Radio>
        <Radio inline checked={Constants.INTERNAL === type} value={Constants.INTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Internal</Radio>
        <Radio inline checked={Constants.EXTERNAL === type} value={Constants.EXTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Outsourced</Radio>
      </Col>
    </FormGroup>) : null;

    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit node
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the component" onChange={this._handleDialogChange.bind(this, 'name')} value={name} onKeyDown={this._enterInterceptor.bind(this)}/>
                </Col>
              </FormGroup>
              {typeGroup}
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

module.exports = EditNodeDialog;
