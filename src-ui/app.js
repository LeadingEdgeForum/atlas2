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
          ? <MapListPage singleWorkspaceStore={new SingleWorkspaceStore(props.match.params.workspaceID)} auth={auth} history={props.history}/>
          : AuthRedirect)
        }/>
    <Route exact path="/map/:mapID"
        render={
          (props) =>
          (auth.loggedIn()
          ? <MapEditorPage auth={auth} history={props.history} singleMapStore={new SingleMapStore(props.match.params.mapID)}/>
          : AuthRedirect)}/>
    <Route exact path="/fixit/:workspaceID"
        render={props =>
          (auth.loggedIn() ? <FixitPage auth={auth} history={props.history} fixitStore={new FixitStore(props.match.params.workspaceID)}/> : AuthRedirect)}/>
    <Redirect from="*" to="/" />
  </Switch>
</Router>, document.getElementById('app-container'));
