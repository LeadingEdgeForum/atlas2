/*jshint esversion: 6 */
/* globals document */
import React from 'react';
import ReactDOM from 'react-dom';

import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from 'react-router-dom';

import SplashPage from './passport/google/SplashPage';
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

ReactDOM.render(
  <Router>
  <Switch>
    <Route exact path="/"
        component={
          (props) =>
            (auth.loggedIn(props.history, props.location) ? <WorkspaceListPage
                                              auth={auth}
                                              history={props.history}
                                              workspaceListStore={workspaceListStore}/>
            : <SplashPage auth={auth} history={props.history}/>)
        }/>
        <Route path="/(workspace|fixit)/:workspaceID" render={(props) => {
              if(!auth.loggedIn(props.history, props.location)) {
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
                    <Route exact path="/fixit/:workspaceID">
                      <FixitPage
                          auth={auth}
                          history={props.history}
                          singleWorkspaceStore={singleWorkspaceStore}
                          fixitStore={fixitStore}/>
                    </Route>
                  </Switch>
              );
            }
          }>
        </Route>
        <Route exact path="/map/:mapID"
            render={
              (props) =>
              (auth.loggedIn(props.history, props.location) ? <MapEditorPage
                                  auth={auth}
                                  history={props.history}
                                  singleMapStore={getSingleMapStore(props.match.params.mapID)}/>
              : AuthRedirect)}/>
    <Redirect from="*" to="/" />
  </Switch>
</Router>, document.getElementById('app-container'));
