/*jshint esversion: 6 */


import React, { PropTypes } from 'react';
import {ListGroupItem} from 'react-bootstrap';

export default class WorkspaceListElement extends React.Component {
  render() {
    return (
      <ListGroupItem header={this.props.name}>
      </ListGroupItem>
    );
  }
}
