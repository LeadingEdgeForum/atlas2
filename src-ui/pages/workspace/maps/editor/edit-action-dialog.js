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
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var _ = require('underscore');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './../../workspace-store';


var EditActionDialog = React.createClass({
  getInitialState: function() {
    return WorkspaceStore.getEditActionDialogState();
  },

  componentDidMount: function() {
    this.internalState = {};
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange);
  },
  internalState: {},
  _onChange: function() {
    var newState = WorkspaceStore.getEditActionDialogState();
    this.internalState.shortSummary = newState.shortSummary;
    this.internalState.description = newState.description;
    this.internalState.seq = newState.seq;
    this.internalState.sourceID = newState.sourceID;
    this.setState(newState);
  },
  _close: function() {
    Actions.closeEditActionDialog();
  },
  _submit: function() {
      this.internalState.mapID = this.props.mapID;
      this.internalState.workspaceID = this.props.workspaceID;
      Actions.updateAction(this.props.workspaceID,
          this.props.mapID,
          this.internalState.sourceID,
          this.internalState.seq,
          null, // position should not change
          this.internalState.shortSummary,
          this.internalState.description);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },
  render: function() {
    var show = this.state.open;
    var summary = this.internalState.shortSummary;
    var description = this.internalState.description;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit action details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="shortSummary">
                <Col sm={2}>
                  <ControlLabel>Summary</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={summary}  placeholder="Enter short summary" onChange={this._handleDialogChange.bind(this, 'shortSummary')} onKeyDown={this._enterInterceptor}/>
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

module.exports = EditActionDialog;
