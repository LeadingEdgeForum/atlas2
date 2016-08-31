/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import $ from 'jquery';

export default class MapLink extends React.Component {
  //we do expect mapID
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {name:"Loading..."};
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  render() {
    var targetURL = '/map/' + this.props.mapID;
    var name = this.state.name;
    return <a href={targetURL}>{name}</a>;
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
