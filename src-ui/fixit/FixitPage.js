/*jshint esversion: 6 */

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import {
  Grid,
  Row,
  Col,
  Breadcrumb,
  NavItem,
  Glyphicon,
  Alert,
  Button
} from 'react-bootstrap';
import AtlasNavbarWithLogout from '../atlas-navbar-with-logout';
import {getStyleForType} from '../map-editor/component-styles';
import CapabilitiesView from './capabilities-view';
import MapLink from './maplink.js';
import CreateCategoryDialog from './dialogs/create-category';
import EditCategoryDialog from './dialogs/edit-category';
import {LinkContainer} from 'react-router-bootstrap';

var draggableComponentStyle = {
  borderWidth: '1px',
  borderColor: 'silver',
  borderStyle: 'solid',
  minHeight: '14px',
  margin: '10px',
  display: 'inline-block',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '5px'
};

var dragStarted = false;

export default class FixitPage extends React.Component {

  constructor(props) {
    super(props);
    this.render = this.render.bind(this);
    this._onChange = this._onChange.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.render = this.render.bind(this);
    this.render = this.render.bind(this);
    this.render = this.render.bind(this);
    this.render = this.render.bind(this);
  }

  componentDidMount() {
    this.props.fixitStore.addChangeListener(this._onChange);
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    this.props.fixitStore.addChangeListener(this._onChange);
    this.props.singleWorkspaceStore.addChangeListener(this._onChange);
  }

  _onChange(){
    this.forceUpdate();
  }

  handleDragStart(node, e) {
    var target = e.target;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('json', JSON.stringify(node));
    dragStarted = true;
    this.forceUpdate();
  }

  handleDragStop(node, e) {
    dragStarted = false;
    this.forceUpdate();
  }

  renderAvailableComponents(map, variantId) {
    var nodes = [];
    nodes = map.nodes.map(node =>
      (<div data-item={node}
        draggable="true"
        style={draggableComponentStyle}
        onDragEnd={this.handleDragStop.bind(this, node)}
        onDragStart={this.handleDragStart.bind(this, node)}
        key={node._id}>
        <div style={getStyleForType(node.type)}></div>
            {node.name}
         </div>
      ));
    return (<div key={map._id}><h5><MapLink mapID={map._id}/></h5>{nodes}</div>);
  }

  renderDeduplicationRow(workspaceId, variantId, fixitStore, unprocessedComponents, processedComponents){
    return <Row className="show-grid">
      <Col xs={3}>
        <h4>Unclassified components:</h4>
        {unprocessedComponents}
      </Col>
      <Col xs={9}>
        <h4>Capabilities:</h4>
        <CapabilitiesView dragStarted={dragStarted} fixitStore={fixitStore} workspaceId={workspaceId} variantId={variantId} categories={processedComponents}/>
      </Col>
    </Row>;
  }

  renderDeduplicationResultsOnly(workspaceId, variantId, fixitStore, processedComponents){
    return <Row className="show-grid">
      <Col xs={12}>
        <CapabilitiesView dragStarted={dragStarted} fixitStore={fixitStore} variantId={variantId} workspaceId={workspaceId} categories={processedComponents}/>
      </Col>
    </Row>;
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const fixitStore = this.props.fixitStore;
    const workspaceStore = this.props.singleWorkspaceStore;
    if(workspaceStore.getErrorCode()){
      let message = "";
      if(workspaceStore.getErrorCode() === 404){
        message = "You have no rights to access this map. Or maybe it does not exist. One way or another, I cannot display it for you.";
      } else {
        message = "I am terribly sorry, I have found errorCode : " + workspaceStore.getErrorCode() + " and I do not know what to do next.";
      }
      return (
        <DocumentTitle title="Sorry! No access!">
          <Grid fluid={true}>
            <Row >
              <Col xs={16}>
                <Alert bsStyle="warning"><p>{message}</p><br/><LinkContainer to="/"><Button bsStyle="warning">Go back to your workspaces</Button></LinkContainer></Alert>
              </Col>
            </Row>
          </Grid>
        </DocumentTitle>
      );
    }
    const pageTitle = 'Fix your organization!';

    const workspaceID = fixitStore.getWorkspaceId();
    const variantId = this.props.variantId;
    const workspaceName = workspaceStore.getWorkspaceInfo().workspace.name + ' - ' + workspaceStore.getWorkspaceInfo().workspace.purpose;


    var unprocessedComponents = fixitStore.getAvailableComponents(variantId);
    var processedComponents = fixitStore.getProcessedComponents(variantId);

    var _unprocessedComponents = unprocessedComponents.map(map => this.renderAvailableComponents(map, variantId));

    var row = null;
    if(_unprocessedComponents.length > 0){
      row = this.renderDeduplicationRow(workspaceID, variantId, fixitStore, _unprocessedComponents, processedComponents);
    } else {
      row = this.renderDeduplicationResultsOnly(workspaceID, variantId, fixitStore, processedComponents);
    }

    return (
      <DocumentTitle title={pageTitle}>
        <Grid fluid={true}>
          <Row >
            <Col xs={16} md={16}>
              <AtlasNavbarWithLogout
                auth={auth}
                history={history}/>
            </Col>
          </Row>
          <Row className="show-grid">
            <Breadcrumb>
              <LinkContainer to="/"><Breadcrumb.Item href="/">Home</Breadcrumb.Item></LinkContainer>
              <LinkContainer to={"/workspace/" + workspaceID}><Breadcrumb.Item href={"/workspace/" + workspaceID}>
                {workspaceName}
              </Breadcrumb.Item></LinkContainer>
              <Breadcrumb.Item active>
                Fixing it!
              </Breadcrumb.Item>
            </Breadcrumb>
          </Row>
          {row}
          <CreateCategoryDialog fixitStore={fixitStore} workspaceID={workspaceID} variantId={variantId}/>
          <EditCategoryDialog fixitStore={fixitStore} workspaceID={workspaceID} variantId={variantId}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
