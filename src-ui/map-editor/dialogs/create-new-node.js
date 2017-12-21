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
  }

  onSuggestionsClearRequested(){
    Actions.clearSuggestions(this.props.mapId);
  }

  onSuggestionsFetchRequested(value) {
    if(value.value.length > 2){
      Actions.fetchSuggestions(this.props.mapId, value.value);
    } else {
      Actions.clearSuggestions(this.props.mapId);
    }
  }

  getSuggestionValue(suggestion){
    return suggestion.name;
  }

  jump(step){
    Actions.recordStepChange(this.props.mapId, step);
    this.props.jumpToStep(step);
  }

  renderSuggestion(suggestion, params){
    if(suggestion.type === 'info'){
      return <ListGroupItem>{suggestion.name}</ListGroupItem>;
    }
    let bsStyle = params.isHighlighted ? 'info' : null;
    if(suggestion.type === 'createnew'){
      return (<ListGroupItem onClick={this.jump.bind(this,1)} bsStyle={bsStyle}>
        Create a new component <b>{suggestion.name}</b>.
      </ListGroupItem>);
    }
    return (
      <ListGroupItem onClick={this.jump.bind(this,2)} bsStyle={bsStyle}>
        Reference existing component {suggestion.name}
      </ListGroupItem>
    );
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
    }].concat(suggestions);
  }

  renderSuggestionsContainer({ containerProps , children, query }){
      return (
        <ListGroup {... containerProps}>
          {children}
        </ListGroup>
      );
  }

  onSearchChange(event, value) {
    Actions.handleDialogChange(this.props.mapId, 'name', value.newValue);
  }

  render(){
    const inputProps = {
        placeholder: 'Type a component name',
        value : this.props.name,
        onChange: this.onSearchChange
    };
    const processedSuggestions = this.enhanceSuggestions(this.props.suggestions);
    return (<Autosuggest
                theme={{container : {width: '100%'}, input : {width: '100%'}}}
                suggestions={processedSuggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                renderSuggestionsContainer={this.renderSuggestionsContainer}
                highlightFirstSuggestion={true}
                inputProps={inputProps}
          />);
  }
}

class ReusedComponentProperties extends React.Component{
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
  }
  render(){
    return (<div>Used properties</div>);
  }
}

class NewComponentPropeties extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._enterInterceptor = this._enterInterceptor.bind(this);
  }
  _enterInterceptor(e) {
    if (e.nativeEvent.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
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

    var steps = [
        {name:'name', component: <ComponentName
                                    name={name}
                                    suggestions={suggestions}
                                    mapId={mapId}/>},
        {name:'name', component: <NewComponentPropeties
                                    responsiblePerson={responsiblePerson}
                                    inertia={inertia}
                                    constraint={constraint}
                                    description={description}
                                    mapId={mapId}/>},
        {name:'name', component: <ReusedComponentProperties/>}
    ];
    let dialogName = 'Add a new, internal component';
    let footer = null;
    if(this.state.currentStep === 1){
      dialogName = 'Add a new, internal component named \'' +  this.state.name + '\'.';
      footer = (<Modal.Footer>
        <Button type="submit" bsStyle="primary" value="Create" onClick={Actions.submitAddNewNodeDialog.bind(Actions, mapId)}>Create!</Button>
        </Modal.Footer>);
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
