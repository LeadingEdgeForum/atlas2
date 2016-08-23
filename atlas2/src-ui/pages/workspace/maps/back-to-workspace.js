/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {Nav, NavItem, Navbar} from 'react-bootstrap';
import WorkspaceStore from './../workspace-store';
import {LinkContainer} from 'react-router-bootstrap';



export default class BackToWorkspace extends React.Component {
  constructor(props) {
    super(props);
    if(this.props.params.mapID){
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
    if(this.props.params.mapID){
      //we have only map, so after it is loaded...
      workspaceID = this.state.map.workspace;
    } else {
      //we have workspace, nice
      name = this.state.workspace.name;
      workspaceID = this.props.params.workspaceID;
    }
    var href = '/workspace/' + workspaceID;
    return (
      <Nav>
        <LinkContainer to={{
          pathname: href
        }}>
          <NavItem eventKey={1} href={href}>
            Back to workspace {name}
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
    if(this.props.params.mapID){
      this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
    } else {
      this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
    }
  }
}
