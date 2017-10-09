/*jshint esversion: 6 */

import React from 'react';
import {
  Grid,
  Row,
  Col,
  Table,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import SingleWorkspaceActions from './single-workspace-actions';
import {calculateMapName} from './map-name-calculator';
import $ from 'jquery';
var Blob = require('blob');
let sanitize = require("sanitize-filename");
/* globals document */
/* globals window */

export default class MapListElement extends React.Component {

  constructor(props) {
    super(props);

    this.componentDidMount = this.componentDidMount.bind(this);
    this.computeSubmapReferencesMessage = this.computeSubmapReferencesMessage.bind(this);
    this.stopPropagation = this.stopPropagation.bind(this);
    this.download = this.download.bind(this);
  }

  delete(id) {
    SingleWorkspaceActions.deleteMap({mapID : id});
  }

  download(id, mapName) {
    $.ajax({
      url: '/api/map/' + id + '/json',
      type: 'GET',
      dataType: 'json',
      success: function(data, textStatus, jqxhr) {
        var file = new Blob([JSON.stringify(data)], {"type": jqxhr.getResponseHeader("Content-Type")});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(file);
        link.download = sanitize(mapName) + ".json";
        link.click();
      }
    });
  }

  componentDidMount() {
    var mapID = this.props.id;

    $.ajax({
      type: 'GET',
      url: '/api/submap/' + mapID + '/usage',
      success: function(referencingMaps) {
        this.setState({referencingMaps: referencingMaps});
      }.bind(this)
    });
  }

  stopPropagation(event){
    event.stopPropagation();
    event.preventDefault();
  }

  computeSubmapReferencesMessage() {
    if (!this.state || !this.state.referencingMaps) {
      return null;
    }
    if (this.state.referencingMaps.length === 0) {
      return <div>No other map uses this submap. It&#39;s undesired.</div>;
    }
    var mapsList = [];
    for (var i = 0; i < this.state.referencingMaps.length; i++) {
      var href = '/map/' + this.state.referencingMaps[i]._id;
      var name = calculateMapName('Unknown', this.state.referencingMaps[i].name, this.state.referencingMaps[i].isSubmap);
      var punctuation = ', ';
      if (i === this.state.referencingMaps.length - 1) {
        punctuation = null;
      }
      if (i === this.state.referencingMaps.length - 2) {
        punctuation = ' and ';
      }
      mapsList.push(
        <LinkContainer to={{pathname: href}} ><span key={href}>&#39;<a href={href}>{name}</a>&#39;{punctuation}</span></LinkContainer>
      );
    }
    if(mapsList.length === 1){
      return (
        <div>Map {mapsList}
          uses this submap.</div>
      );
    }
    return (
      <div>Maps {mapsList}
        use this submap.</div>
    );
  }
  render() {
    var mapid = this.props.id;
    var workspaceID = this.props.workspaceID;
    var href = '/map/' + mapid;
    var mapName = calculateMapName("I like being lost.", this.props.name, this.props.isSubmap);

    var deleteButton = (
      <MenuItem eventKey="1" onClick={this.delete.bind(this, mapid)}><Glyphicon glyph="remove"></Glyphicon>Delete</MenuItem>
    );
    let downloadButton = (
      <MenuItem eventKey="1" onClick={this.download.bind(this, mapid, mapName)}><Glyphicon glyph="download"></Glyphicon>&nbsp;Download JSON</MenuItem>
    );
    var mapsUsingThisSubmapInfo = null;
    if (this.props.isSubmap) {
      mapsUsingThisSubmapInfo = this.computeSubmapReferencesMessage();
    }
    var responsible = null;
    if(this.props.responsible) {
      responsible = (<span><Glyphicon glyph="user"></Glyphicon> {this.props.responsible}</span>);
    }
    var dropDownTitle = <Glyphicon glyph="cog"></Glyphicon>;
    return (
      <LinkContainer to={{ pathname: href }}>
        <ListGroupItem header={mapName} href={href}>
          <Grid fluid={true}>
            <Row className="show-grid">
              <Col xs={11}>{mapsUsingThisSubmapInfo}{responsible}</Col>
              <Col xs={1}>
                <DropdownButton title={dropDownTitle} onClick={this.stopPropagation}>
                  {downloadButton}
                  {deleteButton}
                </DropdownButton>
              </Col>
            </Row>
          </Grid>
        </ListGroupItem>
      </LinkContainer>
    );
  }
}
