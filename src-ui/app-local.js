/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import {IndexRoute, Route, browserHistory} from 'react-router';
import ReactStormpath, {Router, HomeRoute, LoginRoute, LogoutRoute, AuthenticatedRoute} from 'react-stormpath';
import {
  ChangePasswordPage,
  LocalMasterPage,
  LocalIndexPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ProfilePage
} from './pages';
import WorkspaceList from './pages/workspace/workspace-list';
import MapList from './pages/workspace/maps/map-list.js';
import Deduplicator from './pages/workspace/maps/deduplicator/deduplicator.js';
import WorkspaceMenu from './pages/workspace/workspace-menu.js';
import MapEditor from './pages/workspace/maps/editor/map-editor.js';
import MapMenu from './pages/workspace/maps/map-menu.js';

ReactStormpath.init();

ReactDOM.render(
  <Router history={browserHistory}>
  <HomeRoute path='/' component={LocalMasterPage}>
    <IndexRoute components={{
      mainContent: LocalIndexPage
    }}/>
    <LoginRoute path='login' components={{
      mainContent: LoginPage
    }}/>
    <LogoutRoute path='logout' components={{
      mainContent: LoginPage
    }}/>
    <AuthenticatedRoute path='workspace/:workspaceID' components={{
      mainContent: MapList,
      navMenu: WorkspaceMenu
    }}/>
    <AuthenticatedRoute path='deduplicate/:workspaceID' components={{
      mainContent: Deduplicator
    }}/>
    <AuthenticatedRoute path='map/:mapID' components={{
      mainContent: MapEditor,
      navMenu: MapMenu
    }}/>

  </HomeRoute>
</Router>, document.getElementById('app-container'));
