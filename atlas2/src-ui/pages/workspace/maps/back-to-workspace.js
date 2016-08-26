/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {Nav, NavItem, Navbar} from 'react-bootstrap';
import WorkspaceStore from './../workspace-store';
import {LinkContainer} from 'react-router-bootstrap';

export default class BackToWorkspace extends React.Component {
  constructor(props) {
    super(props);
    if (this.props.params.mapID) {
      this.state = WorkspaceStore.getMapInfo(props.params.mapID);
    } else {
      this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    }
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
  }
  render() {
    var name = null;
    var workspaceID = null;
    var mapSupplied = this.props.params.mapID;
    if (this.props.params.mapID) {
      //we have only map, so after it is loaded...
      workspaceID = this.state.map.workspace;
    } else if (this.props.params.workspaceID && this.state.workspace) {
      //we have workspace, nice
      name = this.state.workspace.name;
      workspaceID = this.props.params.workspaceID;
    } else {
      return null;
    }
    var href = '/workspace/' + workspaceID;
    var deduplicateHref = '/deduplicate/' + workspaceID;

    var deduplicatorLink = [];
    if (mapSupplied) {
      deduplicatorLink.push((
        <LinkContainer to={{
          pathname: deduplicateHref
        }}>
          <NavItem eventKey={2} href={deduplicateHref} key="2">
            Deduplicate
          </NavItem>
        </LinkContainer>
      ));
    }
    return (
      <Nav>
        <LinkContainer to={{
          pathname: href
        }}>
          <NavItem eventKey={1} href={href} key="1">
            Back to workspace {name}
          </NavItem>
        </LinkContainer>
        {deduplicatorLink}
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
    if (this.props.params.mapID) {
      this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
    } else {
      this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
    }
  }
}
