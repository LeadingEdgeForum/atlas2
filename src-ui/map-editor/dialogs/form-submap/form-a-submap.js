/* Copyright 2017  Krzysztof Daniel.
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

import React from 'react';
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
  Glyphicon,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import Autosuggest from 'react-autosuggest';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import Actions from './form-a-submap-actions';
import MapLink from '../../../fixit/maplink';
import Usage from '../usage';

class ImpactAnalysis extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._place = this._place.bind(this);
    this._calculateResultMessage = this._calculateResultMessage.bind(this);
  }

  _place(dependenciesMode) {
    Actions.referenceExistingNode(this.props.mapId, this.props.nodeId, this.props.visibility, dependenciesMode);
  }
  _calculateResultMessage(impact){

    let messages = [];

    /* Analyse what will require that submap */
    if(impact.nodesThatDependOnFutureSubmap.length === 0){

      // nothing requires, hurray.
      messages.push(<ListGroupItem>Nothing will depend on this submap.</ListGroupItem>);

    } else {

      // let's iterate over all nodes that will depend on a newly formed submap
      // and get their parent maps. The list of unique maps is the list of affected
      // maps, and the user should inspect them all.
      let affectedMaps = [];
      for(let i = 0; i < impact.nodesThatDependOnFutureSubmap.length; i++){
        for(let j = 0; j < impact.nodesThatDependOnFutureSubmap[i].parentMap.length;  j++) {

          // we are interested in maps that were not previously included and are not current map
          let analysedMap = impact.nodesThatDependOnFutureSubmap[i].parentMap[j];
          if(!(affectedMaps.includes(analysedMap) || (analysedMap  === this.props.mapId))){
            affectedMaps.push(analysedMap);
          }
        }
      }

      if(!affectedMaps.length){

        // this means only current map is affected.
        messages.push(<ListGroupItem>Only this map will depend on a submap.</ListGroupItem>);


      } else {

        // once we have the list of maps, let's construct a message
        let message = [];
        for(let i = 0; i < affectedMaps.length - 1; i++){
          message.push(" ");
          message.push(<MapLink mapID={affectedMaps[i]}/>);
          message.push(", ");
        }

        message.push(<MapLink mapID={affectedMaps[affectedMaps.length - 1]}/>);


        messages.push(<ListGroupItem>This submap will also appear on following map(s) {message}.</ListGroupItem>);
      }

    }

    /* What will be sumbap clean dependencies */
    if(impact.outgoingDependencies.length === 0){
      messages.push(<ListGroupItem>This submap will not depend on anything.</ListGroupItem>);
    } else {
      let affectedMaps = [];
      for(let i = 0; i < impact.outgoingDependencies.length; i++){
        for(let j = 0; j < impact.outgoingDependencies[i].deps.length;  j++) {
          if(!affectedMaps.includes[impact.outgoingDependencies[i].deps[j].target]){
            affectedMaps.push(impact.outgoingDependencies[i].deps[j].target);
          }
        }
      }
      //WTF is that?
      let message = "";
      for(let i = 0; i < affectedMaps.length - 1; i++){
        message += ' ' + affectedMaps[i] + ',';
      }
      message += affectedMaps[affectedMaps.length - 1];
      messages.push(<ListGroupItem>The submap will depends on following nodes: {message}.</ListGroupItem>);
    }

    // display messages
    return (<ListGroup>{messages}</ListGroup>);
  }
  render() {
    let impact = this.props.impact;
    //inSubmapDependencies
    if (impact.outgoingDependencies.length === 0 &&
      impact.outgoingDanglingDependencies.length === 0 &&
      impact.nodesThatDependOnFutureSubmap.length === 0) {
      return "Forming a map from your " + this.props.nodes.length + " selected nodes have no impact on any map other than this one.";
    }
    return this._calculateResultMessage(this.props.impact);
  }
}

class NameInput extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._enterInterceptor = this._enterInterceptor.bind(this);
    this._handleDialogChange = this._handleDialogChange.bind(this);
  }
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  _handleDialogChange(parameterName, event) {
    Actions.handleDialogChange(this.props.mapId, parameterName, event.target.value);
  }
  render(){
    let name = this.props.name;
    let responsiblePerson = this.props.responsiblePerson;
    return (<Form horizontal>
      <FormGroup controlId="name">
        <Col sm={2}>
          <ControlLabel>Name</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="text" placeholder="Enter name of the submap" onChange={this._handleDialogChange.bind(this, 'name')} onKeyDown={this._enterInterceptor} value={name}/>
        </Col>
      </FormGroup>

      <FormGroup controlId="responsiblePerson">
        <Col sm={2}>
          <ControlLabel>Responsible Person</ControlLabel>
        </Col>
        <Col sm={9}>
          <FormControl type="textarea" placeholder="Enter this person's email" onChange={this._handleDialogChange.bind(this, 'responsiblePerson')} onKeyDown={this._enterInterceptor} value={responsiblePerson}/>
          <HelpBlock>Who will be held responsible for this map?</HelpBlock>
        </Col>
      </FormGroup>
    </Form>);
  }
}

export default class FormASubmapDialog extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._close = this._close.bind(this);
    this._continue = this._continue.bind(this);
    this._submit = this._submit.bind(this);
    this._storeChangeListener = this._storeChangeListener.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.state = this.props.store.getState();
  }

  componentDidMount() {
    this.props.store.addChangeListener(this._storeChangeListener);
  }

  componentWillUnmount() {
    this.props.store.removeChangeListener(this._storeChangeListener);
  }

  _storeChangeListener() {
    this.setState(this.props.store.getState());
  }

  _close() {
    Actions.closeFormASubmapDialog(this.state.mapId);
  }

  _submit() {
    Actions.submitFormASubmapDialog(this.state.mapId);
  }

  _continue(){
    Actions.nextDialogStep(this.state.mapId);
  }

  render(){
    const show = this.state.open;
    const loading = this.state.loading;

    if(loading){
      return (<Modal show={show} onHide={this._close}>
        <Modal.Header closeButton>
          <Modal.Title>
            Analysing impact
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sit tight...
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" bsStyle="primary" value="Close" onClick={this._close}>Close</Button>
          </Modal.Footer>)
      </Modal>);
    }

    let impact = this.state.impact;
    let nodes = this.state.nodes;
    let currentStep = this.state.currentStep;
    let currentComponent = currentStep === 0 ?
            (<ImpactAnalysis impact={impact} nodes={nodes} mapId={this.state.mapId}/>) :
            (<NameInput mapId={this.state.mapId} name={this.state.name} responsiblePerson={this.state.responsiblePerson}/>);
    let footerButton = currentStep ? (<Button type="submit" bsStyle="primary" value="Create" onClick={this._submit}>Create</Button>)
    : (<Button type="submit" bsStyle="primary" value="Continue" onClick={this._continue}>Continue...</Button>);
    return (<Modal show={show} onHide={this._close}>
      <Modal.Header closeButton>
        <Modal.Title>
          Form a submap
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentComponent}
      </Modal.Body>
      <Modal.Footer>
          {footerButton}
      </Modal.Footer>
    </Modal>);
  }

}
