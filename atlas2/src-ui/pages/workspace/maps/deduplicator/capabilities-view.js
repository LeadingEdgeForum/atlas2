/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
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
import Actions from './deduplicator-actions';
import _ from "underscore";
var AssignExistingCapabilityDialog = require('./assign-existing-capability');
import {getStyleForType} from './../editor/component-styles';
import MapLink from './maplink.js';

var acceptorStyle = {
  width: "100%",
  height: "35px",
  lineHeight: "35px",
  textAlign: "center",
  verticalAlign: "middle",
  margin: "1px",
  color: "white"
};

var capabilityStyle = {
  textAlign: "center"
};

var greyLaneStyle = {
  position: 'absolute',
  left: 1,
  right: 1,
  top: 5,
  height: 20,
  margin: "1px",
  backgroundColor: '#f8f8f8'
};
export default class CapabilitiesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state.assignExistingCapabilityDialog =  {
        open: false
    };
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'copy';
  }

  handleDropExistingCapability(capability,  e) {
    var item = JSON.parse(e.dataTransfer.getData('json'));
    var newState = {
      assignExistingCapabilityDialog: {
        open: true,
        nodeBeingAssigned: item,
        otherNodes: capability.nodes,
        capability: capability,
      }
    };
    this.setState(newState);
  }

  handleDropNewCapability(cat, e) {
    var item = JSON.parse(e.dataTransfer.getData('json'));
    Actions.createNewCapability(this.props.workspace._id, cat, item._id);
  }

  cancelDialog() {
    var newState = {
      assignExistingCapabilityDialog : {
        open:false
      }
    };
    this.setState(newState);
  }

  submitAssignDialog(nodeBeingAssignedID) {
    var capability = this.state.assignExistingCapabilityDialog.capability;
    Actions.assignNodeToCapability(this.props.workspace._id, capability._id, nodeBeingAssignedID);
    this.setState({
        assignExistingCapabilityDialog: {
          open: false
        }
      });
  }

  deleteCapability(capability, e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.stopPropagation();
    Actions.deleteCapability(this.props.workspace._id, capability._id);
  }

  // renderNodeInACapability(node) {
  //   var style = getStyleForType(node.type);
  //   style.left = node.x * 100 + '%';
  //   style.position = 'absolute';
  //   style.top = "10px";
  //   var linkToMap = "/map/" + node.mapID;
  //   var _popover = (
  //     <Popover id={node.name} title="Component details">
  //       <p>Name: {node.name}</p>
  //       <p>Map:
  //         <a href={linkToMap}>{node.mapName}</a>
  //       </p>
  //       <p>
  //         Appears also on following map(s):
  //         <ul>
  //           {node.referencedNodes.map(node => <li>
  //             <MapLink mapID={node.mapID}></MapLink>
  //           </li>)}</ul>
  //       </p>
  //       <p>
  //         <a href="#" onClick={this.clearNodeAssignement.bind(this, node.mapID, node._id)}>Remove from this capability
  //         </a>
  //       </p>
  //     </Popover>
  //   );
  //   //
  //   return (
  //     <OverlayTrigger trigger="click" placement="bottom" overlay={_popover}>
  //       <div style={style}></div>
  //     </OverlayTrigger>
  //   );
  // }


  renderSingleNode(node){
    var style = getStyleForType(node.type);
    style.left = node.x * 100 + '%';
    style.position = 'absolute';
    style.top = "10px";
    return <div style={style}></div>;
  }

  render() {
    var _acceptorStyleToSet = _.clone(acceptorStyle);
    var _capabilityStyleToSet = _.clone(capabilityStyle);
    var _greyLaneStyleToSet = _.clone(greyLaneStyle);
    var greyLaneText = null;
    var _this = this;
    if (this.props.dragStarted) {
      _acceptorStyleToSet = _.extend(_acceptorStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b',
        color: 'black'
      });
      _greyLaneStyleToSet = _.extend(_greyLaneStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 5px #00789b",
        border: '1px solid #00789b',
        zIndex:20
      });
      greyLaneText = "Drop here if the component does the same what this component";
    }

    var categories = [];
    if(!this.props.categories || !this.props.categories.capabilityCategories){
      return <div> wait...</div>
    }
    this.props.categories.capabilityCategories.forEach(function(category){

      var dragOver = _this.handleDragOver.bind(_this);
      var onDrop = _this.handleDropNewCapability.bind(_this, category._id);

      // first the title
      categories.push(
        <Row className="show-grid" key={category._id}>
          <Col xs={3}>
            <h4>{category.name}</h4>
          </Col>
          <Col xs={9}>
            <div style={_acceptorStyleToSet} onDragOver={dragOver} onDrop={onDrop}>Drop here if nothing in this category does the same job</div>
          </Col>
        </Row>
      );

      category.capabilities.forEach(function(capability){
        var _itemsToDisplay = [];
        capability.nodes.forEach(function(node){
            _itemsToDisplay.push(
              _this.renderSingleNode(node)
            );
        });
        var name = capability.nodes[0] ? capability.nodes[0].name : 'banana';
        categories.push(
          <Row className="show-grid" key={capability._id}>
                      <Col xs={3}>
                        <div style={{
                          textAlign: "right"
                        }}>
                          <h5>{name}</h5>
                        </div>
                      </Col>
                      <Col xs={8}>
                        <div style={_capabilityStyleToSet} onDragOver={dragOver} onDrop={_this.handleDropExistingCapability.bind(_this, capability)}>
                          <div style={_greyLaneStyleToSet}>{greyLaneText}</div>
                          {_itemsToDisplay}
                        </div>
                      </Col>
                      <Col xs={1}>
                        <Button bsSize="xsmall" onClick={_this.deleteCapability.bind(_this, capability)}><Glyphicon glyph="remove"></Glyphicon></Button>
                      </Col>
                    </Row>
        );
      });

    });
    if(categories.length === 0){
      categories.push(<Row className="show-grid">
                  <Col xs={12}>
                    Nothing found
                  </Col>
                </Row>);
    }

    var assignDialogOpen = this.state.assignExistingCapabilityDialog.open;
    var assignNodeBeingAssigned = this.state.assignExistingCapabilityDialog.nodeBeingAssigned;
    var capabilityID = this.state.assignExistingCapabilityDialog.capabilityID;
    var assignItems = this.state.assignExistingCapabilityDialog.otherNodes;

    var _this;
    return (
      <Grid fluid={true}>
        {categories}
        <AssignExistingCapabilityDialog open={assignDialogOpen} nodeBeingAssigned={assignNodeBeingAssigned} capabilityID={capabilityID} otherNodes={assignItems} cancel={_this.cancelDialog.bind(_this)} submitAssignDialog={_this.submitAssignDialog.bind(_this)}/>
      </Grid>
    );
  }
}
