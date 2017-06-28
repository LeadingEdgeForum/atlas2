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
import Actions from './single-workspace-actions';
import MapListElement from './map-list-element';
import MapListElementNew from './map-list-element-new';
//var InviteNewUserDialog = require('./invite-new-user-dialog');

export default class MapList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const maps = this.props.maps || [];
    const workspaceID = this.props.workspaceID;
    const singleWorkspaceStore = this.props.singleWorkspaceStore;

    var _mapsToShow = maps.map(
          (item) =>
          <MapListElement
            workspaceID={workspaceID}
            key={item._id}
            id={item._id}
            user={item.user}
            purpose={item.purpose}
            name={item.name}
            isSubmap={item.isSubmap}
            responsible={item.responsiblePerson} />);

    return (
      <ListGroup>
        {_mapsToShow}
        <MapListElementNew
          workspaceID={workspaceID}
          singleWorkspaceStore={singleWorkspaceStore}
          selectedVariant={this.props.selectedVariant}/>
      </ListGroup>
    );
  }
}
