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
/* jshint -W083 */
/*jslint node:true, mocha:true, expr: true */

var should = require('should');
var q = require('q');


var owner = "testy@mactest.test";
var mongoose = require('mongoose');
mongoose.Promise = q.Promise;

var getTestDB = require('../../src-server/mongodb-helper').getTestDB;
var getId = require('../../src-server/util/util.js').getId;
var mongooseConnection = null;

var WardleyMap = null;
var Workspace = null;
var Node = null;


var currentWorkspace = null;
var maps = [];
var nodes = [];

describe('Verify forming a submap - impact analysis', function() {


  before(function(done) {
    mongooseConnection = mongoose.createConnection(getTestDB('walkthrough5_tests'));
    mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
    mongooseConnection.once('open', function callback() {
      WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
      Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
      Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);
      return Workspace
            .initWorkspace("name2", "description2", "purpose2", owner)
            .then(function(workspace) {
              currentWorkspace = workspace;
              let createMapPromises = [];
              for(let i = 0; i < 4; i++){
                createMapPromises.push(workspace.createAMap({
                  name: 'map name ' + i,
                  description: 'description' + i,
                  purpose: 'purpose' + i,
                  owner: owner
                }));
              }
              return q.allSettled(createMapPromises);
            })
            .then(function(createdMaps) {
              for (let i = 0; i < createdMaps.length; i++) {
                maps.push(createdMaps[i].value);
              }
            })
            .then(function(result) {
                  let nodePromises = [];

                  let chain = q.when(null);

                  const createNode = function(i, map) {
                    return WardleyMap.findById(getId(maps[0])).exec()
                    .then(function(map){
                      return map.addNode("map-0-node-" + i, 0.1 + (i / 10), 0.1 + (i / 10), "INTERNAL", getId(currentWorkspace), "description", 0, owner);
                    });
                  };

                  for (let i = 0; i < 9; i++) {
                    chain = chain.then(createNode.bind(null,i));
                  }

                  return chain;
            })
            .then(function(res){
              return WardleyMap.findById(getId(maps[0])).populate('nodes').exec().then(function(map) {
                maps[0] = map;
                let n = map.nodes;
                return n[0].makeDependencyTo(getId(map), getId(n[6]))
                  .then(function(){
                    return n[1].makeDependencyTo(getId(map), getId(n[6]));
                  })
                  .then(function(){
                    return n[2].makeDependencyTo(getId(map), getId(n[7]));
                  })
                  .then(function(){
                    return n[6].makeDependencyTo(getId(map), getId(n[7]));
                  })
                  .then(function(){
                    return n[6].makeDependencyTo(getId(map), getId(n[8]));
                  })
                  .then(function(){
                    return n[7].makeDependencyTo(getId(map), getId(n[8]));
                  })
                  .then(function(){
                    return n[7].makeDependencyTo(getId(map), getId(n[5]));
                  })
                  .then(function(){
                    return n[8].makeDependencyTo(getId(map), getId(n[3]));
                  })
                  .then(function(){
                    return n[8].makeDependencyTo(getId(map), getId(n[4]));
                  });
              });
            })
            .done(function(r,e){
              done(e);
            });
    });
  });

  it("test submap impact diagonosis", function() {
    let nodesToSubmap = [getId(maps[0].nodes[6]), getId(maps[0].nodes[7]), getId(maps[0].nodes[8])];
    return currentWorkspace.assessSubmapImpact(nodesToSubmap).then(function(impact) {

      /* what depends on a map, we should find three nodes */
      let theSubmapWillBeADependencyTo = impact.nodesThatDependOnFutureSubmap.sort();
      should(theSubmapWillBeADependencyTo.length).be.equal(3);
      let expectedRequirers = [getId(maps[0].nodes[0]), getId(maps[0].nodes[1]), getId(maps[0].nodes[2])].sort();
      for(let i = 0; i < expectedRequirers.length; i++){
        should(expectedRequirers[i].equals(theSubmapWillBeADependencyTo[i])).be.true;
      }

      /* what the map depends on, we should find 2 dependencies (3 & 4)
       * derived from one node*/
      let submapCleanDependencies = impact.outgoingDependencies;
      should(submapCleanDependencies.length).be.equal(1);
      should(getId(submapCleanDependencies[0].node).equals(getId(maps[0].nodes[8]))).be.true;
      should(submapCleanDependencies[0].deps.length).be.equal(2);
      should(getId(submapCleanDependencies[0].deps[0]).equals(getId(maps[0].nodes[3]))).be.true;
      should(getId(submapCleanDependencies[0].deps[1]).equals(getId(maps[0].nodes[4]))).be.true;


      /* internal, dangling references */
      let outgoingDanglingDependencies = impact.outgoingDanglingDependencies;
      should(outgoingDanglingDependencies.length).be.equal(1);

      let inSubmapDependencies = impact.inSubmapDependencies;
      /* internal dependencies */
      should(inSubmapDependencies.length).be.equal(2);
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
