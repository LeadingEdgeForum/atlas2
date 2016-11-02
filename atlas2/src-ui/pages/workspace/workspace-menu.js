/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {Nav, NavItem, Navbar, Glyphicon} from 'react-bootstrap';
import WorkspaceStore from './workspace-store';
import {LinkContainer} from 'react-router-bootstrap';
import Actions from '../../actions';
export default class WorkspaceMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.openEditWorkspaceDialog = this.openEditWorkspaceDialog.bind(this);
  }

  openEditWorkspaceDialog(id) {
    Actions.openEditWorkspaceDialog(id);
  }

  render() {
    var workspaceID = this.props.params.workspaceID;

    var deduplicateHref = '/deduplicate/' + workspaceID;

    return (
      <Nav>
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditWorkspaceDialog.bind(this, workspaceID)}>
      <Glyphicon glyph="edit"></Glyphicon>&nbsp;
        Edit organization info
      </NavItem>
        <LinkContainer to={{
          pathname: deduplicateHref
        }}>
          <NavItem eventKey={2} href={deduplicateHref} key="2">
          <Glyphicon glyph="pawn"></Glyphicon>
          <Glyphicon glyph="pawn" style={{
            color: "silver"
          }}></Glyphicon>&nbsp;
            Deduplicate
          </NavItem>
        </LinkContainer>
      </Nav>
    );
  }
  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange);
  }

  _onChange() {
      this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
  }
}
