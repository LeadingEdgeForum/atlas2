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

import WorkspaceListStore from './workspace/workspace-list-store';
import SingleWorkspaceStore from './map-list/single-workspace-store';
import SingleMapStore from './map-editor/single-map-store';
import FixitStore from './fixit/fixit-store';

export const workspaceListStore = new WorkspaceListStore();

const singWorkspaceStores = {};
const fixitStores = {};
const singleMapStores = {};

export function getWorkspaceStore(workspaceID){
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

export function getFixitStore(workspaceID){
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

export function getSingleMapStore(mapID){
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

function cleanUpStore(store){
  Object.keys(store).forEach(function(key, index){
    store[key].undispatch();
    delete store[key];
  });
}

export function cleanUpStores(){
  workspaceListStore.reset();
  cleanUpStore(singWorkspaceStores);
  cleanUpStore(fixitStores);
  cleanUpStore(singleMapStores);
}
