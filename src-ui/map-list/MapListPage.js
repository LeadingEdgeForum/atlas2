/*jshint esversion: 6 */

import React from 'react';
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
  MenuItem,
  Alert,
  Button,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  Input,
  Modal
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import MapList from './map-list';
import {LinkContainer} from 'react-router-bootstrap';
import SingleWorkspaceActions from './single-workspace-actions';
import EditWorkspaceDialog from '../workspace/edit-workspace-dialog';
import CreateNewVariantDialog from './create-new-variant-dialog';
import EditVariantDialog from './edit-variant-dialog';
import EditorList from './editors-list';
/* globals FileReader */

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
    this.cloneActiveVariant = this.cloneActiveVariant.bind(this);
    this.editActiveVariant = this.editActiveVariant.bind(this);
    this.setCurrent = this.setCurrent.bind(this);
    this.findChildren = this.findChildren.bind(this);
    this._openImport = this._openImport.bind(this);
    this._closeImport = this._closeImport.bind(this);

    this._changeImport = this._changeImport.bind(this);
    this._uploadImport = this._uploadImport.bind(this);

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
    let variantId = this.state.tabselection;
    if(!variantId){ // no selection
      const timeline = this.state.workspace.timeline;
      if(timeline){
        for(let i = 0; i < timeline.length; i++){
          let key = timeline[i]._id;
          if(timeline[i].current){
            variantId = timeline[i]._id;
            break;
          }
        }
      }
    }
    const deduplicateHref = '/fixit/' + workspaceID + '/variant/' + variantId;
    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditWorkspaceDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit organization info
      </NavItem>,
      <NavItem eventKey={2} href="#" key="2" onClick={this._openImport}>
          <Glyphicon glyph="upload"></Glyphicon>
          &nbsp;Upload a map
      </NavItem>,
      <LinkContainer to={{pathname: deduplicateHref}} key="3">
          <NavItem eventKey={3} href={deduplicateHref} key="3">
          <Glyphicon glyph="plus" style={{color: "basil"}}></Glyphicon>
          &nbsp;Fix it!
          </NavItem>
      </LinkContainer>
    ];
  }

  handleTabSelection(key,a, b){
    if(key === 'cloneVariant'){
      return; //this is an action, tab should not switch
    }
    if(key === 'editVariant'){
      return; //this is an action, tab should not switch
    }
    if(key === 'setCurrent'){
      return; //this is an action, tab should not switch
    }
    this.setState({tabselection : key});
  }

  cloneActiveVariant(e){
    e.preventDefault();
    e.stopPropagation();
    SingleWorkspaceActions.openNewVariantDialog(this.state.tabselection);
  }

  editActiveVariant(e){
    e.preventDefault();
    e.stopPropagation();
    SingleWorkspaceActions.openEditVariantDialog(this.state.tabselection);
  }

  setCurrent(e){
    e.preventDefault();
    e.stopPropagation();
    SingleWorkspaceActions.setVariantAsCurrent(this.state.tabselection);
  }

  findChildren(timeline, timeslice, filteredTimeline) {
    if(!timeslice){
      return;
    }
    filteredTimeline.push(timeslice);
    // for each next
    for (let i = 0; i < timeslice.next.length; i++) {
      //locate the timeslice
      for (let j = 0; j < timeline.length; j++) {
        if (timeline[j]._id === timeslice.next[i]) {
          this.findChildren(timeline, timeline[j], filteredTimeline);
        }
      }
    }
  }

  prepareTimelineTabs(timeline, workspaceID, singleWorkspaceStore){
    let navs = [];
    let panes = [];
    let defaultActiveKey;
    if(!timeline || timeline.length === 0){
      navs.push(<NavItem eventKey={defaultActiveKey}>Loading...</NavItem>);
      panes.push(<Tab.Pane eventKey={defaultActiveKey}></Tab.Pane>);
    } else {
      // very optimistic approach - display the list only from the timeline
      //render time slices
      let filteredTimeline = [];
      let currentTimeSlice = null;
      for(let i = 0; i < timeline.length; i++){
        let key = timeline[i]._id;
        if(timeline[i].current){
          currentTimeSlice = timeline[i];
          defaultActiveKey = key;
          break;
        }
      }
      this.findChildren(timeline, currentTimeSlice, filteredTimeline);

      for(let i = 0; i < filteredTimeline.length; i++){
        let key = filteredTimeline[i]._id;
        let timeLineName = filteredTimeline[i].name;
        let currentDecoriation = null;
        if(filteredTimeline[i].current){
          key = timeline[i]._id;
          defaultActiveKey = key;
          currentDecoriation = <Glyphicon glyph="flash"/>;
        }
        navs.push(<NavItem eventKey={key}>{timeLineName}{currentDecoriation}</NavItem>);
        let maps = filteredTimeline[i].maps || [];
        panes.push(<Tab.Pane eventKey={key}><MapList maps={maps} workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore} selectedVariant={this.state.tabselection}/></Tab.Pane>);
      }

      var dropDownTitle = <Glyphicon glyph="cog"/>;
      let setAsCurrent = ((this.state.tabselection || defaultActiveKey) === defaultActiveKey) ?  null : <MenuItem eventKey="setCurrent" onClick={this.setCurrent}>Set active variant as new baseline</MenuItem>;
      navs.push(
        <NavDropdown title={dropDownTitle} id="nav-dropdown-within-tab">
          <MenuItem eventKey="editVariant" onClick={this.editActiveVariant} href="#">Edit currently active variant</MenuItem>
          {setAsCurrent}
          <MenuItem eventKey="cloneVariant" onClick={this.cloneActiveVariant} href="#">Create future variant from currently active</MenuItem>
        </NavDropdown>);
    }
    var activeKey = this.state.tabselection ? this.state.tabselection : defaultActiveKey;
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

  _openImport(){
    this.setState({importOpen:true});
  }

  _closeImport(){
    this.setState({importOpen:false, fileToUpload:null, mapToUpload : null});
  }

  _uploadImport(event){
    event.preventDefault();

    let workspaceID = this.props.singleWorkspaceStore.getWorkspaceId();
    SingleWorkspaceActions.uploadAMap(workspaceID,this.state.mapToUpload);
    this.setState({importOpen:false, fileToUpload:null});
  }

  _changeImport(event){
    // console.log(event.target.files[0]);
    let _this = this;
    // console.log(event.target.value);
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = function(event){
      try {
        let jsonData = JSON.parse(event.target.result);
        _this.setState({mapToUpload:jsonData});
      } catch (e){
        console.log(e);
        _this.setState({fileToUpload: null});
      }
    };
    this.setState({fileToUpload: event.target.value});
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

    const errorCode = singleWorkspaceStore.getErrorCode();
    let tabs;
    if(!errorCode){
      tabs = this.prepareTimelineTabs(this.state.workspace.timeline, workspaceID, singleWorkspaceStore);
    } else if (errorCode === 404) {
      tabs = (<Alert bsStyle="warning"><p>You have no rights to access that workspace. Or it does not exist. One way or another, I cannot display it for you. </p><br/><LinkContainer to="/"><Button bsStyle="warning">Go back to your workspaces</Button></LinkContainer></Alert>);
    } else {
      tabs = (<Alert bsStyle="warning"><p>I am terribly sorry, I have found errorCode : {errorCode} and I do not know what to do next.</p><br/><LinkContainer to="/"><Button bsStyle="warning">Go back to your workspaces</Button></LinkContainer></Alert>);
    }

    const state = this.state;

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
              <LinkContainer to="/"><Breadcrumb.Item href="/">Home</Breadcrumb.Item></LinkContainer>
              <LinkContainer to={"/workspace/"+workspaceID}><Breadcrumb.Item href={"/workspace/"+workspaceID} active>
                {name} - {purpose}
              </Breadcrumb.Item></LinkContainer>
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
          <CreateNewVariantDialog singleWorkspaceStore={singleWorkspaceStore}/>
          <EditVariantDialog singleWorkspaceStore={singleWorkspaceStore}/>
          <Modal show={state.importOpen} onHide={this._closeImport}>
            <Modal.Header closeButton>
              <Modal.Title>
                Import a map
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form horizontal>
              <FormGroup controlId="name">
                <Col sm={2}>
                  <ControlLabel>File</ControlLabel>
                </Col>
                <Col sm={9}>
                  <FormControl
                    type="file"
                    placeholder="Select a file to upload"
                    onChange={this._changeImport}/>
                    <HelpBlock>A file with a map</HelpBlock>
                </Col>
              </FormGroup>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button type="reset" onClick={this._closeImport}>Cancel</Button>
              <Button type="submit" bsStyle="primary" value="Submit" onClick={this._uploadImport}>Upload</Button>
            </Modal.Footer>
          </Modal>
        </Grid>
      </DocumentTitle>
    );
  }
}
