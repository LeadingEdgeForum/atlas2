/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {ListGroupItem} from 'react-bootstrap';

export default class MapListElement extends React.Component {
  render() {
    var href = '/map/' + this.props.id;
    return (
      <ListGroupItem header={this.props.name} href={href}>
        {this.props.description}
      </ListGroupItem>
    );
  }
}
