/*jshint esversion: 6 */

import React from 'react';
import DocumentTitle from 'react-document-title';
import {
  Row,
  Col,
  ListGroup,
  Breadcrumb
} from 'react-bootstrap';
import WorkspaceListElement from './workspace-list-element.js';
import WorkspaceListElementNew from './workspace-list-element-new.js';


export default class WorkspaceList extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.props.workspaceListStore.getWorkspaces();
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.getMaps = this.getMaps.bind(this);
  }

  componentDidMount() {
    this.props.workspaceListStore.addChangeListener(this._onChange.bind(this));
  }

  componentWillUnmount() {
    this.props.workspaceListStore.removeChangeListener(this._onChange.bind(this));
  }

  _onChange() {
    this.setState(this.props.workspaceListStore.getWorkspaces());
  }

  getMaps(workspace){
    if(!workspace){
      return [];
    }
    if(!workspace.timeline){
      return [];
    }
    var timelineLength = workspace.timeline.length;
    return workspace.timeline[timelineLength - 1].maps; //now for now
  }

  render() {
    const workspaceListStore = this.props.workspaceListStore;
    var _workspacesToShow = [];
    if (this.state && this.state.workspaces && Array.isArray(this.state.workspaces)) {
      _workspacesToShow = this.state.workspaces.map(item => <WorkspaceListElement key={item.workspace._id} id={item.workspace._id} name={item.workspace.name} purpose={item.workspace.purpose} description={item.workspace.description} maps={this.getMaps(item.workspace)}></WorkspaceListElement>);
    }
    return (
        <Row className="show-grid">
          <Col xs={12} sm={12} md={12} lg={8} lgOffset={2}>
            <ListGroup>
              {_workspacesToShow}
              <WorkspaceListElementNew workspaceListStore={workspaceListStore}/>
            </ListGroup>
          </Col>
        </Row>
    );
  }
}
