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
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from '../../workspace-store';

//TODO: validation

var AssignExistingCapabilityDialog = React.createClass({

  internalState: {},

  submit: function(nodeBeingAssignedID) { //duplicate in capability
    this.props.submitAssignDialog(nodeBeingAssignedID);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  renderExistingItems: function(nodes) {
    var submit = this.submit;
    var result = [];
    var nodeBeingAssigned = this.props.nodeBeingAssigned; // find a a map
    nodes.map(node => {
      result.push(
        <ListGroupItem onClick={submit.bind(this, nodeBeingAssigned._id)}>
          <b>&#039;{node.name}&#039;</b> from map MAPNAME
        </ListGroupItem>
      );
    });
    return result;
  },
  render: function() {
    var show = this.props.open;
    var nodeBeingAssigned = this.props.nodeBeingAssigned;
    if (!nodeBeingAssigned) {
      return null;
    }
    var cancel = this.props.cancel;
    var existingItems = this.renderExistingItems(this.props.otherNodes);
    var submit = this.submit;
    return (
      <div>
        <Modal show={show} onHide={cancel}>
          <Modal.Header closeButton>
            <Modal.Title>
              Assign the component <b>&#039;{nodeBeingAssigned.name}&#039;</b>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Choose whether component
            <b>&#039;{nodeBeingAssigned.name}&#039;</b>:
            <br/><br/>
            <ListGroup>
              <ListGroupItem onClick={submit.bind(this, nodeBeingAssigned._id)}>is independent and duplicates the job of components below</ListGroupItem>
            </ListGroup>
            is just a different name for
            <ListGroup>
              {existingItems}
            </ListGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={cancel}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = AssignExistingCapabilityDialog;
