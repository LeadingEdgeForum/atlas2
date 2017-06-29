/* Copyright 2017  Krzysztof Daniel.
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
var q = require('q');

module.exports = function(conn) {
  var WardleyMap = require('./map-schema')(conn);
  var Workspace = require('./workspace-schema')(conn);
  var Node = require('./node-schema')(conn);

  console.log('starting migration');

  Workspace.find({
    schemaVersion: {
      $exists: false
    }
  })
  .exec()
  .then(function(workspaces) {

    console.log('found ' + workspaces.length + 'workspaces without schemaVersion');

    var promises = [];
    workspaces.forEach(function(workspace) {


      promises.push(WardleyMap.find({
          schemaVersion: {
            $exists: false
          },
          workspace: workspace._id
        })
        .exec()
        .then(function(maps) {

          console.log('.. found ' + maps.length + ' maps belonging to workspace ' + workspace._id);

          var mapPromises = [];
          maps.forEach(function(map) {
            map.timesliceId = workspace.nowId; // by default, throw those maps into current timeslice
            map.schemaVersion = 1;
            mapPromises.push(map.save());
            mapPromises.push(workspace.insertMapIdAt(map._id, workspace.nowId));
          });

          console.log('updating maps');
          return q.allSettled(mapPromises);
        }));
        workspace.schemaVersion = 1;
        promises.push(workspace.save());


    });
    console.log('waiting for the migration to end');
    return q.allSettled(promises);
  });


  return;
};
