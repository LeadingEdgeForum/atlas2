/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import {IndexRoute, Route, browserHistory, IndexRedirect, Router, Redirect} from 'react-router';
import MasterPage from './passport/MasterPage';
import IndexPage from './passport/l-p/IndexPage';
import LoginPage from './passport/l-p/LoginPage';
import WorkspaceList from './pages/workspace/workspace-list';
import MapList from './pages/workspace/maps/map-list.js';
import Deduplicator from './pages/workspace/maps/deduplicator/deduplicator.js';
import WorkspaceMenu from './pages/workspace/workspace-menu.js';
import MapEditor from './pages/workspace/maps/editor/map-editor.js';
import MapMenu from './pages/workspace/maps/map-menu.js';
import $ from 'jquery';
import AuthStore from './passport/auth-store';

var authStore = new AuthStore();

const requireAuth = (nextState, replace) => {
  if (!authStore.isLoggedIn()) {
    replace({ pathname: '/' });
  }
};

const requireNotAuth = (nextState, replace) => {
  if (authStore.isLoggedIn()) {
    replace({ pathname: '/' });
  }
};

ReactDOM.render(
  <Router history={browserHistory}>
  <Route path='/' component={MasterPage} authStore={authStore}>
    <IndexRedirect to="/" />
    <IndexRoute components={{
      mainContent: IndexPage
    }} authStore={AuthStore}/>
    <Route path="/login" components={{
      mainContent : LoginPage
    }} onEnter={requireNotAuth}/>
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
