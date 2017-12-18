/*jshint esversion: 6 */

var React = require('react');
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  Radio,
  Input,
  Modal,
  Button,
  Glyphicon
} from 'react-bootstrap';
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';
var _ = require('underscore');
var createReactClass = require('create-react-class');

var EditUserDialog = createReactClass({

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
    var newState = this.props.singleMapStore.getEditUserDialogState();
    this.internalState.name = newState.name;
    this.internalState.description = newState.description;
    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditUserDialog();
  },

  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.props.workspaceID;
    SingleMapActions.submitEditUserDialog(_.extend(this.state, this.internalState));
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and do not consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation();
    }
  },

  render: function() {
    var show = this.state.open;
    var name = this.internalState.name;
    var description = this.internalState.description;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit the user
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter the name of the user" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor} value={name}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" componentClass="textarea" placeholder="Who is the user?" onChange={this._handleDialogChange.bind(this, 'description')} onKeyDown={this._enterInterceptor} value={description}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Add" onClick={this._submit}>Save</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditUserDialog;
