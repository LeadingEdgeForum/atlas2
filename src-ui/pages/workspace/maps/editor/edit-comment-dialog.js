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


var EditCommentDialog = React.createClass({
  getInitialState: function() {
    return WorkspaceStore.getEditCommentDialogState();
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
    var newState = WorkspaceStore.getEditCommentDialogState();
    this.internalState.comment = newState.comment;
    this.setState(newState);
  },
  _close: function() {
    Actions.closeEditGenericCommentDialog();
  },
  _submit: function() {
    this.internalState.mapID = this.props.mapID;
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.submitEditGenericCommentDialog(_.extend(this.state, this.internalState));
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },
  render: function() {
    var show = this.state.open;
    var comment = this.internalState.comment;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit the comment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Your comment</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={comment} componentClass="textarea" placeholder="Enter comment" onChange={this._handleDialogChange.bind(this, 'comment')} onKeyDown={this._enterInterceptor} style={{ height: 100 }}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Add" onClick={this._submit}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditCommentDialog;
