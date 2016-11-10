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
  Radio
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
var $ = require('jquery');
var _ = require('underscore');
var browserHistory = require('react-router').browserHistory;
import WorkspaceStore from './../../workspace-store';
import {calculateMapName} from './../map-name-calculator';
var WMPopover = require('../deduplicator/wm-popover');

//TODO: validation of the workspace dialog

var SubmapReferencesDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  _close: function() {
    Actions.closeSubmapReferencesDialog();
  },

  componentDidMount: function() {
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  _onChange: function() {
    this.setState(WorkspaceStore.getSubmapReferencesDialogState());
  },
  constructMessage : function(){
    if(!this.state.referencingMaps){
      return 'Loading... please wait.'
    }
    if(this.state.referencingMaps.length === 0){
      return 'No map uses this submap';
    }
    if(this.state.referencingMaps.length === 1 && this.state.referencingMaps[0]._id === this.state.mapID){
      return 'No other map uses this submap';
    }
    var otherMaps = [];
    for(var i = 0; i < this.state.referencingMaps.length; i++){
      if(this.state.referencingMaps[i]._id === this.state.mapID){
        continue;
      } else {
        var href = '/map/' + this.state.referencingMaps[i]._id;
        var name = calculateMapName('Unknown',this.state.referencingMaps[i].user, this.state.referencingMaps[i].purpose,this.state.referencingMaps[i].name );
        otherMaps.push(<p><a href={href}>{name}</a></p>);
      }
    }
    return otherMaps;
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentName = this.state.currentName;
    var node = this.state.node;
    var workspaceID = this.state.workspaceID;
    var message = this.constructMessage();
    console.log(node, workspaceID);
    return (
      <div>
        <Modal show={show} onHide={this._close} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              Other maps using submap <b>&#39;{currentName}&#39;</b>.
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <div>
              {message}
              </div>
              Additionally:
              <div>
              <WMPopover node={node} workspaceID={workspaceID}/>
              </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" bsStyle="primary" value="Change" onClick={this._close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = SubmapReferencesDialog;
