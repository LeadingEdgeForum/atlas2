/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {ListGroupItem} from 'react-bootstrap';
import Actions from './../../actions.js';

export default class WorskpaceListElementNew extends React.Component {
  render() {
    return (
      <ListGroupItem header="Create new workspace" onClick={Actions.openNewWorkspaceDialog}>
        Just click
      </ListGroupItem>
    );
  }
}
