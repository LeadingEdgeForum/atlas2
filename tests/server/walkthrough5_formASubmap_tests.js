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
q.longStackSupport = true;


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

  it("test submap initial impact diagonosis", function() {
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

  it("test submap second impact diagonosis", function() {
    let nodesToSubmap = [getId(maps[0].nodes[6]), getId(maps[0].nodes[7]), getId(maps[0].nodes[8])];

    // but prepare a second map with some nodes used
    return WardleyMap.findById(getId(maps[1])).exec()
      .then(function(map){
        return map.addNode("map-1-node-9", 0.7, 0.1, "INTERNAL", getId(currentWorkspace), "description", 0, owner).then(function(res){
          return WardleyMap.findById(getId(map)).exec();
        });
      })
      .then(function(map){
        return map.referenceNode(getId(maps[0].nodes[1]), 0.3, null).then(function(res){
          return WardleyMap.findById(getId(map)).exec();
        });
      })
      .then(function(map){
        return map.referenceNode(getId(maps[0].nodes[7]), 0.3, null).then(function(res){
          return WardleyMap.findById(getId(map)).exec();
        });
      })
      .then(function(map){
        return map.referenceNode(getId(maps[0].nodes[4]), 0.3, null).then(function(res){
          return WardleyMap.findById(getId(map)).populate('nodes').exec();
        });
      })
      .then(function(map){
        return map.nodes[0].makeDependencyTo(getId(map), getId(map.nodes[1])).then(function(res){
          return WardleyMap.findById(getId(map)).populate('nodes').exec();
        });
      })
      .then(function(map){
        return map.nodes[1].makeDependencyTo(getId(map), getId(map.nodes[2])).then(function(res){
          return WardleyMap.findById(getId(map)).populate('nodes').exec();
        });
      })
      .then(function(map){
        return map.nodes[2].makeDependencyTo(getId(map), getId(map.nodes[3])).then(function(res){
          return WardleyMap.findById(getId(map)).populate('nodes').exec();
        });
      })
      .then(function(map){
        maps[1] = map;
        return currentWorkspace.assessSubmapImpact(nodesToSubmap);
      })
      .then(function(impact){
        /* what depends on a map, we should find three nodes */
        /* those are all nodes that will depend on a created submap */
        let theSubmapWillBeADependencyTo = impact.nodesThatDependOnFutureSubmap.sort();
        should(theSubmapWillBeADependencyTo.length).be.equal(3);
        let expectedRequirers = [getId(maps[0].nodes[0]), getId(maps[0].nodes[1]), getId(maps[0].nodes[2])].sort();
        for(let i = 0; i < expectedRequirers.length; i++){
          should(expectedRequirers[i].equals(theSubmapWillBeADependencyTo[i])).be.true;
        }

        let inSubmapDependencies = impact.inSubmapDependencies;


        /* dependencies internal to a submap, contained by a submap, and identical across all the maps */
        /* the easiest part to deal when creating a submap */
        should(inSubmapDependencies.length).be.equal(2);

        /* internal dependencies, node 6 depends on 7 & 8 */
        should(inSubmapDependencies[0].node.name).be.equal('map-0-node-6');
        should(getId(inSubmapDependencies[0].node).equals(getId(maps[0].nodes[6]))).be.true;
        should(inSubmapDependencies[0].deps.length).be.equal(2);
        should(getId(inSubmapDependencies[0].deps[0]).equals(getId(maps[0].nodes[6]))).be.true;
        should(getId(inSubmapDependencies[0].deps[1]).equals(getId(maps[0].nodes[7]))).be.true;

        // console.log(inSubmapDependencies[1]);
        /* internal dependencies, node 7 depends on 8 (the only clean dependency of the 7th)*/
        should(inSubmapDependencies[1].node.name).be.equal('map-0-node-7');
        should(getId(inSubmapDependencies[1].node).equals(getId(maps[0].nodes[7]))).be.true;
        should(inSubmapDependencies[1].deps.length).be.equal(1);
        should(getId(inSubmapDependencies[1].deps[0]).equals(getId(maps[0].nodes[8]))).be.true;

        /* dirty dependencies - dependencies which are originating from the submap non-leaf nodes.
                 They may or may not be common to all maps, and if they are transformed into submap
                  dependency - it will mean a significant ingerence in a map structure, and potential
                  loss of information */

        // just 7 depending on 5 & 9
        let outgoingDanglingDependencies = impact.outgoingDanglingDependencies;
        should(outgoingDanglingDependencies.length).be.equal(1);
        should(outgoingDanglingDependencies[0].node.name).be.equal('map-0-node-7');
        should(getId(outgoingDanglingDependencies[0].node).equals(getId(maps[0].nodes[7]))).be.true;
        should(outgoingDanglingDependencies[0].deps.length).be.equal(2);

        should(getId(outgoingDanglingDependencies[0].deps[0]).equals(getId(maps[0].nodes[5]))).be.true;
        should(getId(outgoingDanglingDependencies[0].deps[1]).equals(getId(maps[1].nodes[2]))).be.true;


        /* clean dependencies, 8 depending on 3 & 4 */
        let outgoingDependencies = impact.outgoingDependencies;
        should(outgoingDependencies.length).be.equal(1);
        should(outgoingDependencies[0].node.name).be.equal('map-0-node-8');
        should(getId(outgoingDependencies[0].node).equals(getId(maps[0].nodes[7]))).be.true;
        should(outgoingDependencies[0].deps.length).be.equal(2);

        should(getId(outgoingDependencies[0].deps[0]).equals(getId(maps[0].nodes[3]))).be.true;
        should(getId(outgoingDependencies[0].deps[1]).equals(getId(maps[1].nodes[4]))).be.true;

        return impact;
      });
  });

// testing submapping with nodes from different maps is a bit too much for now.
  // it("test submap third impact diagnosis", function() {
  //   // includes one node from other map, maps[1].nodes[0] is the only note created (not referenced) on map 1
  //   let nodesToSubmap = [getId(maps[0].nodes[6]), getId(maps[0].nodes[7]), getId(maps[0].nodes[8]), getId(maps[1].nodes[0])];
  //
  //   // but prepare a second map with some nodes used
  //   return WardleyMap.findById(getId(maps[1])).populate('nodes').exec()
  //     .then(function(map){
  //       return currentWorkspace.assessSubmapImpact(nodesToSubmap);
  //     })
  //     .then(function(impact){
  //
  //       /* what depends on a map, we should find three nodes */
  //       /* those are all nodes that will depend on a created submap */
  //       let theSubmapWillBeADependencyTo = impact.nodesThatDependOnFutureSubmap.sort();
  //       should(theSubmapWillBeADependencyTo.length).be.equal(3);
  //       let expectedRequirers = [getId(maps[0].nodes[0]), getId(maps[0].nodes[1]), getId(maps[0].nodes[2])].sort();
  //       for(let i = 0; i < expectedRequirers.length; i++){
  //         should(expectedRequirers[i].equals(theSubmapWillBeADependencyTo[i])).be.true;
  //       }
  //
  //       let inSubmapDependencies = impact.inSubmapDependencies;
  //
  //       console.log(inSubmapDependencies);
  //       /* dependencies internal to a submap, contained by a submap, and identical across all the maps */
  //       /* the easiest part to deal when creating a submap */
  //       should(inSubmapDependencies.length).be.equal(2);
  //
  //       /* internal dependencies, node 6 depends on 7 & 8 */
  //       should(inSubmapDependencies[0].node.name).be.equal('map-0-node-6');
  //       should(getId(inSubmapDependencies[0].node).equals(getId(maps[0].nodes[6]))).be.true;
  //       should(inSubmapDependencies[0].deps.length).be.equal(2);
  //       should(getId(inSubmapDependencies[0].deps[0]).equals(getId(maps[0].nodes[6]))).be.true;
  //       should(getId(inSubmapDependencies[0].deps[1]).equals(getId(maps[0].nodes[7]))).be.true;
  //
  //       /* internal dependencies, node 7 depends on 8 and 9*/
  //       should(inSubmapDependencies[1].node.name).be.equal('map-0-node-7');
  //       should(getId(inSubmapDependencies[1].node).equals(getId(maps[0].nodes[7]))).be.true;
  //       should(getId(inSubmapDependencies[1].deps[0]).equals(getId(maps[0].nodes[8]))).be.true;
  //       should(getId(inSubmapDependencies[1].deps[1]).equals(getId(maps[1].nodes[0]))).be.true;
  //       should(inSubmapDependencies[1].deps.length).be.equal(2);
  //
  //       /* dirty dependencies - dependencies which are originating from the submap non-leaf nodes.
  //                They may or may not be common to all maps, and if they are transformed into submap
  //                 dependency - it will mean a significant ingerence in a map structure, and potential
  //                 loss of information */
  //
  //       // just 7 depending on 5
  //       let outgoingDanglingDependencies = impact.outgoingDanglingDependencies;
  //       should(outgoingDanglingDependencies.length).be.equal(1);
  //       should(outgoingDanglingDependencies[0].node.name).be.equal('map-0-node-7');
  //       should(getId(outgoingDanglingDependencies[0].node).equals(getId(maps[0].nodes[7]))).be.true;
  //       should(outgoingDanglingDependencies[0].deps.length).be.equal(1);
  //
  //       should(getId(outgoingDanglingDependencies[0].deps[0]).equals(getId(maps[0].nodes[5]))).be.true;
  //
  //
  //       /* clean dependencies, 8 depending on 3 & 4 AND 9 depending on 4 */
  //       let outgoingDependencies = impact.outgoingDependencies;
  //       should(outgoingDependencies.length).be.equal(2);
  //
  //       should(outgoingDependencies[0].node.name).be.equal('map-0-node-8');
  //       should(getId(outgoingDependencies[0].node).equals(getId(maps[0].nodes[7]))).be.true;
  //       should(outgoingDependencies[0].deps.length).be.equal(2);
  //
  //       should(getId(outgoingDependencies[0].deps[0]).equals(getId(maps[0].nodes[3]))).be.true;
  //       should(getId(outgoingDependencies[0].deps[1]).equals(getId(maps[1].nodes[4]))).be.true;
  //
  //
  //
  //       should(outgoingDependencies[1].node.name).be.equal('map-1-node-9');
  //       should(getId(outgoingDependencies[1].node).equals(getId(maps[1].nodes[0]))).be.true;
  //       should(outgoingDependencies[1].deps.length).be.equal(1);
  //
  //       should(getId(outgoingDependencies[1].deps[0]).equals(getId(maps[0].nodes[4]))).be.true;
  //       return impact;
  //     });
  // });





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
