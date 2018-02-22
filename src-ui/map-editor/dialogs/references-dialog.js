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
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var $ = require('jquery');
import Actions from '../single-map-actions';
import Usage from './usage';
var createReactClass = require('create-react-class');

var ReferencesDialog = createReactClass({

  getInitialState: function() {
    return {open: false};
  },

  _close: function() {
    this.setState({open: false, projects:null});
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

  renderPast: function(projects){
    if(!projects || projects.length === 0){
      return null;
    }
    let worked = [];
    let notWorked = [];
    let rejected = [];

    for(let i = 0; i < projects.length; i++){
      let proj = projects[i];
      if(proj.state === 'SUCCEEDED'){
        worked.push(proj);
      } else if(proj.state === 'FAILED'){
        notWorked.push(proj);
      } else if(proj.state === 'REJECTED'){
        rejected.push(proj);
      }
    }

    let mainResultList = [];
    if(worked.length > 0){
      mainResultList.push(<span>Following things worked in the past:</span>);
      let internalList = [];
      for(let i = 0; i <worked.length; i++){
         let entry = [];
         entry.push(worked[i].shortSummary);
         internalList.push(<li>{entry}</li>);
      }
      mainResultList.push(<ul>{internalList}</ul>);
    }
    if(notWorked.length > 0){
      mainResultList.push(<span>Following things did not work in the past:</span>);
      let internalList = [];
      for(let i = 0; i <notWorked.length; i++){
         let entry = [];
         entry.push(notWorked[i].shortSummary);
         internalList.push(<li>{entry}</li>);
      }
      mainResultList.push(<ul>{internalList}</ul>);
    }
    if(rejected.length > 0){
      mainResultList.push(<span>Following things were  not tried in the past:</span>);
      let internalList = [];
      for(let i = 0; i <rejected.length; i++){
         let entry = [];
         entry.push(rejected[i].shortSummary);
         internalList.push(<li>{entry}</li>);
      }
      mainResultList.push(<ul>{internalList}</ul>);
    }
    return mainResultList;
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

    let projects = this.state.projects;
    let past = this.renderPast(projects);
    return (
      <div>
        <Modal show={show} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>
              The node <b>&#39;{currentName}&#39;</b> usage info
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Usage node={node} workspaceID={workspaceID} variantId={variantId}/>
              {past}
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
