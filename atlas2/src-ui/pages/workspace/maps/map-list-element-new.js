/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {ListGroupItem} from 'react-bootstrap';
import Actions from './../../../actions.js';

export default class MapListElementNew extends React.Component {
  render() {
    return (
      <ListGroupItem header="Create a new map" onClick={Actions.openNewMapDialog}>
        Just click
      </ListGroupItem>
    );
  }
}
