/*jshint esversion: 6 */
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

var auth = new AuthStore();

const AuthRedirect = <Redirect to={{pathname: '/' }}/>;
const workspaceListStore = new WorkspaceListStore();

ReactDOM.render(
  <Router>
  <Switch>
    <Route exact path="/"
        component={
          (props) =>
            (auth.loggedIn(props.history)
            ? <WorkspaceListPage auth={auth} history={props.history} workspaceListStore={workspaceListStore}/>
            : <SplashPage auth={auth} history={props.history}/>)
        }/>
    <Route exact path="/login"
          component={
            (props) =>
              (auth.loggedIn(props.history) ? AuthRedirect
                : <LoginPage auth={auth} history={props.history}/>)
        }/>
    <Route exact path="/workspace/:workspaceID"
        render={
          (props) =>
          (auth.loggedIn(props.history)
          ? <MapListPage singleWorkspaceStore={new SingleWorkspaceStore(props.match.params.workspaceID)} auth={auth} history={props.history}/>
          : AuthRedirect)
        }/>
    <Route exact path="/map/:mapID"
        render={
          (props) =>
          (auth.loggedIn(props.history)
          ? <MapEditorPage auth={auth} history={props.history} singleMapStore={new SingleMapStore(props.match.params.mapID)}/>
          : AuthRedirect)}/>
    <Route exact path="/fixit/:workspaceID"
        render={props =>
          (auth.loggedIn(props.history) ? <FixitPage auth={auth} history={props.history} fixitStore={new FixitStore(props.match.params.workspaceID)}/> : AuthRedirect)}/>
    <Redirect from="*" to="/" />
  </Switch>
</Router>, document.getElementById('app-container'));
