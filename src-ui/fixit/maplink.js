/*jshint esversion: 6 */

import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import {LinkContainer} from 'react-router-bootstrap';

export default class MapLink extends React.Component {
  //we do expect mapID
  constructor(props) {
    super(props);
    this.state = {name:"Loading..."};
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  render() {
    var targetURL = '/map/' + this.props.mapID;
    var textOnly = this.props.textOnly;
    var name = this.state.name;
    if(textOnly){
      return <span>{name}</span>;
    } else {
      return <LinkContainer to={targetURL}><a href={targetURL}>{name}</a></LinkContainer>;
    }
  }

  componentDidMount() {
    var queryLink = '/api/map/' + this.props.mapID + '/name';
    this.serverRequest = $.get(queryLink, function(result) {
      if(result && result.map && result.map.name){
      this.setState(result.map);
    }
    }.bind(this));
  }
}
