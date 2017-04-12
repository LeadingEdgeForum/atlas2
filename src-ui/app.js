/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import {IndexRoute, Route, browserHistory, IndexRedirect, Router, Redirect} from 'react-router';
import MasterPage from './auth0/MasterPage';
import IndexPage from './auth0/IndexPage';
import WorkspaceList from './pages/workspace/workspace-list';
import MapList from './pages/workspace/maps/map-list.js';
import Deduplicator from './pages/workspace/maps/deduplicator/deduplicator.js';
import WorkspaceMenu from './pages/workspace/workspace-menu.js';
import MapEditor from './pages/workspace/maps/editor/map-editor.js';
import MapMenu from './pages/workspace/maps/map-menu.js';
import AuthService from './auth0/AuthService';
import $ from 'jquery';

const auth = new AuthService(___AUTH0_AUDIENCE___, ___AUTH0_ISSUER___);

const requireAuth = (nextState, replace) => {
  if (!auth.loggedIn()) {
    replace({ pathname: '/' });
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
