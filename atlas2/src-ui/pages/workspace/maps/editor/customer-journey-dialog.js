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
import Transition from './journey/transition';

var journeyStyle = {
  color:'silver',
  maxWidth : 200,
}
var CustomerJourneyEditDialog = React.createClass({
  getInitialState: function() {
    return {open:false, steps:[]};
  },

  componentDidMount: function() {
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  _onChange: function() {
    this.setState(WorkspaceStore.isMapEditCustomerJourneyOpen());
  },

  _close : function(){
    Actions.closeEditCustomerJourneyDialog();
  },

  renderStep : function(step) {
    var renderedStep = [];
    renderedStep.push(step.name);
    if(step.interaction){
      renderedStep.push(<Glyphicon glyph="flash"/>)
    }
    return <span>{renderedStep}</span>;
  },

  renderChain : function(){
    var chain = [];
    chain.push(<span style={journeyStyle}><Glyphicon glyph="home"/> Start</span>);
    chain.push(" ");
    chain.push(<Transition counter={0}/>);
    chain.push(" ");
    for(var i = 0; i< this.state.steps.length; i++){
      chain.push(this.renderStep(this.state.steps[i]));
      chain.push(" ");
      chain.push(<Transition counter={i+1}/>);
      chain.push(" ");
    }
    chain.push(" ");
    chain.push(<span style={journeyStyle}><Glyphicon glyph="flag"/> End</span>);
    return chain;
  },
  render() {
    var show = this.state.open;
    var chain = this.renderChain();
    return (
      <div>
        <Modal show={show} onHide={this._close} bsSize="large">
          <Modal.Header closeButton>
            <Modal.Title>
              User Journey
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {chain}
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" bsStyle="primary" value="Save" onClick={this._close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});
module.exports = CustomerJourneyEditDialog;
