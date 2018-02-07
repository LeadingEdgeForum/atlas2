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
  Glyphicon,
  Radio
} from 'react-bootstrap';
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';
var createReactClass = require('create-react-class');

var EditConnectionDialog = createReactClass({
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
    var newState = this.props.singleMapStore.getEditConnectionDialogState();
    this.internalState.label = newState.label;
    this.internalState.description = newState.description;
    this.internalState.sourceId = newState.sourceId;
    this.internalState.targetId = newState.targetId;
    this.internalState.connectionType = newState.connectionType;
    this.internalState.mapId = newState.mapID;
    this.internalState.workspaceId = newState.workspaceID;
    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditConnectionDialog();
  },

  _submit: function() {
      SingleMapActions.updateConnection(this.internalState.workspaceID,
          this.internalState.mapID,
          this.internalState.sourceId,
          this.internalState.targetId,
          this.internalState.label,
          this.internalState.description,
          this.internalState.connectionType);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    var label = this.internalState.label;
    var description = this.internalState.description;
    var type = this.internalState.connectionType;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit connection details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="label">
                <Col sm={2}>
                  <ControlLabel>Label</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={label}  placeholder="Enter a label" onChange={this._handleDialogChange.bind(this, 'label')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={description} componentClass="textarea" placeholder="Describe this action" onChange={this._handleDialogChange.bind(this, 'description')} onKeyDown={this._enterInterceptor} style={{ height: 100 }}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="connectionType">
                <Col sm={2}>
                  <ControlLabel>Type</ControlLabel>
                </Col>
                <Col sm={9}>
                    <Radio inline checked={ type==0 || !type} value={0} onChange={this._handleDialogChange.bind(this, 'connectionType')}>None</Radio>{' '}
                    <Radio inline value={10} checked={type==10} onChange={this._handleDialogChange.bind(this, 'connectionType')}>Constraint</Radio>{' '}
                    <Radio inline value={20} checked={type==20} onChange={this._handleDialogChange.bind(this, 'connectionType')}>Flow</Radio>{' '}
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

module.exports = EditConnectionDialog;
