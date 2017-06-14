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

var EditVariantDialog = React.createClass({
  getInitialState: function() {
    return this.props.singleWorkspaceStore.getEditVariantDialogState();
  },

  componentDidMount: function() {
    this.internalState = {};
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    var newState = this.props.singleWorkspaceStore.getEditVariantDialogState();

    this.internalState.name = newState.name;
    this.internalState.description = newState.description;

    this.setState(newState);
  },

  _close: function() {
    Actions.closeEditVariantDialog();
    this.internalState = {};
  },

  _submit: function() {
    Actions.submitEditVariantDialog(this.state.sourceTimeSliceId, this.internalState.name, this.internalState.description);
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and consider prevent it from submitting
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation();
    }
  },

  render: function() {
    let show = this.state.open;
    let name = this.internalState.name;
    let description = this.internalState.description;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Modify variant
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl
                    type="text"
                    placeholder="Enter variant name"
                    onChange={this._handleDialogChange.bind(this, 'name')}
                    value={name}/>
                  <HelpBlock>A short text to identify your variant</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl
                    type="textarea"
                    placeholder="Enter variant description"
                    onChange={this._handleDialogChange.bind(this, 'description')}
                    value={description}/>
                  <HelpBlock>Longer description</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Modify</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditVariantDialog;
