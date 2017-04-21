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

//TODO: validation of the workspace dialog

var CreateNewNodeDialog = React.createClass({

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
    this.setState(this.props.singleMapStore.getNewNodeDialogState());
  },

  _close: function() {
    SingleMapActions.closeAddNodeDialog();
  },

  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.props.workspaceID;
    SingleMapActions.submitAddNodeDialog(_.extend(this.state, this.internalState));
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and consider it to be 'submit'
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  },

  render: function() {
    var show = this.state.open;
    var inertia = this.internalState.inertia;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new node
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the component" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="responsiblePerson">
                <Col sm={2}>
                  <ControlLabel>Owner</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Responsible Person" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="inertia">
                <Col sm={2}>
                  <ControlLabel>Inertia</ControlLabel>
                </Col>
                <Col sm={9}>
                    <Radio inline checked={ inertia==0 || !inertia} value={0} onChange={this._handleDialogChange.bind(this, 'inertia')}>None</Radio>{' '}
                    <Radio inline value={0.33} checked={inertia==0.33} onChange={this._handleDialogChange.bind(this, 'inertia')}>Small</Radio>{' '}
                    <Radio inline value={0.66} checked={inertia==0.66} onChange={this._handleDialogChange.bind(this, 'inertia')}>Considerable</Radio>{' '}
                    <Radio inline value={1} checked={inertia==1} onChange={this._handleDialogChange.bind(this, 'inertia')}>Huge</Radio>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" componentClass="textarea" placeholder="Describing what the component does will help other people" onChange={this._handleDialogChange.bind(this, 'description')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewNodeDialog;
