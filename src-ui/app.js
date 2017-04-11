/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import {IndexRoute, Route, browserHistory, IndexRedirect, Router, Redirect} from 'react-router';
import MasterPage from './pages/MasterPage';
import IndexPage from './pages/IndexPage';
import WorkspaceList from './pages/workspace/workspace-list';
import MapList from './pages/workspace/maps/map-list.js';
import Deduplicator from './pages/workspace/maps/deduplicator/deduplicator.js';
import WorkspaceMenu from './pages/workspace/workspace-menu.js';
import MapEditor from './pages/workspace/maps/editor/map-editor.js';
import MapMenu from './pages/workspace/maps/map-menu.js';
import AuthService from './auth0/AuthService';
import Login from './auth0/LoginPage';
import $ from 'jquery';

const auth = new AuthService('2AUDOUquJ-jTXCxT8d731Jtfrv_sBEj9', 'wardleymaps.eu.auth0.com');

const requireAuth = (nextState, replace) => {
  if (!auth.loggedIn()) {
    replace({ pathname: '/' });
  }
};

const parseAuthHash = (nextState, replace) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.parseHash(nextState.location.hash);
  }
};


$.ajaxSetup({
    beforeSend: function(xhr) {
        if (localStorage.getItem('id_token')) {
            xhr.setRequestHeader('authorization',
                'bearer ' + localStorage.getItem('id_token'));
        }
    }
});

ReactDOM.render(
  <Router history={browserHistory}>
  <Route path='/' component={MasterPage} auth={auth}>
    <IndexRedirect to="/" />
    <IndexRoute components={{
      mainContent: IndexPage
    }} auth={auth}/>
    <Route path="/login" components={{
      mainContent : Login
    }} onEnter={parseAuthHash}/>
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
    <Redirect from="*" to="/"/>
  </Route>
</Router>, document.getElementById('app-container'));
