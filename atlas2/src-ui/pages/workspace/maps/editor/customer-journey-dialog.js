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
import Step from './journey/step';

var journeyStyle = {
  color:'silver',
  width:'100%',
  textAlign: 'center'
}
var CustomerJourneyEditDialog = React.createClass({
  getInitialState: function() {
    return {open:false};
  },

  //crappy hack. I need to rething how maps are loaded and propagated
  componentWillReceiveProps: function(nextProps){
    if(this.props.loading && !nextProps.loading){
      if(nextProps.steps.length === 0){
        Actions.openEditCustomerJourneyDialog(nextProps.mapID);
      }
    }
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

  //TODO: extract this, handle rename (sync with node) and delete (sync with node, too)

  renderChain : function(){
    var chain = [];
    chain.push(<div style={journeyStyle}><Glyphicon glyph="home"/> Start</div>);
    chain.push(<Transition counter={0} mapID={this.props.mapID}/>);
    for(var i = 0; i< this.props.steps.length; i++){
      chain.push(<Step step={this.props.steps[i]} position={i} mapID={this.props.mapID}/>);
      chain.push(<Transition counter={i+1} mapID={this.props.mapID}/>);
    }
    chain.push(<div style={journeyStyle}><Glyphicon glyph="flag"/> End</div>);
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
