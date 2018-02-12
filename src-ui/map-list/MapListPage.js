/* Copyright 2017, 2018  Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */
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
import EditorList from './editors-list';
import $ from 'jquery';
import NodeLink from '../map-editor/nodelink';
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
    this._openImport = this._openImport.bind(this);
    this._closeImport = this._closeImport.bind(this);
    this._changeImport = this._changeImport.bind(this);
    this._uploadImport = this._uploadImport.bind(this);

    this._closeWarningsDialog = this._closeWarningsDialog.bind(this);
    this._openWarningsDialog = this._openWarningsDialog.bind(this);
    this._renderWarnings = this._renderWarnings.bind(this);

    this._closeProjectsDialog = this._closeProjectsDialog.bind(this);
    this._openProjectsDialog = this._openProjectsDialog.bind(this);
    this._renderProjects = this._renderProjects.bind(this);
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

  _openWarningsDialog(){
    this.setState({warningOpen:true});
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.props.singleWorkspaceStore.getWorkspaceId() + '/warnings/',
        success: function(data) {
          this.setState(data);
        }.bind(this)
      });
  }

  _closeWarningsDialog(){
    this.setState({warningOpen:false, warnings:null});
  }

  _openProjectsDialog(){
    this.setState({projectsOpen:true});
      $.ajax({
        type: 'GET',
        url: '/api/workspace/' + this.props.singleWorkspaceStore.getWorkspaceId() + '/projects/',
        success: function(data) {
          this.setState(data);
        }.bind(this)
      });
  }

  _closeProjectsDialog(){
    this.setState({projectsOpen:false, projects:null});
  }

  prepareWorkspaceMenu(){
    const workspaceID = this.props.singleWorkspaceStore.getWorkspaceId();
    return [
      <NavItem eventKey={1} href="#" key="1" onClick={this.openEditWorkspaceDialog.bind(this)}>
          <Glyphicon glyph="edit"></Glyphicon>
          &nbsp;Edit organization info
      </NavItem>,
      <NavItem eventKey={2} href="#" key="2" onClick={this._openImport}>
          <Glyphicon glyph="upload"></Glyphicon>
          &nbsp;Upload a map
      </NavItem>,
      <NavItem eventKey={3} href="#" key="3" onClick={this._openProjectsDialog.bind(this)}>
          <Glyphicon glyph="flash"></Glyphicon>
          &nbsp;Projects
      </NavItem>,
      <NavItem eventKey={4} href="#" key="4" onClick={this._openWarningsDialog.bind(this)}>
          <Glyphicon glyph="warning-sign"></Glyphicon>
          &nbsp;Warnings
      </NavItem>,
    ];
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

  _renderWarnings(warnings){
    if(!warnings || warnings.length === 0){
        return "Nothing to show";
    }

    let list = [];
    for(let i = 0; i < warnings.length; i++){
      let warning = warnings[i];
      if(warning.type === 'duplication'){
        let duplicationList = [];
        for(let j = 0; j < warning.affectedNodes.length; j++){
          let affectedNode = warning.affectedNodes[j];
          duplicationList.push(<NodeLink mapID={affectedNode.parentMap[0]} nodeID={affectedNode._id}/>);
          if(j !== warning.affectedNodes.length-1){
            duplicationList.push(", ");
          }
        }
        list.push(<li>Duplication of {duplicationList}.</li>);
      }
    }
    return <ul>{list}</ul>;
  }

  _renderProjects(projects){
    if(!projects || projects.length === 0){
        return "Nothing to show";
    }

    let list = [];
    let proposed = [];
    let executing = [];
    let rest = [];
    for(let i = 0; i < projects.length; i++){
      if(projects[i].state === 'PROPOSED'){
        proposed.push(projects[i]);
      } else if(projects[i].state === 'EXECUTING'){
        executing.push(projects[i]);
      } else {
        rest.push(projects[i]);
      }
    }
    if(proposed.length > 0){
      list.push(<span>Projects proposed for execution:</span>);
      let internalList = [];
      for(let i = 0; i <proposed.length; i++){
         let entry = [];
         entry.push(proposed[i].shortSummary);
         if(proposed[i].affectedNodes[0].parentMap){
           entry.push(" ");
           entry.push(<NodeLink mapID={proposed[i].affectedNodes[0].parentMap[0]} nodeID={proposed[i].affectedNodes[0]._id}/>);
         }
         internalList.push(<li>{entry}</li>);
      }
      list.push(<ul>{internalList}</ul>);
    }
    if(executing.length > 0){
      list.push(<span>Projects currently being executed:</span>);
      let internalList = [];
      for(let i = 0; i <executing.length; i++){
        let entry = [];
         entry.push(executing[i].shortSummary);
         if(executing[i].affectedNodes[0].parentMap){
           entry.push(" ");
           entry.push(<NodeLink mapID={executing[i].affectedNodes[0].parentMap[0]} nodeID={executing[i].affectedNodes[0]._id}/>);
         }
         internalList.push(<li>{entry}</li>);
      }
      list.push(<ul>{internalList}</ul>);
    }
    if(rest.length > 0){
      list.push(<span>Succeded, rejected, failed or deleted projects:</span>);
      let internalList = [];
      for(let i = 0; i <rest.length; i++){
        let entry = [];
         entry.push(rest[i].shortSummary);
         if(rest[i].affectedNodes[0].parentMap){
           entry.push(" ");
           entry.push(<NodeLink mapID={rest[i].affectedNodes[0].parentMap[0]} nodeID={rest[i].affectedNodes[0]._id}/>);
         }
         internalList.push(<li>{entry}</li>);
      }
      list.push(<ul>{internalList}</ul>);
    }
    return <ul>{list}</ul>;
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const singleWorkspaceStore = this.props.singleWorkspaceStore;
    const workspaceMenu = this.prepareWorkspaceMenu();
    const name = this.state.workspace.name;
    const purpose = this.state.workspace.purpose;
    const workspaceID = singleWorkspaceStore.getWorkspaceId();

    const maps = this.state.workspace.maps;
    const editors = this.state.workspace.owner;

    const errorCode = singleWorkspaceStore.getErrorCode();
    let mapList;
    if(!errorCode){
      mapList = (<MapList maps={maps} workspaceID={workspaceID} singleWorkspaceStore={singleWorkspaceStore}/>);
    } else if (errorCode === 404) {
      mapList = (<Alert bsStyle="warning"><p>You have no rights to access that workspace. Or it does not exist. One way or another, I cannot display it for you. </p><br/><LinkContainer to="/"><Button bsStyle="warning">Go back to your workspaces</Button></LinkContainer></Alert>);
    } else {
      mapList = (<Alert bsStyle="warning"><p>I am terribly sorry, I have found errorCode : {errorCode} and I do not know what to do next.</p><br/><LinkContainer to="/"><Button bsStyle="warning">Go back to your workspaces</Button></LinkContainer></Alert>);
    }

    const state = this.state;

    const warnings = this._renderWarnings(this.state.warnings);
    const projects = this._renderProjects(this.state.projects);

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
            {mapList}
            </Col>
            <Col xs={3} sm={3} md={3} lg={2}>
              <h4>Editors:</h4> <br/>
              <EditorList workspaceID={workspaceID} editors={editors} singleWorkspaceStore={singleWorkspaceStore}/>
            </Col>
          </Row>
          <EditWorkspaceDialog singleWorkspaceStore={singleWorkspaceStore}/>
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
          <Modal show={state.warningOpen} onHide={this._closeWarningsDialog}>
            <Modal.Header closeButton>
              <Modal.Title>
                Workspace Warnings
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {warnings}
            </Modal.Body>
            <Modal.Footer>
              <Button type="submit" bsStyle="primary" value="OK" onClick={this._closeWarningsDialog}>Close</Button>
            </Modal.Footer>
          </Modal>
          <Modal show={state.projectsOpen} onHide={this._closeProjectsDialog}>
            <Modal.Header closeButton>
              <Modal.Title>
                Workspace Projects
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {projects}
            </Modal.Body>
            <Modal.Footer>
              <Button type="submit" bsStyle="primary" value="OK" onClick={this._closeProjectsDialog}>Close</Button>
            </Modal.Footer>
          </Modal>
        </Grid>
      </DocumentTitle>
    );
  }
}
