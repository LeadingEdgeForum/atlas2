/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
import {IndexRoute, Route, browserHistory} from 'react-router';
import ReactStormpath, {Router, HomeRoute, LoginRoute, LogoutRoute, AuthenticatedRoute} from 'react-stormpath';
import {
  ChangePasswordPage,
  MasterPage,
  IndexPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ProfilePage
} from './pages';
import WelcomePage from './pages/WelcomePage.js';
import WorkspaceList from './pages/workspace/workspace-list';
import MapList from './pages/workspace/maps/map-list.js';
import Deduplicator from './pages/workspace/maps/deduplicator.js';
import WorkspaceNavInfo from './pages/workspace/workspace-navbar-info.js';
import MapEditor from './pages/workspace/maps/editor/map-editor.js';

ReactStormpath.init();

ReactDOM.render(
  <Router history={browserHistory}>
  <HomeRoute path='/' component={MasterPage}>
    <IndexRoute components={{
      mainContent: IndexPage
    }}/>
    <LoginRoute path='login' components={{
      mainContent: LoginPage
    }}/>
    <LogoutRoute path='logout' components={{
      mainContent: LoginPage
    }}/>
    <Route path='verify' components={{
      mainContent: VerifyEmailPage
    }}/>
    <Route path='register' components ={{
      mainContent: RegisterPage
    }}/>
    <Route path='change' components={{
      mainContent: ChangePasswordPage
    }}/>
    <Route path='forgot' components={{
      mainContent: ResetPasswordPage
    }}/>
    <AuthenticatedRoute path='profile' components={{
      mainContent: ProfilePage
    }}/>
    <AuthenticatedRoute path='workspace/:workspaceID' components={{
      mainContent: MapList,
      navMenu: WorkspaceNavInfo
    }}/>
    <AuthenticatedRoute path='deduplicate/:workspaceID' components={{
      mainContent: Deduplicator
    }}/>
    <AuthenticatedRoute path='map/:mapID' components={{
      mainContent: MapEditor
    }}/>

  </HomeRoute>
</Router>, document.getElementById('app-container'));
