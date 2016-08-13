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

ReactStormpath.init();
console.log(WelcomePage);

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
  </HomeRoute>
</Router>, document.getElementById('app-container'));
