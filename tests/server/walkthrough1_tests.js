//#!/bin/env node
/* Copyright 2017 Leading Edge Forum

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
/*jslint node:true, mocha:true, expr: true */

var should = require('should');
var q = require('q');


var owner = "testy@mactest.test";
var mongoose = require('mongoose');
mongoose.Promise = q.Promise;
var getTestDB = require('../../src-server/mongodb-helper').getTestDB;
var mongooseConnection = mongoose.createConnection(getTestDB('walkthrough1_tests'));

var WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;
var currentMap = null;
describe('Create a node, store it on workspace and map level', function() {


  before(function(done) {
    Workspace
      .initWorkspace("name", "description", "purpose", owner)
      .then(function(workspace) {
        currentWorkspace = workspace;
        return workspace.createAMap({
          name: 'map name ' + 0,
          description: 'description' + 0,
          purpose: 'purpose' + 0,
          owner: owner
        });
      })
      .done(function(map, e) {
        currentMap = map;
        done(e);
      });
  });

  it("assert timeslice consistency", function() {
    should(currentWorkspace.timeline.length).be.equal(1);
    should(currentWorkspace.timeline[0]._id).be.equal(currentMap.timesliceId);
  });

  it("create a node", function(done) {
    currentMap.addNode("am-1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
      .then(function(map){
        return map.populate('workspace nodes').execPopulate();
      })
      .then(function(map) {
        should(map.nodes.length).be.equal(1);
        should(map.nodes[0].parentMap.length).be.equal(1);
        should(map.workspace.timeline.length).be.equal(1);
        should(map.workspace.timeline[0]._id.equals(map.timesliceId)).be.ok;
        should(map.workspace.timeline[0].maps.length).be.equal(1);
        should(map.workspace.timeline[0].nodes.length).be.equal(1);
      })
      .done(function(v, e) {
        done(e);
      });
  });

  after(function(done) {
    mongooseConnection.db.dropDatabase(
      function(err, result) {
        mongooseConnection.close(function(err, result) {
          done();
        });
      }
    );
  });

});
