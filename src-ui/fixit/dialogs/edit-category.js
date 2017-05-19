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
var Constants = require('../deduplicator-constants');
import Actions from '../deduplicator-actions';
var _ = require('underscore');

var EditCategoryDialog = React.createClass({

  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
    this.internalState = {};
    this.props.fixitStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    this.props.fixitStore.removeChangeListener(this._onChange);
  },

  internalState: {},

  _onChange: function() {
    var newState = this.props.fixitStore.getEditCategoryDialogState();
    this.internalState.name = newState.name;
    this.setState(newState);
  },

  _close: function() {
    Actions.closeEditCategoryDialog();
  },

  _submit: function() {
    Actions.submitEditCategoryDialog(this.state.workspaceID, this.state.capabilityCategoryID, this.internalState.name);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    var name = this.internalState.name;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit category name
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" value={name} placeholder="Enter name" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor}/>
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

module.exports = EditCategoryDialog;
