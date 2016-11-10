/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {ListGroupItem} from 'react-bootstrap';
import Actions from './../../actions.js';

export default class WorskpaceListElementNew extends React.Component {
  render() {
    return (
      <ListGroupItem header="Create a new organization" onClick={Actions.openNewWorkspaceDialog}>
        <b>'Organization'</b> is a group of map that should be considered together and can reference each other.
      </ListGroupItem>
    );
  }
}
