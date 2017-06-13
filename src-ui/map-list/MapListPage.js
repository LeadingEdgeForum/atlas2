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
  Glyphicon,
  Tabs,
  Tab,
  Nav,
  NavDropdown,
  MenuItem
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
    this.prepareTimelineTabs = this.prepareTimelineTabs.bind(this);
    this.handleTabSelection = this.handleTabSelection.bind(this);
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

  handleTabSelection(key){
    this.setState({tabselection : key});
  }

  prepareTimelineTabs(timeline, workspaceID, singleWorkspaceStore){
    let navs = [];
    let panes = [];
    let defaultActiveKey;
    if(!timeline || timeline.length === 0){
      navs.push(<NavItem eventKey={defaultActiveKey}>Loading...</NavItem>);
      panes.push(<Tab.Pane eventKey={defaultActiveKey}></Tab.Pane>);
    } else {
      //render time slices
      for(let i = 0; i < timeline.length; i++){
        let key = timeline[i]._id;
        let timeLineName = timeline[i].name;
        if(timeline[i].current){
          key = timeline[i].current;
          defaultActiveKey = key;
        }
        navs.push(<NavItem eventKey={key} key={key}>{timeLineName}</NavItem>);
        let maps = timeline[i].maps || [];
        panes.push(<Tab.Pane eventKey={key} key={key}><MapList maps={maps} workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore}/></Tab.Pane>);
      }

      var dropDownTitle = <Glyphicon glyph="cog"/>;
      navs.push(
        <NavDropdown title={dropDownTitle} id="nav-dropdown-within-tab">
          <MenuItem eventKey="3.1">Set active variant as 'current'</MenuItem>
          <MenuItem eventKey="3.1">Create a new variant from currently active</MenuItem>
        </NavDropdown>);
    }
    var activeKey = this.state.tabselection || defaultActiveKey;
    return <Tab.Container onSelect={this.handleTabSelection} activeKey={activeKey}>
      <Row className="clearfix">
            <Col sm={12}>
              <Nav bsStyle="tabs">
                {navs}
              </Nav>
            </Col>
            <Col sm={12}>
              <Tab.Content>
                {panes}
              </Tab.Content>
            </Col>
          </Row>
    </Tab.Container>;
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

    const tabs = this.prepareTimelineTabs(this.state.workspace.timeline, workspaceID, singleWorkspaceStore);

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
            {tabs}
            </Col>
            <Col xs={3} sm={3} md={3} lg={2}>
              <h4>Editors:</h4> <br/>
              <EditorList workspaceID={workspaceID} editors={editors} singleWorkspaceStore={singleWorkspaceStore}/>
            </Col>
          </Row>
          <EditWorkspaceDialog singleWorkspaceStore={singleWorkspaceStore}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
