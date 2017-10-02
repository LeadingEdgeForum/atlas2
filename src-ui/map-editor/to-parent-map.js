/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Breadcrumb,
  NavItem,
  Glyphicon,
  NavDropdown,
  MenuItem
} from 'react-bootstrap';
import {calculateMapName} from '../map-list/map-name-calculator';
import $ from 'jquery';
import {LinkContainer} from 'react-router-bootstrap';

var ToParentMap = React.createClass({

  getInitialState : function(){
    var mapID = this.props.map._id;
    $.ajax({
      type: 'GET',
      url: '/api/submap/' + mapID + '/usage',
      success: function(referencingMaps) {
        this.setState({referencingMaps: referencingMaps});
      }.bind(this)
    });
    return {referencingMaps : null};
  },

  componentDidUpdate : function(oldProps, oldState){
    if(oldProps.map._id !== this.props.map._id){
      // map changed, pretend to remount
      var mapID = this.props.map._id;
      $.ajax({
        type: 'GET',
        url: '/api/submap/' + mapID + '/usage',
        success: function(referencingMaps) {
          this.setState({referencingMaps: referencingMaps});
        }.bind(this)
      });

    }
  },

  render: function() {
    if((!this.state.referencingMaps) || (this.state.referencingMaps.length === 0)){
      return <NavItem eventKey={4} href="#" disabled>
          <Glyphicon glyph="arrow-up"></Glyphicon> No parent map
      </NavItem>;
    }
    if(this.state.referencingMaps.length === 1){
      var name = calculateMapName('Parent map', this.state.referencingMaps[0].name, this.state.referencingMaps[0].isSubmap);
      var href = '/map/' + this.state.referencingMaps[0]._id;
      return <LinkContainer to={href}><NavItem eventKey={4} href={href}>
          <Glyphicon glyph="arrow-up"></Glyphicon> {name}
      </NavItem></LinkContainer>;
    }
    var parentList = [];
    for(var i = 0 ; i < this.state.referencingMaps.length; i++){
      var name2 = calculateMapName('Parent map', this.state.referencingMaps[i].name, this.state.referencingMaps[i].isSubmap);
      var href2 = '/map/' + this.state.referencingMaps[i]._id;
      var menuItem = <LinkContainer to={href2}><MenuItem href={href2}>{name2}</MenuItem></LinkContainer>;
      parentList.push(menuItem);
    }
    var title = <span><Glyphicon glyph="arrow-up"></Glyphicon> Parent maps</span>;
    return (
      <NavDropdown eventKey={3} title={title} id="basic-nav-dropdown">
        {parentList}
      </NavDropdown>);
  }
});

module.exports = ToParentMap;
