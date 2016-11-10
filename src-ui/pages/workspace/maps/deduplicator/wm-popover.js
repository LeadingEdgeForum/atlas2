/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import $ from 'jquery';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup,
  Popover,
  OverlayTrigger,
  Glyphicon
} from 'react-bootstrap';
import MapLink from './maplink.js';

var WMPopover = React.createClass({
  render() {
    var node = this.props.node;
    var capability= this.state ? this.state.capability : null;
    if(!capability){
      return <div>No additional info :-(</div>;
    }
    var alias = null;
    for(var i = 0; i < capability.aliases.length; i++){
      for(var j = 0; j < capability.aliases[i].nodes.length; j++){
        if(capability.aliases[i].nodes[j]._id === node._id){
          alias = capability.aliases[i];
        }
      }
    }
    if(alias.nodes.length === 1){
      return <div>This node comes from map <MapLink mapID={alias.nodes[0].parentMap._id}/></div>;
    }
    var aliasLinks = [];
    alias.nodes.forEach(function(node){
      aliasLinks.push((<div><b>{node.name}</b> coming from <MapLink mapID={node.parentMap._id}/><br/></div>));
    });
    return  (<div>
        This node is known as:<br/>
        {aliasLinks}
    </div>);
  },

  componentDidMount() {
    var queryLink = '/api/workspace/' + this.props.workspaceID + '/node/' + this.props.node._id + '/usage';
    var _this = this;
    this.serverRequest = $.get(queryLink, function(result) {
      _this.setState(result);
    });
  }
});

module.exports = WMPopover;
