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
import StepZilla from 'react-stepzilla';
import Autosuggest from 'react-autosuggest';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import Actions from './create-new-node-actions';

class ComponentName extends React.Component{
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this.renderSuggestionsContainer = this.renderSuggestionsContainer.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.getSuggestionValue = this.getSuggestionValue.bind(this);
    this.renderSuggestion = this.renderSuggestion.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.renderSuggestionsContainer = this.renderSuggestionsContainer.bind(this);
    this.enhanceSuggestions = this.enhanceSuggestions.bind(this);
    this.jump = this.jump.bind(this);
    this.referenceASubmapAndCloseDialog = this.referenceASubmapAndCloseDialog.bind(this);
  }

  onSuggestionsClearRequested(){
    Actions.clearSuggestions(this.props.mapId);
  }

  onSuggestionsFetchRequested(value) {
    if(value.value.length > 2){
      Actions.fetchSuggestions(this.props.mapId, value.value, (this.state || {}).type);
    } else {
      Actions.clearSuggestions(this.props.mapId);
    }
  }

  getSuggestionValue(suggestion){
    return suggestion.name;
  }

  jump(step, selectedNodeId, selectedNodeName){
    Actions.recordStepChange(this.props.mapId, step, selectedNodeId, selectedNodeName);
    this.props.jumpToStep(step);
  }

  referenceASubmapAndCloseDialog(mapId, submapId, evolution, visibility){
    Actions.referenceASubmapAndCloseDialog(mapId, submapId, evolution, visibility);
  }

  renderSuggestion(suggestion, params){
    if(suggestion.type === 'info'){
      return <div>{suggestion.name}</div>;
    }
    let bsStyle = params.isHighlighted ? 'info' : null;
    let bsWarnStyle = params.isHighlighted ? 'warning' : null;
    if(suggestion.type === 'createnew'){
      return (<Button onClick={this.jump.bind(this,1, null, null)} bsStyle={bsStyle} style={{width:'100%', textAlign:'left'}}>
        Create a new component <b>{suggestion.name}</b>.
      </Button>);
    }
    if(suggestion.type === 'node'){
      return (
        <span>
        <Button onClick={this.jump.bind(this,2, suggestion._id, null)} bsStyle={bsStyle} style={{width:'80%', textAlign:'left'}}>
          Reference existing component <b>{suggestion.name}</b>.
        </Button>
        <Button onClick={this.jump.bind(this,1, suggestion._id, suggestion.name)} bsStyle={bsWarnStyle} style={{width:'20%', right:0}} class="float-right">
          Duplicate it...
        </Button>
        </span>
      );
    }
    if(suggestion.type === 'submap'){
      return (
        <Button onClick={this.referenceASubmapAndCloseDialog.bind(this, this.props.mapId, suggestion._id, this.props.evolution, this.props.visibility)} bsStyle={bsStyle} style={{width:'100%', textAlign:'left'}}>
          Reference existing submap {suggestion.name}
        </Button>
      );
    }

  }

  enhanceSuggestions(suggestions){
    if(!this.props.name || this.props.name.length < 3){
      return [{
        name: 'At least 3 characters are required.',
        type: 'info'
      }];
    }
    return [{
      name: this.props.name,
      type: 'createnew'
    }]
    .concat(suggestions.nodes.map(node => {return {type: 'node', _id : node._id, name: node.name, node:node};}))
    .concat(suggestions.submaps.map(submap => {return {type: 'submap', _id : submap._id, name: submap.name, submap:submap};}));
  }

  renderSuggestionsContainer({ containerProps , children, query }){
      return (
        <div {... containerProps}>
          {children}
        </div>
      );
  }

  onSearchChange(event, value) {
    Actions.handleDialogChange(this.props.mapId, 'name', value.newValue);
  }

  render(){
    const inputProps = {
        placeholder: 'Type a component name',
        value : this.props.name,
        onChange: this.onSearchChange,
        autoFocus: true
    };
    const theme = {
      container: 'autosuggest',
      input: 'form-control',
      suggestionsList: 'list-group',
      suggestion: 'list-group-item',
      suggestionFocused: 'active',
    };
    const processedSuggestions = this.enhanceSuggestions(this.props.suggestions);
    return (<Autosuggest
                theme={theme}
                suggestions={processedSuggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                renderSuggestionsContainer={this.renderSuggestionsContainer}
                inputProps={inputProps}
          />);
  }
}

class ReusedComponentProperties extends React.Component{
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._place = this._place.bind(this);
  }

  _place(dependenciesMode){
    Actions.referenceExistingNode(this.props.mapId, this.props.nodeId, this.props.visibility, dependenciesMode);
  }
  render(){
    const place0 = this._place.bind(this,0);
    const place1 = this._place.bind(this,1);
    const place2 = this._place.bind(this,2);
    return (
      <ListGroup>
        <ListGroupItem onClick={place0}>Reference the component, do not include dependencies</ListGroupItem>
        <ListGroupItem onClick={place1}>Reference the component and first level dependencies</ListGroupItem>
        <ListGroupItem onClick={place2}>Reference the component and all dependencies (careful!)</ListGroupItem>
      </ListGroup>
    );
  }
}

class NewComponentProperties extends React.Component {
    constructor(props) {
        super(props);
        this.render = this.render.bind(this);
        this._enterInterceptor = this._enterInterceptor.bind(this);
        this.renderComponentStatus = this.renderComponentStatus.bind(this);
    }
    _enterInterceptor(e) {
        if (e.nativeEvent.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    renderComponentStatus(type, status, onChange){
        return <FormGroup controlId="status">
            <Col sm={2}>
                <ControlLabel>Status</ControlLabel>
            </Col>
            <Col sm={9}>
                <Radio inline value={'EXISTING'} checked={ status=== 'EXISTING' || !status}  onChange={onChange}>Exists</Radio>{' '}
                <Radio inline value={'PROPOSED'} checked={status=== 'PROPOSED'} onChange={onChange}>Proposed</Radio>{' '}
                <Radio inline value={'SCHEDULED_FOR_DELETION'} checked={status==='SCHEDULED_FOR_DELETION'} onChange={onChange}>For deletion</Radio>{' '}
            </Col>
        </FormGroup>;
    }

    render(){
        let responsiblePerson = this.props.responsiblePerson;
        let inertia = this.props.inertia;
        let constraint = this.props.constraint;
        if (constraint === null || constraint === undefined) {
            constraint = 0;
        }
        let description = this.props.description;

        let responsiblePersonUpdate = Actions.handleDialogChange.bind(Actions, this.props.mapId, 'responsiblePerson');
        let inertiaUpdate = Actions.handleDialogChange.bind(Actions, this.props.mapId, 'inertia');
        let constraintUpdate = Actions.handleDialogChange.bind(Actions, this.props.mapId, 'constraint');
        let descriptionUpdate = Actions.handleDialogChange.bind(Actions, this.props.mapId, 'description');

        let statusUpdate = Actions.handleDialogChange.bind(Actions, this.props.mapId, 'status');
        let status = this.props.status;
        let type = this.props.type;
        let statusGroup = this.renderComponentStatus(type, status, statusUpdate);
        return (
            <Form horizontal>
                <FormGroup controlId="description">
                    <Col sm={2}>
                        <ControlLabel>Description</ControlLabel>
                    </Col>
                    <Col sm={9}>
                        <FormControl type="textarea" componentClass="textarea" value={description} placeholder="Describing what the component does will help other people" onChange={descriptionUpdate} onKeyDown={this._enterInterceptor}/>
                    </Col>
                </FormGroup>
                <FormGroup controlId="responsiblePerson">
                    <Col sm={2}>
                        <ControlLabel>Owner</ControlLabel>
                    </Col>
                    <Col sm={9}>
                        <FormControl type="text" placeholder="Responsible Person" value={responsiblePerson} onChange={responsiblePersonUpdate} onKeyDown={this._enterInterceptor}/>
                    </Col>
                </FormGroup>
                <FormGroup controlId="inertia">
                    <Col sm={2}>
                        <ControlLabel>Inertia</ControlLabel>
                    </Col>
                    <Col sm={9}>
                        <Radio inline checked={ inertia==0 || !inertia} value={0} onChange={inertiaUpdate}>None</Radio>{' '}
                        <Radio inline value={0.33} checked={inertia==0.33} onChange={inertiaUpdate}>Small</Radio>{' '}
                        <Radio inline value={0.66} checked={inertia==0.66} onChange={inertiaUpdate}>Considerable</Radio>{' '}
                        <Radio inline value={1} checked={inertia==1} onChange={inertiaUpdate}>Huge</Radio>
                    </Col>
                </FormGroup>
                <FormGroup controlId="constraint">
                    <Col sm={2}>
                        <ControlLabel>Limitation</ControlLabel>
                    </Col>
                    <Col sm={9}>
                        <Radio inline checked={ constraint==0 || !constraint} value={0} onChange={constraintUpdate}>None</Radio>{' '}
                        <Radio inline value={10} checked={constraint==10} onChange={constraintUpdate}>Constraint</Radio>{' '}
                        <Radio inline value={20} checked={constraint==20} onChange={constraintUpdate}>Barrier to entry</Radio>{' '}
                    </Col>
                </FormGroup>
                {statusGroup}
            </Form>
        );
    }
}

export default class NewNodeDialog extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._close = this._close.bind(this);
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
    Actions.closeAddNodeDialog(this.props.store.getState().mapId);
  }

  render(){
    const show = this.state.open;
    const suggestions = this.state.suggestions;
    const mapId = this.state.mapId;
    const name = this.state.name;

    const responsiblePerson = this.state.responsiblePerson;
    const inertia = this.state.inertia;
    const constraint = this.state.constraint;
    const description = this.state.description;

    const nodeId = this.state.nodeId;

    const visibility = (this.state.coords || {}).y;
    const evolution = (this.state.coords || {}).x;

    const status = this.state.status;

    let type = this.state.type;

    var steps = [
        {name:'name', component: <ComponentName
                                    name={name}
                                    suggestions={suggestions}
                                    mapId={mapId}
                                    evolution={evolution}
                                    visibility={visibility}/>},
        {name:'name', component: <NewComponentProperties
                                    responsiblePerson={responsiblePerson}
                                    inertia={inertia}
                                    constraint={constraint}
                                    description={description}
                                    mapId={mapId}
                                    nodeId={nodeId}
                                    status={status}
                                    type={type}/>},
        {name:'name', component: <ReusedComponentProperties
                                    mapId={mapId}
                                    nodeId={nodeId}
                                    visibility={visibility}/>}
    ];
    let componentType = null;
    if(this.state.type === "INTERNAL"){
      componentType = "internal component";
    } else if (this.state.type === "EXTERNAL"){
      componentType = "external component";
    } else if(this.state.type === "USERNEED"){
      componentType = "user need";
    } else if(this.state.type === "USER"){
      componentType = "user";
    }else if(this.state.type === "SUBMAP"){
      componentType = "submap";
    }
    let dialogName = 'Add a new ' + componentType;
    let footer = null;
    if(this.state.currentStep === 1){
      if(this.state.nodeId){// if node id is SET for new component, it means we are introduced a duplicate (different component that does the same)
        dialogName = 'Duplicate component \'' +  this.state.selectedNodeName + '\'.';
        footer = (<Modal.Footer>
          <Button type="submit" bsStyle="primary" value="Duplicate" onClick={Actions.duplicateExistingNode.bind(Actions, mapId, this.state.nodeId)}>Duplicate!</Button>
          </Modal.Footer>);
      } else {
        dialogName = 'Add a new, ' + componentType + ' component named \'' +  this.state.name + '\'.';
        footer = (<Modal.Footer>
          <Button type="submit" bsStyle="primary" value="Create" onClick={Actions.submitAddNewNodeDialog.bind(Actions, mapId)}>Create!</Button>
          </Modal.Footer>);
      }
    }
    if(this.state.currentStep === 2){
      dialogName = 'Reference existing component named \'' +  this.state.name + '\'.';
    }

    return (<Modal show={show} onHide={this._close}>
      <Modal.Header closeButton>
        <Modal.Title>
          {dialogName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <StepZilla
          steps={steps}
          showSteps={false}
          showNavigation={false}
          preventEnterSubmission={true}
        />
      </Modal.Body>
      {footer}
    </Modal>);
  }

}
