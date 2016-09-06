/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {ListGroupItem} from 'react-bootstrap';
import Actions from './../../actions.js';

export default class WorskpaceListElementNew extends React.Component {
  render() {
    return (
      <ListGroupItem header="Create a new workspace" onClick={Actions.openNewWorkspaceDialog}>
        <b>'Workspace'</b> is a place which groups maps together. Such maps should describe an independent unit, f.e. your company or other company you are analysing.
      </ListGroupItem>
    );
  }
}
