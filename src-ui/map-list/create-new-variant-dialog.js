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

var CreateNewVariantDialog = React.createClass({
  getInitialState: function() {
    return this.props.singleWorkspaceStore.getNewVariantDialogState();
  },
  componentDidMount() {
    this.props.singleWorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  internalState: {},

  _onChange: function() {
    this.setState(this.props.singleWorkspaceStore.getNewVariantDialogState());
  },

  _close: function() {
    Actions.closeNewVariantDialog();
    this.internalState = {};
  },

  _submit: function() {
    this.internalState.workspaceID = this.props.workspaceID;
    this.internalState.sourceTimeSliceId = this.state.sourceTimeSliceId;
    Actions.submitNewVariantDialog(this.internalState.sourceTimeSliceId, this.internalState.name, this.internalState.description);
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new variant for your workspace
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter variant name" onChange={this._handleDialogChange.bind(this, 'name')}/>
                  <HelpBlock>A short text to identify your variant</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter variant description" onChange={this._handleDialogChange.bind(this, 'description')}/>
                  <HelpBlock>Longer description</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create a new variant</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewVariantDialog;
