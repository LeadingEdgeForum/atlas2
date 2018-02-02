/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
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
  Button
} from 'react-bootstrap';
var Glyphicon = require('react-bootstrap').Glyphicon;
var Constants = require('./single-workspace-constants');
import Actions from './single-workspace-actions';
import {calculateMapName} from './map-name-calculator';
var createReactClass = require('create-react-class');
//TODO: validation of the workspace dialog

var CreateNewMapDialog = createReactClass({
  getInitialState: function() {
    return this.props.singleWorkspaceStore.getNewMapDialogState();
  },
  componentDidMount() {
    this.props.singleWorkspaceStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount() {
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange.bind(this));
  },

  internalState: {},

  _onChange: function() {
    this.setState(this.props.singleWorkspaceStore.getNewMapDialogState());
  },

  _close: function() {
    Actions.closeNewMapDialog();
    this.internalState = {};
  },

  _submit: function() {
    this.internalState.workspaceID = this.props.workspaceID;
    Actions.submitNewMapDialog(this.internalState);
    this.internalState = {};
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  _summary: function() {
    return calculateMapName("Create a new map", this.internalState.name, false);
  },

  render: function() {
    var show = this.state.open;
    var summary = this._summary();
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              {summary}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter map name" onChange={this._handleDialogChange.bind(this, 'name')}/>
                  <HelpBlock>What name would reflect the goal of your map?</HelpBlock>
                </Col>
              </FormGroup>
              <FormGroup controlId="responsiblePerson">
                <Col sm={2}>
                  <ControlLabel>Responsible Person</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')}/>
                  <HelpBlock>Who will be held responsible for this map?</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create a new map</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
});

module.exports = CreateNewMapDialog;
