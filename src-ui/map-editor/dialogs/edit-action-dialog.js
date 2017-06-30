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
  Button,
  Glyphicon
} from 'react-bootstrap';
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';


var EditActionDialog = React.createClass({
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

  componentDidUpdate(oldProps, oldState){
    if(oldProps.singleMapStore.getMap().map._id !== this.props.singleMapStore.getMap().map._id){
      // map changed, pretend to remount
      oldProps.singleMapStore.removeChangeListener(this._onChange);
      this.props.singleMapStore.addChangeListener(this._onChange);
      this._onChange();
    }
  },

  internalState: {},

  _onChange: function() {
    var newState = this.props.singleMapStore.getEditActionDialogState();
    this.internalState.shortSummary = newState.shortSummary;
    this.internalState.description = newState.description;
    this.internalState.sourceId = newState.sourceId;
    this.internalState.actionId = newState.actionId;
    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditActionDialog();
  },

  _submit: function() {
      this.internalState.mapID = this.props.mapID;
      this.internalState.workspaceID = this.props.workspaceID;
      SingleMapActions.updateAction(this.props.workspaceID,
          this.props.mapID,
          this.internalState.sourceId,
          this.internalState.actionId,
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
