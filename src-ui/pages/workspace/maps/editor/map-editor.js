/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup,
  Breadcrumb
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import Palette from './palette';
import MapCanvas from './canvas';
import CreateNewNodeDialog from './create-new-node-dialog';
import CreateNewSubmapDialog from './create-new-submap-dialog';
import SubmapReferencesDialog from './submap-references-dialog';
import ReferencesDialog from './references-dialog';
import EditNodeDialog from './edit-node-dialog';
import NewGenericCommentDialog from './create-new-comment-dialog';
import EditGenericCommentDialog from './edit-comment-dialog';
var _ = require('underscore');
var EditMapDialog = require('./../edit-map-dialog');
import {calculateMapName} from './../map-name-calculator';

var outerStyle = { //this is style applied to the entire map area (without palette)
  width: 'auto',
  left: 0,
  right: 0,
  height: '100%',
  minHeight: '500px',
  float: 'left',
  position: 'absolute',
  minWidth: '800px'
};

var axisSupport = {
  position: 'absolute',
  borderWidth: 1,
  top: '3%',
  bottom: '2%',
  border: '1px dashed silver',
  zIndex: '1'
};

//TODO: align this properly (relative to the canvas)
var axisSupport1 = _.extend(_.clone(axisSupport), {left: '25.5%'});
var axisSupport2 = _.extend(_.clone(axisSupport), {left: '51%'});
var axisSupport3 = _.extend(_.clone(axisSupport), {left: '76.5%'});

var axisX = {
  position: 'absolute',
  bottom: '2%',
  height: 1,
  left: '2%',
  right: '2%',
  border: '1px solid gray',
  marginRight: 0,
  marginLeft: 0,
  zIndex: 2
};

var arrowX = {
  position: 'absolute',
  width: 0,
  height: 0,
  borderTop: '4px solid transparent',
  borderBottom: '2px solid transparent',
  borderLeft: '10px solid gray',
  right: '2%',
  bottom: '2%',
  zIndex: 2
};

var axisY = {
  position: 'absolute',
  width: 1,
  borderWidth: 1,
  top: '2%',
  bottom: '2%',
  left: '2%',
  border: '1px solid gray',
  zIndex: 2
};

var arrowY = {
  position: 'absolute',
  width: 0,
  height: 0,
  left: '2%',
  top: '2%',
  borderLeft: '2px solid transparent',
  borderRight: '4px solid transparent',
  borderBottom: '10px solid gray',
  zIndex: 2
};

var valueCaption = {
  position: 'absolute',
  zIndex: 3,
  fontSize: 'smaller',
  top: '3%',
  left: '3%'
};

var evolutionCaption = {
  position: 'absolute',
  zIndex: 3,
  fontSize: 'smaller',
  bottom: '3%',
  right: '3%'
};

var genesisStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '5%'
};
var customBuiltStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '31%'
};
var productStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '57%'
};
var commodityStyle = {
  fontSize: 'smaller',
  position: 'absolute',
  left: '81%'
};

export default class MapEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getMapInfo(props.params.mapID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    var _this = this;
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    WorkspaceStore.io.emit('map', {
      type: 'sub',
      id: _this.props.params.mapID
    });
  }

  componentWillUnmount() {
    var _this = this;
    WorkspaceStore.io.emit('map', {
      type: 'unsub',
      id: _this.props.params.mapID
    });
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
    this.setState(WorkspaceStore.getWorkspaceInfo(this.state.map.workspace));
  }

  render() {
    var nodes = this.state.map.nodes;
    var comments = this.state.map.comments;
    var name = this.state.workspace
      ? this.state.workspace.name
      : "no name";
    var purpose = this.state.workspace
      ? this.state.workspace.purpose
      : "no purpose";
    var workspaceID = this.state.map.workspace || "";
    var mapName = calculateMapName("I like being lost.", this.state.map.user, this.state.map.purpose, this.state.map.name);
    return (
      <Grid fluid={true}>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item href={"/workspace/" + workspaceID}>
            {name}
            - {purpose}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {mapName}
          </Breadcrumb.Item>
        </Breadcrumb>
        <Row className="show-grid">
          <Col xs={3} sm={2} md={2} lg={1}>
            <Palette mapID={this.props.params.mapID}></Palette>
          </Col>
          <Col xs={9} sm={10} md={10} lg={11}>
            <div style={outerStyle}>
              <MapCanvas nodes={nodes} comments={comments} mapID={this.props.params.mapID} workspaceID={workspaceID}></MapCanvas>
              <div>
                <div style={axisX}>
                  <div style={genesisStyle}>Genesis</div>
                  <div style={customBuiltStyle}>Custom Built</div>
                  <div style={productStyle}>Product or Rental</div>
                  <div style={commodityStyle}>Commodity/Utility</div>
                </div>
                <div style={arrowX}/>
                <div style={valueCaption}>Visibility</div>
                <div style={axisY}/>
                <div style={arrowY}/>
                <div style={evolutionCaption}>Evolution</div>
                <div style={axisSupport1}/>
                <div style={axisSupport2}/>
                <div style={axisSupport3}/>
              </div>
            </div>
            <CreateNewNodeDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
            <CreateNewSubmapDialog workspaceID={workspaceID}/>
            <EditNodeDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
            <NewGenericCommentDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
            <EditGenericCommentDialog mapID={this.props.params.mapID} workspaceID={workspaceID}/>
            <SubmapReferencesDialog/>
            <ReferencesDialog/>
          </Col>
        </Row>
        <EditMapDialog workspaceID={workspaceID}/>
      </Grid>
    );
  }
}
