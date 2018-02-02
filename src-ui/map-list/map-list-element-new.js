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
          singleWorkspaceStore={singleWorkspaceStore}/>
      </ListGroupItem>
    );
  }

}
