/*jshint esversion: 6 */

import React from 'react';
import {
  Grid,
  Row,
  Col,
  Button,
  ListGroup,
  ListGroupItem,
  Glyphicon
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
      <ListGroupItem key={owner}>
        {owner}
        <Button bsSize="xsmall" className="pull-right"
          onClick={Actions.deleteInvitedEditor.bind(Actions,{email:owner})}><Glyphicon glyph="remove"></Glyphicon></Button>
      </ListGroupItem>);

    return (
      <ListGroup>
        {editorsToShow}
        <Button bsStyle="link" onClick={Actions.openInviteDialog}>Invite more editors...</Button>
        <InviteNewUserDialog workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore}/>
      </ListGroup>
    );
  }
}
