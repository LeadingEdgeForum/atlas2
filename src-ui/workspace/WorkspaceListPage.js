/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Breadcrumb
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import WorkspaceList from './workspace-list';

export default class WorkspaceListPage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const workspaceListStore = this.props.workspaceListStore;
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
          <WorkspaceList workspaceListStore={workspaceListStore}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
WorkspaceListPage.propTypes = {
  workspaceListStore: React.PropTypes.object.isRequired,
  auth : React.PropTypes.object.isRequired,
  history : React.PropTypes.object.isRequired
};
