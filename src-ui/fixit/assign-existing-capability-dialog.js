/*jshint esversion: 6 */

var React = require('react');
import {
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Col,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  Input,
  Modal,
  Button
} from 'react-bootstrap';
import MapLink from './maplink.js';
var createReactClass = require('create-react-class');

var AssignExistingCapabilityDialog = createReactClass({

  internalState: {},

  submit: function(nodeBeingAssignedID) { //duplicate in capability
    this.props.submitAssignDialog(nodeBeingAssignedID);
  },

  submitAlias: function(nodeBeingAssignedID, aliasID) { //duplicate in capability
    this.props.submitAssignAlias(nodeBeingAssignedID, aliasID);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
  },

  renderExistingItems: function(capability) {
    var submit = this.submitAlias;
    var result = [];
    var nodeBeingAssigned = this.props.nodeBeingAssigned; // find a a map
    capability.aliases.map(alias => {
      alias.nodes.map(node => {
        result.push(
          <ListGroupItem onClick={submit.bind(this, nodeBeingAssigned._id, alias._id)}>
            <b>&#039;{node.name}&#039;</b> from map <MapLink mapID={node.parentMap} textOnly={true}/>
          </ListGroupItem>
        );
      });
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
    var existingItems = this.renderExistingItems(this.props.capability);
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
