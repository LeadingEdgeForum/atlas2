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
import MapLink from '../../fixit/maplink';
import NodeLink from '../nodelink';

var LinkContainer = require('react-router-bootstrap').LinkContainer;

export default class Usage extends React.Component{
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this.calculateUsageMessage = this.calculateUsageMessage.bind(this);
    this.calculateSubmapMessage = this.calculateSubmapMessage.bind(this);
    this.calculateOwnerMessage = this.calculateOwnerMessage.bind(this);
    this.calculateDependencyMessage = this.calculateDependencyMessage.bind(this);
  }

  calculateOwnerMessage(listOfMessages, node){
    if(!node.responsiblePerson){
      listOfMessages.push(<li>Nobody seems to be responsible for this component.</li>);
    } else {
      listOfMessages.push(<li>{node.responsiblePerson} is responsible for this component.</li>);
    }
  }

  calculateUsageMessage(listOfMessages, node){
    if(node.parentMap.length === 1){
      listOfMessages.push(<li>This node is used on this map only.</li>);
    }
    if(node.parentMap.length === 2){
      let length = node.parentMap.length;
      let listOfMaps = [];
      for(let i = 0; i < length - 1; i++){
        listOfMaps.push(<MapLink mapID={node.parentMap[i]}/>);
        listOfMaps.push(", ");
      }
      listOfMaps.push(<MapLink mapID={node.parentMap[length - 1]}/>);

      listOfMessages.push(<li>This node is used on {length} maps: {listOfMaps}.</li>);
    }
  }

  calculateSubmapMessage(listOfMessages, node){
    if(!node.submapID){
      listOfMessages.push(<li>This node has no submap attached.</li>);
    } else {
      listOfMessages.push(<li>This node has a submap attached:  <MapLink mapID={node.submapID}/>. </li>);
    }
  }

  calculateDependencyMessage(listOfMessages, node){
    if(node.parentMap.length === 1){
      // dependencies cannot be messed on one map only
      return;
    }
    let length = node.dependencies.length;
    let analysisResult = {};
    for(let i = 0; i < length; i++){
      analysisResult[node.dependencies[i].target] = node.parentMap.slice(0); //clone all available maps
      analysisResult[node.dependencies[i].target] = analysisResult[node.dependencies[i].target].filter(function(mapId){ //jshint ignore:line
        let present = false;
        for(let j = 0; j < node.dependencies[i].visibleOn.length;j++){
          if(mapId === node.dependencies[i].visibleOn[j]){
            present = true;
          }
        }
        return !present;
      });
    }
    let count = 0;
    let details = [];
    Object.keys(analysisResult).forEach(function(key) {
      if(analysisResult[key].length > 0){
        for(let i = 0 ; i < analysisResult[key].length; i++){
          details.push(<li>Dependency to component <NodeLink mapID={analysisResult[key][i]} nodeID={key}/> is not visible on map <MapLink mapID={analysisResult[key][i]}/></li>);
        }
        count ++;
      }
    });
    if(count > 0){
        listOfMessages.push(<li>There are some inconsistencies with dependencies:<ul>{details}</ul></li>);
    }
  }

  render(){
    const node = this.props.node;
    let listOfMessages = [];

    this.calculateUsageMessage(listOfMessages, node);
    this.calculateOwnerMessage(listOfMessages, node);
    this.calculateSubmapMessage(listOfMessages, node);
    this.calculateDependencyMessage(listOfMessages, node);

    return (<ListGroup>{listOfMessages}</ListGroup>);
  }
}
