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
// import {IndexRoute, Route, browserHistory, IndexRedirect, Router, Redirect} from 'react-router

import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from 'react-router-dom';

import SplashPage from './auth0/SplashPage';
import WorkspaceListPage from './workspace/WorkspaceListPage';
import MapListPage from './map-list/MapListPage.js';
// import Deduplicator from './pages/workspace/maps/deduplicator/deduplicator.js';
// import WorkspaceMenu from './pages/workspace/workspace-menu.js';
// import MapEditor from './pages/workspace/maps/editor/map-editor.js';
// import MapMenu from './pages/workspace/maps/map-menu.js';
import AuthService from './auth0/AuthService';
import $ from 'jquery';
import WorkspaceListStore from './workspace/workspace-list-store';

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

ReactDOM.render(
  <Router>
  <Switch>
    <Route exact path="/"
        component={
          (props) =>
            (auth.loggedIn()
            ? <WorkspaceListPage auth={auth} history={props.history} workspaceListStore={workspaceListStore}/>
            : <SplashPage auth={auth} history={props.history}/>)
        }/>
    <Route exact path="/workspace/:workspaceID"
        render={
          (props) =>
          (auth.loggedIn()
          ? <MapListPage workspaceID={props.match.params.workspaceID} auth={auth} history={props.history}/>
          : AuthRedirect)
        }/>
    {/*<Route exact path="/deduplicate/:workspaceID" render={props => (auth.loggedIn() ? WorkspaceListPage : AuthRedirect)}/>
    <Route exact path="/map/:mapID" render={props => (auth.loggedIn() ? WorkspaceListPage : AuthRedirect)}/>*/}
    <Redirect from="*" to="/" />
  </Switch>
  {/*<Route path='/' component={MasterPage} auth={auth}>
    <IndexRedirect to="/" />
    <IndexRoute components={{
      mainContent: IndexPage
    }} auth={auth}/>
    <Route path='workspace/:workspaceID' components={{
      mainContent: MapList,
      navMenu: WorkspaceMenu
    }} onEnter={requireAuth}/>
    <Route path='deduplicate/:workspaceID' components={{
      mainContent: Deduplicator
    }} onEnter={requireAuth}/>
    <Route path='map/:mapID' components={{
      mainContent: MapEditor,
      navMenu: MapMenu
    }} onEnter={requireAuth}/>
  </Route>*/}
</Router>, document.getElementById('app-container'));
