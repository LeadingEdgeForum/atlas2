/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {Nav, NavItem, Navbar, Glyphicon} from 'react-bootstrap';
import WorkspaceStore from './../workspace-store';
import {LinkContainer} from 'react-router-bootstrap';
import Actions from '../../../actions';
export default class MapMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getMapInfo(this.props.params.mapID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.openEditMapDialog = this.openEditMapDialog.bind(this);
  }

  openEditMapDialog(mapid) {
    Actions.openEditMapDialog(mapid);
  }

  render() {
    var mapID = this.props.params.mapID;

    var deduplicateHref = '/deduplicate/' + this.state.map.workspace;

    return (
      <Nav>
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditMapDialog.bind(this, mapID)}>
      <Glyphicon glyph="edit"></Glyphicon>&nbsp;
        Edit info
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
      this.setState(WorkspaceStore.getMapInfo(this.props.params.mapID));
  }
}
