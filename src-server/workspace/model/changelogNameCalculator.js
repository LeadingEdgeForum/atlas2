/* Copyright 2018  Krzysztof Daniel.
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
var moment = require('moment');

let calculateTime = function(entryTime, clientTime){
  //TODO: calculate diff relative to the customer time (!)
  return moment(entryTime).format('MMMM Do YYYY, hh:mm:ss');
};

let workspaceHistoryEntryToString = function(historyEntry, /*Date*/ clientTime){
  let changes = historyEntry.changes;
  let actor = historyEntry.actor;

  let time = calculateTime(historyEntry.date, clientTime);

  // this means the workspace has been just created
  if((changes[0].fieldName === 'status') && (changes[0].newValue === 'EXISTING')){
    return '\'' + actor + '\' created this workspace on \'' + time + '\'.';
  }

  if((changes[0].fieldName === 'owner')){
    if(changes[0].operationType === 'ADD'){
      return '\'' + actor + '\' invited \'' + changes[0].newValue + '\' to this workspace.';
    }
    if(changes[0].operationType === 'REMOVE'){
      return '\'' + actor + '\' removed \'' + changes[0].newValue + '\'s access to this workspace.';
    }
  }

  if((changes[0].fieldName === 'name')){
    if(changes[0].operationType === 'SET'){
      return '\'' + actor + '\' renamed workspace to \'' + changes[0].newValue + '\'.';
    }
  }
  return historyEntry;
};


module.exports.workspaceHistoryEntryToString = workspaceHistoryEntryToString;
