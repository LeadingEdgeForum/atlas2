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

var ReferencesDialog = React.createClass({
  getInitialState: function() {
    return {open: false};
  },

  _close: function() {
    Actions.closeReferencesDialog();
  },

  componentDidMount: function() {
    WorkspaceStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  _onChange: function() {
    this.setState(WorkspaceStore.getReferencesDialogState());
  },
  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentName = this.state.currentName;
    var node = this.state.node;
    var workspaceID = this.state.workspaceID;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              The node <b>&#39;{currentName}&#39;</b> usage info
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <UsageInfo node={node} workspaceID={workspaceID} alternativeNames={true} emptyInfo={true}/>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" bsStyle="primary" value="Change" onClick={this._close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = ReferencesDialog;
