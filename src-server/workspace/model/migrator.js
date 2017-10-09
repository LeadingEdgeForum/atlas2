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
    let mapsToMigrate =  WardleyMap.find().cursor();
    mapsToMigrate.on('data', function(_map){
      let _this = this;
      // if(!_map.user || !_map.purpose){
      //   console.warn(_map);
      // }
      if(!_map.isSubmap && _map.schemaVersion !== 3 && !_map.archived){
        if(_map.user && _map.purpose){
          console.log('updating map', _map.user, _map.purpose, _map.isSubmap);
          _map.name = "As " + _map.user + ", I want to " + _map.purpose + ".";
          _map.schemaVersion = 3;
          _map.save();
        } else {
          console.error(_map.user, _map.name, _map.purpose, _map.isSubmap);
        }
      }
    });
    mapsToMigrate.on('error', function(e){
      console.log(e);
    });
    mapsToMigrate.on('close', function(){
      console.log('done done');
    });

  }).then(function(){
    console.log('migration done');
  });
};
