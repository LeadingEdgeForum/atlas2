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
var Constants = require('../../constants');
import SingleMapActions from '../single-map-actions';
var createReactClass = require('create-react-class');

var EditNodeDialog = createReactClass({

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
    var newState = this.props.singleMapStore.getNodeEditDialogState();
    this.internalState = newState;
    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditNodeDialog();
    this.internalState = {};
  },

  _submit: function() {
    SingleMapActions.updateNode(this.internalState.workspaceId,
      this.internalState.mapId,
      this.internalState.nodeId,
      null, /*dialog does not change the pos*/
      null, /*nor width */
      this.internalState.name,
      this.internalState.type,
      this.internalState.responsiblePerson,
      this.internalState.inertia,
      this.internalState.description,
      this.internalState.constraint
    );
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and do not consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation();
    }
  },

  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var name = this.internalState.name;
    var type = this.internalState.type;
    var description = this.internalState.description;
    var responsiblePerson = this.internalState.responsiblePerson;
    var inertia = this.internalState.inertia;
    var constraint = this.internalState.constraint;
    if(constraint === null || constraint === undefined){
      constraint = 0;
    }
    var typeGroup = type != Constants.SUBMAP ? (<FormGroup controlId="type">
      <Col sm={2}>
        <ControlLabel>Type</ControlLabel>
      </Col>
      <Col sm={9}>
        <Radio inline checked={Constants.USERNEED === type} value={Constants.USERNEED} onChange={this._handleDialogChange.bind(this, 'type')}>User need</Radio>
        <Radio inline checked={Constants.INTERNAL === type} value={Constants.INTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Internal</Radio>
        <Radio inline checked={Constants.EXTERNAL === type} value={Constants.EXTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Outsourced</Radio>
      </Col>
    </FormGroup>) : null;

    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit node
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the component" onChange={this._handleDialogChange.bind(this, 'name')} value={name} onKeyDown={this._enterInterceptor.bind(this)}/>
                </Col>
              </FormGroup>
              {typeGroup}
              <FormGroup controlId="responsiblePerson">
                <Col sm={2}>
                  <ControlLabel>Owner</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Responsible Person" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} onKeyDown={this._enterInterceptor} value={responsiblePerson}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="inertia">
                <Col sm={2}>
                  <ControlLabel>Inertia</ControlLabel>
                </Col>
                <Col sm={9}>
                    <Radio inline checked={inertia == 0 || inertia == undefined || inertia == null} value={0} onChange={this._handleDialogChange.bind(this, 'inertia')}>None</Radio>{' '}
                    <Radio inline checked={inertia == 0.33} value={0.33} onChange={this._handleDialogChange.bind(this, 'inertia')}>Small</Radio>{' '}
                    <Radio inline checked={inertia == 0.66} value={0.66} onChange={this._handleDialogChange.bind(this, 'inertia')}>Considerable</Radio>{' '}
                    <Radio inline checked={inertia == 1} value={1} onChange={this._handleDialogChange.bind(this, 'inertia')}>Huge</Radio>
                </Col>
              </FormGroup>
              <FormGroup controlId="constraint">
                <Col sm={2}>
                  <ControlLabel>Limitation</ControlLabel>
                </Col>
                <Col sm={9}>
                    <Radio inline checked={ constraint==0 || !constraint} value={0} onChange={this._handleDialogChange.bind(this, 'constraint')}>None</Radio>{' '}
                    <Radio inline value={10} checked={constraint==10} onChange={this._handleDialogChange.bind(this, 'constraint')}>Constraint</Radio>{' '}
                    <Radio inline value={20} checked={constraint==20} onChange={this._handleDialogChange.bind(this, 'constraint')}>Barrier to entry</Radio>{' '}
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" componentClass="textarea" placeholder="Describing what the component does will help other people" onChange={this._handleDialogChange.bind(this, 'description')} onKeyDown={this._enterInterceptor} value={description}/>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Change" onClick={this._submit}>Change</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditNodeDialog;
