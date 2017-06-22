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
import {getStyleForType} from '../map-editor/component-styles';
import CapabilitiesView from './capabilities-view';
import MapLink from './maplink.js';
import CreateCategoryDialog from './dialogs/create-category';
import EditCategoryDialog from './dialogs/edit-category';

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

  renderAvailableComponents(map) {
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

  renderDeduplicationRow(workspaceId, fixitStore, unprocessedComponents, processedComponents){
    return <Row className="show-grid">
      <Col xs={3}>
        <h4>Unclassified components:</h4>
        {unprocessedComponents}
      </Col>
      <Col xs={9}>
        <h4>Capabilities:</h4>
        <CapabilitiesView dragStarted={dragStarted} fixitStore={fixitStore} workspaceId={workspaceId} categories={processedComponents}/>
      </Col>
    </Row>;
  }

  renderDeduplicationResultsOnly(workspaceId,fixitStore, processedComponents){
    return <Row className="show-grid">
      <Col xs={12}>
        <CapabilitiesView dragStarted={dragStarted} fixitStore={fixitStore} workspaceId={workspaceId} categories={processedComponents}/>
      </Col>
    </Row>;
  }

  render() {
    const auth = this.props.auth;
    const history = this.props.history;
    const fixitStore = this.props.fixitStore;
    const workspaceStore = this.props.singleWorkspaceStore;
    const pageTitle = 'Fix your organization!';

    const workspaceID = fixitStore.getWorkspaceId();
    const variantId = this.props.variantId;
    console.log(this.props);
    const workspaceName = workspaceStore.getWorkspaceInfo().workspace.name + ' - ' + workspaceStore.getWorkspaceInfo().workspace.purpose;


    var unprocessedComponents = fixitStore.getAvailableComponents(variantId);
    var processedComponents = fixitStore.getProcessedComponents(variantId);

    var _unprocessedComponents = unprocessedComponents.map(map => this.renderAvailableComponents(map));

    var row = null;
    if(_unprocessedComponents.length > 0){
      row = this.renderDeduplicationRow(workspaceID, fixitStore, _unprocessedComponents, processedComponents);
    } else {
      row = this.renderDeduplicationResultsOnly(workspaceID, fixitStore, processedComponents);
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
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item href={"/workspace/" + workspaceID}>
                {workspaceName}
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                Fixing it!
              </Breadcrumb.Item>
            </Breadcrumb>
          </Row>
          {row}
          <CreateCategoryDialog fixitStore={fixitStore} workspaceID={workspaceID}/>
          <EditCategoryDialog fixitStore={fixitStore} workspaceID={workspaceID}/>
        </Grid>
      </DocumentTitle>
    );
  }
}
