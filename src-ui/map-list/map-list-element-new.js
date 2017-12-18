/*jshint esversion: 6 */

import React from 'react';
import {ListGroupItem} from 'react-bootstrap';
import SingleWorkspaceActions from './single-workspace-actions';
var CreateNewMapDialog = require('./create-new-map-dialog');

export default class MapListElementNew extends React.Component {

  render() {
    const workspaceID = this.props.workspaceID;
    const singleWorkspaceStore=this.props.singleWorkspaceStore;
    return (
      <ListGroupItem header="Create a new map" onClick={SingleWorkspaceActions.openNewMapDialog}>
        Just click <CreateNewMapDialog
          workspaceID={workspaceID}
          singleWorkspaceStore={singleWorkspaceStore}
          selectedVariant={this.props.selectedVariant}/>
      </ListGroupItem>
    );
  }

}
