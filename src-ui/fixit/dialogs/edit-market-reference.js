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
import ReactBootstrapSlider from 'react-bootstrap-slider';


var EditMarketReferenceDialog = React.createClass({

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
    var state = this.props.fixitStore.getEditMarketReferenceDialogState();
    if(!this.internalState.name){
      this.internalState = _.extend({}, state);
      this.internalState.evolution = this.internalState.evolution * 100; //slider operates on different scale
    }
    this.setState(state);
  },

  _close: function() {
    this.internalState = {};
    Actions.closeEditMarketReferenceDialog();
  },

  _submit: function() {
    Actions.submitEditMarketReferenceDialog(
      this.internalState.workspaceId,
      this.props.variantId,
      this.internalState.capability._id,
      this.internalState.marketReferenceId,
      this.internalState.name ? this.internalState.name : 'Anonymous competitor',
      this.internalState.description,
      this.internalState.evolution / 100); //slider operates 0-100, nodes have 0-1
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  render: function() {
    var show = this.state.open;
    var activityName = this.state.capability ? this.state.capability.aliases[0].nodes[0].name : null;

    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit market reference for activity <b>{activityName}</b>.
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name:</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl
                    type="textarea"
                    placeholder="Enter reference name"
                    onChange={this._handleDialogChange.bind(this, 'name')}
                    onKeyDown={this._enterInterceptor}
                    value={this.internalState.name}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="description">
                <Col sm={2}>
                  <ControlLabel>Description:</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea"
                    componentClass="textarea"
                    placeholder="Enter reference description"
                    onChange={this._handleDialogChange.bind(this, 'description')}
                    onKeyDown={this._enterInterceptor}
                    value={this.internalState.description}/>
                </Col>
              </FormGroup>
              <FormGroup controlId="evolution">
                <Col sm={2}>
                  <ControlLabel>Evolution:</ControlLabel>
                </Col>
                <Col sm={9}>
                    <div style={{width:'100%'}}>
                    <ReactBootstrapSlider
                        startValue={this.internalState.evolution}
                        value={this.internalState.evolution}
                        slideStop={this._handleDialogChange.bind(this, 'evolution')}
                        step={1}
                        formatter={function(value){
                          if(value < 25) {return 'Genesis';}
                          if(value < 50) {return 'Custom built';}
                          if(value < 75) {return 'Product or Rental';}
                          return 'Commodity or Utility';
                        }}
                        max={100}
                        min={0} /></div>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Change" onClick={this._submit}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = EditMarketReferenceDialog;
