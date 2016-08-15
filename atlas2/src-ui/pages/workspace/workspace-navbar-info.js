/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {Navbar} from 'react-bootstrap';
import WorkspaceStore from './workspace-store';

export default class WorkspaceNavbarInfo extends React.Component {
  constructor(props) {
    super(props);
    console.log(props.params);
    this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    console.log('state', this.state);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }
  render() {
    var name = this.state.workspace.name;
    return (
      <Navbar.Text>
        {name}
      </Navbar.Text>
    );
  }
  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
  }
}
