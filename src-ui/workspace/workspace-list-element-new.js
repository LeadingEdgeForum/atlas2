/*jshint esversion: 6 */

import React from 'react';
import {ListGroupItem} from 'react-bootstrap';
import Actions from './workspace-actions.js';
var CreateNewWorkspaceDialog = require('./create-new-workspace-dialog');

export default class WorskpaceListElementNew extends React.Component {
  render() {
    const workspaceListStore = this.props.workspaceListStore;
    return (
      <ListGroupItem header="Create a new organization" onClick={Actions.openNewWorkspaceDialog}>
        <b>'Organization'</b> is a group of map that should be considered together and can reference each other.
        <CreateNewWorkspaceDialog workspaceListStore={workspaceListStore}/>
      </ListGroupItem>
    );
  }
}
