/*
 * Copyright 2017,2018 Krzysztof Daniel.
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

var CreateNewSubmapDialog = createReactClass({

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
    this.internalState = this.props.singleMapStore.getNewSubmapDialogState();
    this.setState(this.internalState);
  },

  _close: function() {
    SingleMapActions.closeAddSubmapDialog();
  },

  _submit: function() {
    SingleMapActions.submitAddSubmapDialog(this.internalState);
  },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and do not consider it to be 'submit'
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  },

  renderNewSubmapDialogOnly: function(show) {
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              Create a new submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor}/>
                </Col>
              </FormGroup>

              <FormGroup controlId="responsiblePerson">
                <Col sm={2}>
                  <ControlLabel>Responsible Person</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} onKeyDown={this._enterInterceptor}/>
                  <HelpBlock>Who will be held responsible for this map?</HelpBlock>
                </Col>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },

  renderListOfAvailableSubmaps: function() {
    var finalList = [];
    var coords = this.state.coords;
    for (var i = 0; i < this.state.listOfAvailableSubmaps.length; i++) {
      var refID = '' + this.state.listOfAvailableSubmaps[i]._id;
      finalList.push(
        <p>
          <Button bsSize="small" block onClick={SingleMapActions.createReferencedSubmap.bind(SingleMapActions, refID, coords)}>{this.state.listOfAvailableSubmaps[i].name}</Button>
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
              Create a new submap
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Type a name or reference an existing submap.</p>
            <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>Name</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor.bind(this)}/>
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
            <div className="well" style={{
              maxWidth: 400,
              margin: '0 auto 10px'
            }}>
              {finalList}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="reset" onClick={this._close}>Cancel</Button>
            <Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>
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

module.exports = CreateNewSubmapDialog;
