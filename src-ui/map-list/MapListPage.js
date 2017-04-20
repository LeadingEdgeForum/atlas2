/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Breadcrumb,
  NavItem,
  Glyphicon
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import MapList from './map-list';
import {LinkContainer} from 'react-router-bootstrap';
import SingleWorkspaceStore from './single-workspace-store';
import SingleWorkspaceActions from './single-workspace-actions';
import EditWorkspaceDialog from '../workspace/edit-workspace-dialog';

export default class MapListPage extends React.Component {
  constructor(props) {
    super(props);
    this.singleWorkspaceStore = new SingleWorkspaceStore(this.props.workspaceID);
    this.prepareWorkspaceMenu = this.prepareWorkspaceMenu.bind(this);
    this.render = this.render.bind(this);
    this.openEditWorkspaceDialog = this.openEditWorkspaceDialog.bind(this);
  }

  openEditWorkspaceDialog(id) {
    SingleWorkspaceActions.openEditWorkspaceDialog(id);
  }

  prepareWorkspaceMenu(){
    const workspaceID = this.props.workspaceID;
    const deduplicateHref = '/deduplicate/' + workspaceID;
    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditWorkspaceDialog.bind(this, workspaceID)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit organization info
      </NavItem>,
      <LinkContainer to={{pathname: deduplicateHref}}>
          <NavItem eventKey={2} href={deduplicateHref} key="2">
              <Glyphicon glyph="pawn"></Glyphicon>
              <Glyphicon glyph="pawn" style={{color: "silver"}}></Glyphicon>
              &nbsp;Deduplicate
          </NavItem>
      </LinkContainer>
    ];
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const workspaceListStore = this.props.workspaceListStore;
    const singleWorkspaceStore = this.singleWorkspaceStore;
    const workspaceMenu = this.prepareWorkspaceMenu();
    return (
      <DocumentTitle title='Atlas2, the mapping Tool'>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16}>
              <AtlasNavbarWithLogout auth={auth} history={history}/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Breadcrumb>
              <Breadcrumb.Item href="/" active>Home</Breadcrumb.Item>
            </Breadcrumb>
          </Row>
          <MapList singleWorkspaceStore={singleWorkspaceStore}/>
          <EditWorkspaceDialog singleWorkspaceStore={singleWorkspaceStore}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
