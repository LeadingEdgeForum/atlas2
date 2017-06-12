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
import SingleWorkspaceActions from './single-workspace-actions';
import EditWorkspaceDialog from '../workspace/edit-workspace-dialog';
import EditorList from './editors-list';

export default class MapListPage extends React.Component {
  constructor(props) {
    super(props);
    this.prepareWorkspaceMenu = this.prepareWorkspaceMenu.bind(this);
    this.render = this.render.bind(this);
    this.openEditWorkspaceDialog = this.openEditWorkspaceDialog.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.state = this.props.singleWorkspaceStore.getWorkspaceInfo();
  }

  componentDidMount() {
    var _this = this;
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
    this.props.singleWorkspaceStore.io.emit('workspace', {
      type: 'sub',
      id: _this.props.singleWorkspaceStore.getWorkspaceId()
    });
  }

  componentWillUnmount() {
    var _this = this;
    this.props.singleWorkspaceStore.removeChangeListener(this._onChange);
    this.props.singleWorkspaceStore.io.emit('workspace', {
      type: 'unsub',
      id: _this.props.singleWorkspaceStore.getWorkspaceId()
    });
  }

  _onChange() {
    this.setState(this.props.singleWorkspaceStore.getWorkspaceInfo());
  }

  openEditWorkspaceDialog() {
    SingleWorkspaceActions.openEditWorkspaceDialog();
  }

  prepareWorkspaceMenu(){
    const workspaceID = this.props.singleWorkspaceStore.getWorkspaceId();
    const deduplicateHref = '/fixit/' + workspaceID;
    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditWorkspaceDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit organization info
      </NavItem>,
      <LinkContainer to={{pathname: deduplicateHref}} key="2">
          <NavItem eventKey={2} href={deduplicateHref} key="2">
          <Glyphicon glyph="plus" style={{color: "basil"}}></Glyphicon>
          &nbsp;Fix it!
          </NavItem>
      </LinkContainer>
    ];
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const singleWorkspaceStore = this.props.singleWorkspaceStore;
    const workspaceMenu = this.prepareWorkspaceMenu();
    const name = this.state.workspace.name;
    const purpose = this.state.workspace.purpose;
    const workspaceID = singleWorkspaceStore.getWorkspaceId();

    const maps = this.state.workspace.timeline ? this.state.workspace.timeline[this.state.workspace.timeline.length - 1].maps : [];
    const editors = this.state.workspace.owner;
    return (
      <DocumentTitle title='Atlas2, the mapping Tool'>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16}>
              <AtlasNavbarWithLogout
                auth={auth}
                history={history}
                mainMenu={workspaceMenu}/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Breadcrumb>
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item href={"/workspace/"+workspaceID} active>
                {name} - {purpose}
              </Breadcrumb.Item>
            </Breadcrumb>
          </Row>
          <Row className="show-grid">
          <Col xs={9} sm={9} md={9} lg={7} lgOffset={1}>
              <h4>Your maps</h4>
            </Col>
            <Col xs={3} sm={3} md={3} lg={2}>
              <h4>Editors:</h4>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col xs={9} sm={9} md={9} lg={7} lgOffset={1}>
              <MapList maps={maps} workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore}/>
            </Col>
            <Col xs={3} sm={3} md={3} lg={2}>
              <EditorList workspaceID={workspaceID} editors={editors} singleWorkspaceStore={singleWorkspaceStore}/>
            </Col>
          </Row>
          <EditWorkspaceDialog singleWorkspaceStore={singleWorkspaceStore}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
