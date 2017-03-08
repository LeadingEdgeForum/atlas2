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
  Row,
  Checkbox
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var _ = require('underscore');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './../../workspace-store';

//TODO: validation of the workspace dialog

var CreateNewSubmapDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
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
    this.setState(WorkspaceStore.getNewSubmapDialogState());
  },
  _close: function() {
    Actions.closeNewSubmapDialog();
  },
  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    Actions.createSubmap(this.props.workspaceID, this.internalState.name);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  // catch enter and consider it to be 'submit'
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  renderNewSubmapDialogOnly: function(show) {
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor}/>
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
  },
  renderListOfAvailableSubmaps: function() {
    var finalList = [];
    for (var i = 0; i < this.state.listOfAvailableSubmaps.length; i++) {
      var refID = '' + this.state.listOfAvailableSubmaps[i]._id;
      finalList.push(
        <p>
          <Button bsSize="small" block onClick={Actions.createReferencedSubmap.bind(Actions, refID)}>{this.state.listOfAvailableSubmaps[i].name}</Button>
        </p>
      )
    };
    return finalList;
  },
  renderNewSubmapDialogWitSubmapList: function(show) {
    var finalList = this.renderListOfAvailableSubmaps();
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Type a name or reference an existing submap.</p>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor.bind(this)}/>
                </Col>
              </FormGroup>
            </Form>
            <div className="well" style={{
              maxWidth: 400,
              margin: '0 auto 10px'
            }}>
              {finalList}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },
  render: function() {
    var show = this.state.open;
    if (!this.state.listOfAvailableSubmaps || this.state.listOfAvailableSubmaps.length === 0) {
      return this.renderNewSubmapDialogOnly(show);

    }
    return this.renderNewSubmapDialogWitSubmapList(show);
  }
});

module.exports = CreateNewSubmapDialog;
