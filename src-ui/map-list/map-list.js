/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */
/*jshint esversion: 6 */

import React from 'react';
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
            name={item.name}
            isSubmap={item.isSubmap}
            responsible={item.responsiblePerson} />);

    return (
      <ListGroup>
        {_mapsToShow}
        <MapListElementNew
          workspaceID={workspaceID}
          singleWorkspaceStore={singleWorkspaceStore}/>
      </ListGroup>
    );
  }
}
