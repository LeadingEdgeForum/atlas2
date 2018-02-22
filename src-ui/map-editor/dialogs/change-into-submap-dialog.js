/*
 * Copyright 2017, 2018 Krzysztof Daniel.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
var Constants = require('../single-map-constants');
import SingleMapActions from '../single-map-actions';
var createReactClass = require('create-react-class');

var ChangeIntoSubmapDialog = createReactClass({

  getInitialState: function() {
    return {open: false};
  },

  componentDidMount: function() {
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

  _onChange: function() {
    this.setState(this.props.singleMapStore.getTurnIntoSubmapDialogState());
  },

  _close: function() {
    SingleMapActions.closeTurnIntoSubmapNodeDialog();
  },

  _submit: function() {
    SingleMapActions.turnIntoSubmap(this.state.workspaceId, this.state.mapId, this.state.nodeId);
  },

  renderNewSubmapDialogOnly: function(show) {
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Turn this component into submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <p> A new, empty map will be created and linked to this component. </p>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Turn into submap</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },

  renderListOfAvailableSubmaps: function() {
    var finalList = [];
    var coords = this.state.coords;
    var state = this.state;
    for (var i = 0; i < this.state.listOfAvailableSubmaps.length; i++) {
      var refID = '' + this.state.listOfAvailableSubmaps[i]._id;
      finalList.push(
        <p>
          <Button bsSize="small" block onClick={SingleMapActions.turnIntoSubmap.bind(SingleMapActions, state.workspaceId, state.mapId, state.nodeId, refID)}>{this.state.listOfAvailableSubmaps[i].name}</Button>
        </p>
      );
    }
    return finalList;
  },

  renderNewSubmapDialogWitSubmapList: function(show) {
    var finalList = this.renderListOfAvailableSubmaps();
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Turn this component into submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p> A new, empty map will be created and linked to this component. </p>
            <p> Click on any map name below to link to it instead of creating a new one.</p>
            <div className="well" style={{
              maxWidth: 400,
              margin: '0 auto 10px'
            }}>
              {finalList}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Turn into submap</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },

  render: function() {
    var show = this.state.open;
    if (!this.state.listOfAvailableSubmaps || this.state.listOfAvailableSubmaps.length === 0) {
      return this.renderNewSubmapDialogOnly(show);

    }
    return this.renderNewSubmapDialogWitSubmapList(show);
  }
});

module.exports = ChangeIntoSubmapDialog;
