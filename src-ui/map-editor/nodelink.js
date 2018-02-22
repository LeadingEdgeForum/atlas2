/*
 * Copyright 2018 Krzysztof Daniel.
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

import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import {LinkContainer} from 'react-router-bootstrap';

export default class NodeLink extends React.Component {
  //we do expect mapID
  constructor(props) {
    super(props);
    this.state = {name:"Loading..."};
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  render() {
    let targetURL = '/map/' + this.props.mapID;
    let textOnly = this.props.textOnly;
    if(this.props.mapID === 'null' || this.props.mapID === 'undefined' || !this.props.mapID){
      // we cannot refer to a map, so we can only display text, not a link
      textOnly = true;
    }
    let name = this.state.name;
    if(textOnly){
      return <span>'{name}'</span>;
    } else {
      return <LinkContainer to={targetURL}><a href={targetURL}>{name}</a></LinkContainer>;
    }
  }

  componentDidMount() {
    let queryLink = '/api/map/' + this.props.mapID + '/node/' + this.props.nodeID + '/name';
    this.serverRequest = $.get(queryLink, function(result) {
      if(result && result.node && result.node.name){
      this.setState(result.node);
    }
    }.bind(this));
  }
}
