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
  Popover,
  OverlayTrigger,
  Breadcrumb
} from 'react-bootstrap';
import WorkspaceStore from '../../workspace-store';
import DeduplicatorStore from './deduplicator-store';

var Constants = require('./../../../../constants');
import Actions from './../../../../actions.js';
import _ from "underscore";




export default class Deduplicator extends React.Component {

  constructor(props) {
    super(props);
    this.state = WorkspaceStore.getWorkspaceInfo(props.params.workspaceID);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.store = new DeduplicatorStore(props.params.workspaceID);
  }

  componentDidMount() {
    WorkspaceStore.addChangeListener(this._onChange.bind(this));
    this.store.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    WorkspaceStore.removeChangeListener(this._onChange.bind(this));
    this.store.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(WorkspaceStore.getWorkspaceInfo(this.props.params.workspaceID));
    this.setState(this.store.getAvailableComponents());
  }





  render() {

    var unprocessedComponents = this.store.getAvailableComponents();
    var store = this.store;

    var processedComponents = this.store.getProcessedComponents();
    var _toDisplayComponents = unprocessedComponents.map(map => this.renderAvailableComponents(map));

    var workspace = this.state.workspace;

    var name = this.state.workspace ? this.state.workspace.name : "no name";
    var purpose = this.state.workspace ? this.state.workspace.purpose : "no purpose";




  }
}
