/*jshint esversion: 6 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
import Actions from '../single-map-actions';
var UsageInfo = require('../../fixit/usage-info');

var ReferencesDialog = React.createClass({

  getInitialState: function() {
    return {open: false};
  },

  _close: function() {
    Actions.closeReferencesDialog();
  },

  componentDidMount: function() {
    this.props.singleMapStore.addChangeListener(this._onChange);
  },

  componentDidUpdate(oldProps, oldState){
    if(oldProps.singleMapStore.getMap().map._id !== this.props.singleMapStore.getMap().map._id){
      // map changed, pretend to remount
      oldProps.singleMapStore.removeChangeListener(this._onChange);
      this.props.singleMapStore.addChangeListener(this._onChange);
      this._onChange();
    }
  },

  componentWillUnmount: function() {
    this.props.singleMapStore.removeChangeListener(this._onChange);
  },

  _onChange: function() {
    this.setState(this.props.singleMapStore.getReferencesDialogState());
  },

  render: function() {
    var show = this.state.open;
    if (!show) {
      return null;
    }
    var currentName = this.state.currentName;
    var node = this.state.node;
    var workspaceID = this.state.workspaceID;
    var variantId = this.state.variantId;
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              The node <b>&#39;{currentName}&#39;</b> usage info
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <UsageInfo node={node} workspaceID={workspaceID} variantId={variantId} alternativeNames={true} emptyInfo={true} showMarketReferences={true}/>
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
