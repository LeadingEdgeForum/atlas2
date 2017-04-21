/*jshint esversion: 6 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
import Actions from './../../../../actions.js';
import WorkspaceStore from './../../workspace-store';
import {calculateMapName} from './../map-name-calculator';
var UsageInfo = require('../deduplicator/usage-info');

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
      return <div>Loading... please wait.</div>;
    }
    if(this.state.referencingMaps.length === 0){
      return <div>Nothing else seems to be using this submap</div>;
    }
    if(this.state.referencingMaps.length === 1 && this.state.referencingMaps[0]._id === this.state.mapID){
      return <div>Nothing else seems to be using this submap</div>;
    }
    var otherMaps = [];
    for(var i = 0; i < this.state.referencingMaps.length; i++){
      if(this.state.referencingMaps[i]._id === this.state.mapID){
        continue;
      } else {
        var href = '/map/' + this.state.referencingMaps[i]._id;
        var name = calculateMapName('Unknown',this.state.referencingMaps[i].user, this.state.referencingMaps[i].purpose,this.state.referencingMaps[i].name );
        otherMaps.push(<li><a href={href}>{name}</a></li>);
      }
    }
    var message = (<div>Following maps are using this node, too:<ul>{otherMaps}</ul></div>);
    return message;
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

    return (
      <div>
        <Modal show={show} onHide={this._close} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              Usage info about submap <b>&#39;{currentName}&#39;</b>.
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              {message}
              <UsageInfo node={node} workspaceID={workspaceID} emptyInfo={false} alternativeNames={true} excludeList={this.state.referencingMaps}/>
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
