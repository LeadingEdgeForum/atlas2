/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
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
var InviteNewUserDialog = require('./invite-new-user-dialog');

export default class MapList extends React.Component {
  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
  }

  render() {
    const editors = this.props.editors || [];
    const workspaceID = this.props.workspaceID;
    const singleWorkspaceStore = this.props.singleWorkspaceStore;

    var editorsToShow = editors.map(owner =>
      <li className = "list-group-item" key={owner}>
        {owner}
        <Button bsSize="xsmall"
          onClick={Actions.deleteInvitedEditor.bind(Actions,{email:owner})}> X </Button>
      </li>);

    return (
      <ListGroup>
      {editorsToShow}
      <Button bsStyle="link" onClick={Actions.openInviteDialog}>Invite more editors...</Button>
      <InviteNewUserDialog workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore}/>
      </ListGroup>
    );
  }
}
