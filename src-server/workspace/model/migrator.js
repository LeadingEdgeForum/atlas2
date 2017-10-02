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

  return Workspace.find({
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
  }).then(function(){
    return Workspace.find({
      schemaVersion: 1
    })
    .exec()
    .then(function(workspaces) {
      let prom = [];

      workspaces.forEach(function(workspace) {
        workspace.set('capabilityCategories', undefined, {strict:true});
        workspace.set('maps', undefined, {strict:true});
        workspace.schemaVersion = 2;
        workspace.timeline.forEach(function(timeslice){
          let mapList = timeslice.maps;
          timeslice.maps = [];
          mapList.forEach(function(map){
            if(timeslice.maps.indexOf(map) === -1){
              timeslice.maps.push(map);
            } else {
              console.log('removed duplicate');
            }
          });
        });
        workspace.markModified('timeline');
        prom.push(workspace.save());
      });

      return q.allSettled(prom);
    });
  }).then(function(){
    // versionless maps (not submaps) +  user + purpose -> name
    return WardleyMap.find({
      schemaVersion: {
        $exists: false
      },
      isSubmap : false
    }).then(function(listOfMaps){
        console.log('Found ' + listOfMaps.length + ' without schema');
        var mapPromises = [];

        listOfMaps.forEach(function(map) {
          map.name = "As " + map.user + ", I want to " + map.purpose + ".";
          map.schemaVersion = 2;
          mapPromises.push(map.save());
        });

        return q.allSettled(mapPromises);
    });
  }).then(function(){
    // version 1 maps (not submaps) +  user + purpose -> name
    return WardleyMap.find({
      schemaVersion: 1,
      isSubmap : false
    }).then(function(listOfMaps){
        console.log('Found ' + listOfMaps.length + ' without schema');
        var mapPromises = [];

        listOfMaps.forEach(function(map) {
          map.name = "As " + map.user + ", I want to " + map.purpose + ".";
          map.schemaVersion = 2;
          mapPromises.push(map.save());
        });

        return q.allSettled(mapPromises);
    }).then(function(){
      // version 1 submaps - just bump as they already use name instead of user + purpose
      return WardleyMap.find({
        schemaVersion: 1,
        isSubmap : true
      }).then(function(listOfMaps){
          console.log('Found ' + listOfMaps.length + ' submaps');
          var mapPromises = [];

          listOfMaps.forEach(function(map) {
            map.schemaVersion = 2;
            mapPromises.push(map.save());
          });

          return q.allSettled(mapPromises);
      });
    });
  });
};
