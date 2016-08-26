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

  submit: function(nodeBeingAssignedMapID, nodeBeingAssignedID, referenceNodeID, referenceNodemapID) {
    this.props.submitAssignDialog(nodeBeingAssignedMapID, nodeBeingAssignedID, referenceNodeID, referenceNodemapID);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },
  renderExistingItems: function(nodes) {
    var submit = this.submit;
    var result = [];
    var nodeBeingAssigned = this.props.nodeBeingAssigned;
    nodes.map(node => {
      console.log(node);
      result.push(
        <ListGroupItem onClick={submit.bind(this, nodeBeingAssigned.mapID, nodeBeingAssigned._id, node._id, node.mapID)}>
          <b>{node.name}</b>&nbsp;from map &nbsp;
          <b>{node.mapName}</b>
        </ListGroupItem>
      );
    });
    return result;
  },
  render: function() {
    console.log(this.props);
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
              Assign the component component from map
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Choose whether
            <b>&nbsp;{nodeBeingAssigned.name}&nbsp;</b>
            from map
            <b>&nbsp;{nodeBeingAssigned.mapName}</b>&nbsp; is the same as:
            <br/><br/>
            <ListGroup>
              {existingItems}
              <ListGroupItem bsStyle="danger" onClick={submit.bind(this, nodeBeingAssigned.mapID, nodeBeingAssigned._id)}>No, this is separate component</ListGroupItem>
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
