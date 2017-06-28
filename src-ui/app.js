/* Copyright 2017 Krzysztof Daniel

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
/* globals document */
/* globals localStorage */
/* globals ___AUTH0_AUDIENCE___ */
/* globals ___AUTH0_ISSUER___ */

import React from 'react';
import ReactDOM from 'react-dom';

import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from 'react-router-dom';

import SplashPage from './auth0/SplashPage';
import WorkspaceListPage from './workspace/WorkspaceListPage';
import MapListPage from './map-list/MapListPage';
import MapEditorPage from './map-editor/MapEditorPage';
import AuthService from './auth0/AuthService';
import $ from 'jquery';
import WorkspaceListStore from './workspace/workspace-list-store';
import SingleWorkspaceStore from './map-list/single-workspace-store';
import SingleMapStore from './map-editor/single-map-store';

import FixitPage from './fixit/FixitPage';
import FixitStore from './fixit/fixit-store';

//this is injected at build time
const auth = new AuthService(___AUTH0_AUDIENCE___, ___AUTH0_ISSUER___);


// ensure each ajax request contains autorhization header
$.ajaxSetup({
    beforeSend: function(xhr) {
        if (localStorage.getItem('id_token')) {
            xhr.setRequestHeader('authorization',
                'bearer ' + localStorage.getItem('id_token'));
        }
    }
});

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
          <Route path="/(workspace|fixit)/:workspaceID" render={(props) => {
                if(!loggedIn) {
                  return AuthRedirect;
                }
                const workspaceID = props.match.params.workspaceID;
                const singleWorkspaceStore = getWorkspaceStore(workspaceID);
                const fixitStore = getFixitStore(workspaceID);

                return (
                    <Switch>
                      <Route exact path="/workspace/:workspaceID">
                          <MapListPage
                            auth={auth}
                            history={props.history}
                            singleWorkspaceStore={singleWorkspaceStore} />
                      </Route>
                      <Route path="/fixit/:workspaceID/variant/:variantId" render={
                        (props) => {
                          return <FixitPage
                              auth={auth}
                              history={props.history}
                              singleWorkspaceStore={singleWorkspaceStore}
                              fixitStore={fixitStore}
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
                (props) =>
                (loggedIn ? <MapEditorPage
                                    auth={auth}
                                    history={props.history}
                                    singleMapStore={getSingleMapStore(props.match.params.mapID)}/>
                : AuthRedirect)}/>
          <Redirect from="*" to="/" />
    </Switch>
  </Router>
    );
  }
}

ReactDOM.render( <MainApp auth={auth}/>, document.getElementById('app-container'));
