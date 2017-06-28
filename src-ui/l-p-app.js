/*jshint esversion: 6 */
/* globals document */
import React from 'react';
import ReactDOM from 'react-dom';

import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from 'react-router-dom';

import SplashPage from './passport/l-p/SplashPage';
import LoginPage from './passport/l-p/LoginPage';
import WorkspaceListPage from './workspace/WorkspaceListPage';
import MapListPage from './map-list/MapListPage';
import MapEditorPage from './map-editor/MapEditorPage';
import WorkspaceListStore from './workspace/workspace-list-store';
import SingleWorkspaceStore from './map-list/single-workspace-store';
import SingleMapStore from './map-editor/single-map-store';

import FixitPage from './fixit/FixitPage';
import FixitStore from './fixit/fixit-store';

import AuthStore from './passport/auth-store';
var jsPlumb = require('../node_modules/jsplumb/dist/js/jsplumb.min.js').jsPlumb;
var auth = new AuthStore();

const AuthRedirect = <Redirect to={{pathname: '/' }}/>;

const workspaceListStore = new WorkspaceListStore();

const singWorkspaceStores = {};
const fixitStores = {};
const singleMapStores = {};

function getWorkspaceStore(workspaceID){
  Object.keys(singWorkspaceStores).forEach(function(key, index) {
    if(key === workspaceID){
      singWorkspaceStores[key].redispatch();
      return;
    }
    singWorkspaceStores[key].undispatch();
  });
  if(!singWorkspaceStores[workspaceID]){
    singWorkspaceStores[workspaceID] = new SingleWorkspaceStore(workspaceID);
  }
  return singWorkspaceStores[workspaceID];
}

function getFixitStore(workspaceID){
  Object.keys(fixitStores).forEach(function(key, index) {
    if(key === workspaceID){
      fixitStores[key].redispatch();
      return;
    }
    fixitStores[key].undispatch();
  });
  if(!fixitStores[workspaceID]){
    fixitStores[workspaceID] = new FixitStore(workspaceID);
  }
  return fixitStores[workspaceID];
}

function getSingleMapStore(mapID){
  Object.keys(singleMapStores).forEach(function(key, index) {
    if(key === mapID){
      singleMapStores[key].redispatch();
      return;
    }
    singleMapStores[key].undispatch();
  });
  if(!singleMapStores[mapID]){
    singleMapStores[mapID] = new SingleMapStore(mapID);
  }
  return singleMapStores[mapID];
}

class MainApp extends React.Component {
  constructor(props){
    super(props);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.state = {
      loggedIn: props.auth.loggedIn()
    };
  }

  componentDidMount(){
    this.props.auth.addChangeListener(this._onChange);
  }

  componentWillUnmount(){
    this.props.auth.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      loggedIn: this.props.auth.loggedIn()
    });
  }

  render(){
    let loggedIn = this.state.loggedIn;
    return (
      <Router>
      <Switch>
        <Route exact path="/"
            component={
              (props) =>
                (loggedIn ? <WorkspaceListPage
                                auth={auth}
                                history={props.history}
                                workspaceListStore={workspaceListStore}/>
                : <SplashPage auth={auth}/>)
            }/>
        <Route exact path="/login"
              component={
                (props) =>
                  (loggedIn ? AuthRedirect
                    : <LoginPage auth={auth}/>)
            }/>
            <Route path="/(workspace|fixit)/:workspaceID" render={(props) => {
                  if(!loggedIn) {
              		  auth.next(props.location, props.history);
                    return AuthRedirect;
                  }

                  return (
                      <Switch>
                        <Route exact path="/workspace/:workspaceID">
                            <MapListPage
                              auth={auth}
                              history={props.history}
                              singleWorkspaceStore={getWorkspaceStore(props.match.params.workspaceID)} />
                        </Route>
                        <Route path="/fixit/:workspaceID/variant/:variantId" render={
                          (props) => {
                            return <FixitPage
                                auth={auth}
                                history={props.history}
                                singleWorkspaceStore={getWorkspaceStore(props.match.params.workspaceID)}
                                fixitStore={getFixitStore(props.match.params.workspaceID)}
                                variantId={props.match.params.variantId}/>;
                          }
                        }/>
                      </Switch>
                  );
                }
              }>
            </Route>
            <Route exact path="/map/:mapID"
                render={
                (props) => {
   		         if (!loggedIn) {
      		        auth.next(props.location, props.history);
       		     }
      		      return (loggedIn ? <MapEditorPage
                                  auth={auth}
                                  history={props.history}
                                  singleMapStore={getSingleMapStore(props.match.params.mapID)}/>
                  	: AuthRedirect);
          }}/>
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
    );
  }
}

ReactDOM.render( <MainApp auth={auth}/>, document.getElementById('app-container'));
