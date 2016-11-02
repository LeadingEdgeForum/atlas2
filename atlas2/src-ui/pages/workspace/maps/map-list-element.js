/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  ListGroupItem,
  Grid,
  Row,
  Col,
  Button,
  ButtonGroup,
  Glyphicon
} from 'react-bootstrap';
var LinkContainer = require('react-router-bootstrap').LinkContainer;
import Actions from '../../../actions';
import {calculateMapName} from './map-name-calculator';
import $ from 'jquery';

export default class MapListElement extends React.Component {

  constructor(props) {
    super(props);

    this.componentDidMount = this.componentDidMount.bind(this);
    this.computeSubmapReferencesMessage = this.computeSubmapReferencesMessage.bind(this);
  }

  archive(workspace, id) {
    Actions.archiveMap(workspace, id);
  }
  componentDidMount() {
    var mapID = this.props.id;
    $.ajax({
      type: 'GET',
      url: '/api/submap/' + mapID + '/usage',
      success: function(referencingMaps) {
        this.setState({referencingMaps:referencingMaps})
      }.bind(this)
    });
  }

  computeSubmapReferencesMessage(){
    if(!this.state || !this.state.referencingMaps){
      return null;
    }
    var mapsList = [];
    for(var i = 0; i < this.state.referencingMaps.length; i++){
      var href = '/map/' + this.state.referencingMaps[i]._id;
      var name = calculateMapName('Unknown',this.state.referencingMaps[i].user, this.state.referencingMaps[i].purpose,this.state.referencingMaps[i].name );
      var punctuation = ', ';
      if(i === this.state.referencingMaps.length - 1){
        punctuation = null;
      }
      if(i === this.state.referencingMaps.length - 2){
        punctuation = ' and ';
      }
      mapsList.push(<span>&#39;<a href={href}>{name}</a>&#39;{punctuation}</span>);
    }
    return (<div>Maps {mapsList} use this submap.</div>);
  }
  render() {
    var mapid = this.props.id;
    var workspaceID = this.props.workspaceID;
    var href = '/map/' + mapid;
    var mapName = calculateMapName("I like being lost.", this.props.user, this.props.purpose, this.props.name);

    var deleteButton = (<Button bsStyle="default" href="#" onClick={this.archive.bind(this, workspaceID, mapid)}>
      <Glyphicon glyph="remove"></Glyphicon> Delete
    </Button>);

    var mapsUsingThisSubmapInfo = null;
    if(this.props.isSubmap){
      mapsUsingThisSubmapInfo = this.computeSubmapReferencesMessage();
    }
    return (
      <ListGroupItem header={mapName}>
        <Grid fluid={true}>
          <Row className="show-grid">
            <Col xs={9}>{mapsUsingThisSubmapInfo}</Col>
            <Col xs={3}>
              <ButtonGroup>
                <LinkContainer to={{ pathname: href }}>
                  <Button bsStyle="default" href={href}>
                    <Glyphicon glyph="edit"></Glyphicon> Edit
                  </Button>
                </LinkContainer>
                {deleteButton}
              </ButtonGroup>
            </Col>
          </Row>
        </Grid>
      </ListGroupItem>
    );
  }
}
