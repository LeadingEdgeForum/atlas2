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

import $ from "jquery";

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
var Constants = require('../../constants');
import SingleMapActions from '../single-map-actions';
var createReactClass = require('create-react-class');

var EditNodeDialog = createReactClass({

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
    const newState = this.props.singleMapStore.getNodeEditDialogState();
    this.internalState = newState;
    this.setState(newState);
  },

  _close: function() {
    SingleMapActions.closeEditNodeDialog();
    this.internalState = {};
  },

  _submit: function() {
    SingleMapActions.updateNode(this.internalState.workspaceId,
      this.internalState.mapId,
      this.internalState.nodeId,
      null, /*dialog does not change the pos*/
      null, /*nor width */
      this.internalState.name,
      this.internalState.type,
      this.internalState.responsiblePerson,
      this.internalState.inertia,
      this.internalState.description,
      this.internalState.constraint
    );
    this.internalState = {};
  },

    _proposeNodeRemoval: function(){
      let data = {}; //TODO: should we get anything here?
        $.ajax({
            type: 'POST',
            url: '/api/workspace/' + this.internalState.workspaceId + '/map/' + this.internalState.mapId + '/node/' + this.internalState.nodeId + '/effort/' + 'REMOVAL_PROPOSAL',
            data:data,
            success: function(data) {
                SingleMapActions.closeEditNodeDialog();
                this.props.singleMapStore.updateMap(this.internalState.mapId, data);
                this.internalState = {};
            }.bind(this)
        });
    },

  _handleDialogChange: function(parameterName, event) {
    this.internalState[parameterName] = event.target.value;
    this.forceUpdate();
  },

  // catch enter and do not consider it to be 'submit'
  _enterInterceptor(e){
    if(e.nativeEvent.keyCode===13){
        e.preventDefault();
        e.stopPropagation();
    }
  },

    renderProposeRemovalButton(){
      let shouldDisplayButton = false;
      let node = this.state.node;
      console.log(node);
      if(!node) {
          return null;
      }

      if(this.state.node.status === 'EXISTING'){
          let foundRemoveAction = false;
          for(let i = 0; i < node.actions.length; i++){
              if(node.actions[i].type ==='REMOVAL_PROPOSAL' &&
                  (node.actions[i].state === 'PROPOSED' || node.actions[i].state === 'EXECUTING')){
                  foundRemoveAction = true;
              }
          }
          if(!foundRemoveAction){
              shouldDisplayButton = true;
          }
      }

      if(shouldDisplayButton) {
          return <Button type="reset" bsStyle="warning" onClick={this._proposeNodeRemoval}>Propose removing node</Button>;
      } else {
          return null;
      }
    },

    renderTypeGroup(type){
        return type != Constants.SUBMAP ?
            (<FormGroup controlId="type">
                <Col sm={2}>
                    <ControlLabel>Type</ControlLabel>
                </Col>
                <Col sm={9}>
                    <Radio inline checked={Constants.USERNEED === type} value={Constants.USERNEED} onChange={this._handleDialogChange.bind(this, 'type')}>User need</Radio>
                    <Radio inline checked={Constants.INTERNAL === type} value={Constants.INTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Internal</Radio>
                    <Radio inline checked={Constants.EXTERNAL === type} value={Constants.EXTERNAL} onChange={this._handleDialogChange.bind(this, 'type')}>Outsourced</Radio>
                </Col>
            </FormGroup>) : null;
    },

    render: function() {
        var show = this.state.open;
        if (!show) {
            return null;
        }
        const name = this.internalState.name;
        const type = this.internalState.type;
        const description = this.internalState.description;
        const responsiblePerson = this.internalState.responsiblePerson;
        const inertia = this.internalState.inertia;
        let constraint = this.internalState.constraint;
        if(constraint === null || constraint === undefined){
            constraint = 0;
        }
        const typeGroup = this.renderTypeGroup(type);
        const proposeRemovalButton = this.renderProposeRemovalButton();

        // noinspection EqualityComparisonWithCoercionJS
        return (
            <div>
                <Modal show={show} onHide={this._close}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Edit node
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup controlId="name">
                                <Col sm={2}>
                                    <ControlLabel>Name</ControlLabel>
                                </Col>
                                <Col sm={9}>
                                    <FormControl type="text" placeholder="Enter name of the component" onChange={this._handleDialogChange.bind(this, 'name')} value={name} onKeyDown={this._enterInterceptor.bind(this)}/>
                                </Col>
                            </FormGroup>
                            {typeGroup}
                            <FormGroup controlId="responsiblePerson">
                                <Col sm={2}>
                                    <ControlLabel>Owner</ControlLabel>
                                </Col>
                                <Col sm={9}>
                                    <FormControl type="text" placeholder="Responsible Person" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} onKeyDown={this._enterInterceptor} value={responsiblePerson}/>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="inertia">
                                <Col sm={2}>
                                    <ControlLabel>Inertia</ControlLabel>
                                </Col>
                                <Col sm={9}>
                                    <Radio inline checked={inertia == 0 || inertia == undefined || inertia == null} value={0} onChange={this._handleDialogChange.bind(this, 'inertia')}>None</Radio>{' '}
                                    <Radio inline checked={inertia == 0.33} value={0.33} onChange={this._handleDialogChange.bind(this, 'inertia')}>Small</Radio>{' '}
                                    <Radio inline checked={inertia == 0.66} value={0.66} onChange={this._handleDialogChange.bind(this, 'inertia')}>Considerable</Radio>{' '}
                                    <Radio inline checked={inertia == 1} value={1} onChange={this._handleDialogChange.bind(this, 'inertia')}>Huge</Radio>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="constraint">
                                <Col sm={2}>
                                    <ControlLabel>Limitation</ControlLabel>
                                </Col>
                                <Col sm={9}>
                                    <Radio inline checked={ constraint==0 || !constraint} value={0} onChange={this._handleDialogChange.bind(this, 'constraint')}>None</Radio>{' '}
                                    <Radio inline value={10} checked={constraint==10} onChange={this._handleDialogChange.bind(this, 'constraint')}>Constraint</Radio>{' '}
                                    <Radio inline value={20} checked={constraint==20} onChange={this._handleDialogChange.bind(this, 'constraint')}>Barrier to entry</Radio>{' '}
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="description">
                                <Col sm={2}>
                                    <ControlLabel>Description</ControlLabel>
                                </Col>
                                <Col sm={9}>
                                    <FormControl type="textarea" componentClass="textarea" placeholder="Describing what the component does will help other people" onChange={this._handleDialogChange.bind(this, 'description')} onKeyDown={this._enterInterceptor} value={description}/>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        {proposeRemovalButton}
                        <Button type="reset" onClick={this._close}>Cancel</Button>
                        <Button type="submit" bsStyle="primary" value="Change" onClick={this._submit}>Change</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
});

module.exports = EditNodeDialog;
