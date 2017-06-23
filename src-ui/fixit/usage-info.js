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

var UsageInfo = React.createClass({

  calculateSingleReference(marketreference){
    var nodeEvolutionLevel = this.props.node.x;
    var efficiencyDiff = this.props.node.x - marketreference.evolution;
    var efficiencyMessage = null;
    if(efficiencyDiff < -0.25){
      efficiencyMessage = "significantly more advanced";
    } else if(efficiencyDiff < 0){
      efficiencyMessage = "more advanced";
    } else if(efficiencyDiff < 0.25){
      efficiencyMessage = "less advanced";
    } else {
      efficiencyMessage = "significantly less advanced";
    }
    return <li key={marketreference._id}>{marketreference.name}, {efficiencyMessage}</li>;
  },

  calculateMarketReferences(showMarketReferences){
    if(!showMarketReferences || !this.state){
      return null;
    }
    if(this.state.capability && this.state.capability.marketreferences && this.state.capability.marketreferences.length > 0){
      var competitors = [];
      for(var i = 0; i < this.state.capability.marketreferences.length; i++){
        competitors.push(this.calculateSingleReference(this.state.capability.marketreferences[i]));
      }
      return <div>Identified market references: <ul>{competitors}</ul> </div>;
    }
    return null;
  },

  render() {
    var node = this.props.node;
    var capability= this.state ? this.state.capability : null;
    var emptyInfo = this.props.emptyInfo;
    var alternativeNames = this.props.alternativeNames;
    var excludedList = this.props.excludeList ? this.props.excludeList : [];
    var originInfo = this.props.originInfo;
    var showMarketReferences = this.props.showMarketReferences;
    var marketReferencesExist = capability ? (capability && capability.marketreferences && capability.marketreferences.length > 0) : false;
    var marketReferences = null;
    if(marketReferencesExist && showMarketReferences){
      marketReferences = this.calculateMarketReferences(showMarketReferences);
    }

    if(!capability && emptyInfo){
      return <div>No insights available.</div>;
    }
    if(!capability && !emptyInfo){
      return <span>{marketReferences}</span>;
    }

    var alias = null;
    for(let i = 0; i < capability.aliases.length; i++){
      for(let j = 0; j < capability.aliases[i].nodes.length; j++){
        if(capability.aliases[i].nodes[j]._id === node._id){
          alias = capability.aliases[i];
        }
      }
    }

    // one alias with one node inside. this component cannot have other names nor duplications
    if(alias.nodes.length === 1 && capability.aliases.length === 1){
      if(emptyInfo){
          if(originInfo){
            return <div>This node,<b> {alias.nodes[0].name}</b>, comes from map <MapLink mapID={alias.nodes[0].parentMap._id}/>.<br/>{marketReferences}</div>;
          } else {
            return <div>This node seems to be used only in this map.<br/>{marketReferences}</div>;
          }
      } else {
          return <span>{marketReferences}</span>;
      }
    }

    var aliasLinks = [];
    alias.nodes.forEach(function(_node){
      var onExcludedList = false;
      for(var i = 0; i < excludedList.length; i++){
        if(excludedList[i]._id === _node.parentMap._id){
          onExcludedList = true;
        }
      }
      if ((_node._id !== node._id) && (!onExcludedList)) {
          aliasLinks.push(( <li><b> {_node.name}</b>, from map <MapLink mapID={_node.parentMap._id}/><br/></li>));
      }
    });

    var aliasLinkInfo = null;
    if(aliasLinks.length === 0){
      aliasLinkInfo = <div>This component does not seem to have alternative names.</div>;
    } else {
      aliasLinkInfo = <div>
          This node is also known as:<ul>
            {aliasLinks}</ul></div>;
    }

    var alternativeAliases = [];
    for(let i = 0; i < capability.aliases.length; i++){
      if(capability.aliases[i]._id !== alias._id){
          var _alias = capability.aliases[i];
          for(let j = 0; j < _alias.nodes.length; j++){
            var _node = _alias.nodes[j];
            var onExcludedList = false;
            for(let ii = 0; ii < excludedList.length; ii++){
              // console.log('checking exclusion',excludedList[ii]._id , _node.parentMap._id);
              if(excludedList[ii]._id === _node.parentMap._id){
                onExcludedList = true;
              }
            }
            if ((_node._id !== node._id) && (!onExcludedList)) {
                alternativeAliases.push(( <li><b> {_node.name}</b>, from map <MapLink mapID={_node.parentMap._id}/><br/></li>));
                break;
            }
          }
      }
    }
    var alternativeAliasesInfo = null;
    if(alternativeNames && alternativeAliases.length > 0){
      alternativeAliasesInfo = <div>Other components with similar functionalities are represented by:<ul>{alternativeAliases}</ul></div>;
    }

    var originMessage = null;
    if (originInfo) {
        originMessage = ( <div>This node,<b> {alias.nodes[0].name}</b>, comes from map < MapLink mapID = {alias.nodes[0].parentMap._id} /></div > );
    }

    return  (<div> {originMessage}
          {aliasLinkInfo}
          {alternativeAliasesInfo}
          {marketReferences}
    </div>);
  },

  componentDidMount() {
    var queryLink = '/api/workspace/' + this.props.workspaceID +  '/variant/' + this.props.variantId + '/node/' + this.props.node._id + '/usage';
    var _this = this;
    this.serverRequest = $.get(queryLink, function(result) {
      _this.setState(result);
    });
  }
});

module.exports = UsageInfo;
