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
var mongooseConnection = null;

var WardleyMap = null;
var Workspace = null;
var Node = null;


var currentWorkspace = null;
var maps = [];
var currentNodeId;

describe('Verify connections work as expected', function() {


  before(function(done) {
    this.timeout(5000);
    mongooseConnection = mongoose.createConnection(getTestDB('walkthrough2_tests'));
    mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
    mongooseConnection.once('open', function callback() {
      WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
      Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
      Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);
      return Workspace
            .initWorkspace("name2", "description2", "purpose2", owner)
            .then(function(workspace) {
              currentWorkspace = workspace;
              return q.allSettled([workspace.createAMap({
                name: 'map name ' + 0,
                description: 'description' + 0,
                purpose: 'purpose' + 0,
                owner: owner
              }), workspace.createAMap({
                name: 'map name ' + 1,
                description: 'description' + 1,
                purpose: 'purpose' + 1,
                owner: owner
              })]);
            })
            .done(function(result, e) {
              maps.push(result[0].value);
              maps.push(result[1].value);
              done(e);
            });
    });
  });

  it("assert timeslice consistency", function() {
    should(currentWorkspace.timeline.length).be.equal(1);
    should(currentWorkspace.timeline[0]._id).be.equal(maps[0].timesliceId);
  });

  // it("create a node", function(done) {
  //   currentMap.addNode("am-1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
  //     .then(function(map){
  //       return map.populate('workspace nodes').execPopulate();
  //     })
  //     .then(function(map) {
  //       currentMap = map;
  //       should(map.nodes.length).be.equal(1);
  //       should(map.nodes[0].parentMap.length).be.equal(1);
  //       should(map.nodes[0].visibility[0].map.equals(map._id)).be.true;
  //       should(map.workspace.timeline.length).be.equal(1);
  //       should(map.workspace.timeline[0]._id.equals(map.timesliceId)).be.true;
  //       should(map.workspace.timeline[0].maps.length).be.equal(1);
  //       should(map.workspace.timeline[0].nodes.length).be.equal(1);
  //
  //       currentNodeId = map.nodes[0]._id;
  //     })
  //     .done(function(v, e) {
  //       done(e);
  //     });
  // });
  //
  // it("reference a node", function(done) {
  //   currentWorkspace.createAMap({
  //     name: 'map name ' + 1,
  //     description: 'description' + 1,
  //     purpose: 'purpose' + 1,
  //     owner: owner
  //   }).then(function(secondMap) {
  //     return secondMap.referenceNode(currentMap.nodes[0], 0.2, 0);
  //   }).then(function(secondMap) {
  //     secondCurrentMap = secondMap;
  //     // one node referenced twice
  //     should(secondMap.nodes[0].equals(currentMap.nodes[0]));
  //     return Node.findById(currentMap.nodes[0]._id).exec();
  //   }).then(function(node) {
  //     should(node.parentMap.length).be.equal(2); //the node is used twice
  //     should(node.parentMap).containEql(currentMap._id);
  //     should(node.parentMap).containEql(secondCurrentMap._id);
  //     should(node.visibility.length).be.equal(2);
  //     should(node.visibility).containDeepOrdered([{
  //       value: 0.5,
  //       map: currentMap._id
  //     }]);
  //     should(node.visibility).containDeepOrdered([{
  //       value: 0.2,
  //       map: secondCurrentMap._id
  //     }]);
  //   }).done(function(v, e) {
  //     done(e);
  //   });
  // });
  //
  // it("change a node", function(done) {
  //   const newName = "am-2";
  //   currentMap.changeNode(newName, 0.3, null, 200, "EXTERNAL", currentMap.nodes[0]._id, "description1", 1, owner)
  //     .then(function() {
  //
  //       return Node.findById(currentMap.nodes[0]._id).then(function(node) {
  //
  //         should(node.name).be.equal(newName);
  //
  //
  //         should(node.parentMap.length).be.equal(2); //the node is used twice
  //         should(node.parentMap).containEql(currentMap._id);
  //         should(node.parentMap).containEql(secondCurrentMap._id);
  //         should(node.evolution).be.equal(0.3); //evolution changes for every involved party
  //         should(node.visibility.length).be.equal(2);
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.5,
  //           map: currentMap._id
  //         }]);
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.2,
  //           map: secondCurrentMap._id
  //         }]);
  //       });
  //     })
  //     .done(function(v, e) {
  //       done(e);
  //     });
  // });
  //
  // it("change a node visibility", function(done) {
  //   currentMap.changeNode(null,null, 0.3, null, null, currentNodeId, null, null, null)
  //     .then(function() {
  //
  //       return Node.findById(currentMap.nodes[0]._id).then(function(node) {
  //
  //         should(node.parentMap.length).be.equal(2); //the node is used twice
  //         should(node.parentMap).containEql(currentMap._id);
  //         should(node.parentMap).containEql(secondCurrentMap._id);
  //
  //         should(node.evolution).be.equal(0.3); //evolution changes for every involved party
  //
  //         should(node.visibility.length).be.equal(2);
  //
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.3,
  //           map: currentMap._id
  //         }]);
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.2,
  //           map: secondCurrentMap._id
  //         }]);
  //       });
  //     })
  //     .done(function(v, e) {
  //       done(e);
  //     });
  // });
  //
  // it("change a node visibility and name", function(done) {
  //   const newName = "am-3";
  //   currentMap.changeNode(newName,null, 0.4, null, null, currentNodeId, null, null, null)
  //     .then(function() {
  //
  //       return Node.findById(currentMap.nodes[0]._id).then(function(node) {
  //
  //         should(node.name).be.equal(newName);
  //
  //         should(node.parentMap.length).be.equal(2); //the node is used twice
  //         should(node.parentMap).containEql(currentMap._id);
  //         should(node.parentMap).containEql(secondCurrentMap._id);
  //
  //         should(node.evolution).be.equal(0.3); //evolution changes for every involved party
  //
  //         should(node.visibility.length).be.equal(2);
  //
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.4,
  //           map: currentMap._id
  //         }]);
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.2,
  //           map: secondCurrentMap._id
  //         }]);
  //       });
  //     })
  //     .done(function(v, e) {
  //       done(e);
  //     });
  // });
  //
  // it("remove node from the first map", function(done) {
  //   currentMap.removeNode(currentNodeId)
  //     .then(function() { // check the node
  //       return Node.findById(currentNodeId).then(function(node) {
  //
  //         should(node.parentMap.length).be.equal(1); //the node is used twice
  //         should(node.parentMap).containEql(secondCurrentMap._id);
  //
  //         should(node.visibility.length).be.equal(1);
  //
  //         should(node.visibility).containDeepOrdered([{
  //           value: 0.2,
  //           map: secondCurrentMap._id
  //         }]);
  //       });
  //     })
  //     .then(function() { // check the map
  //       return WardleyMap.findById(currentMap._id).then(function(currentMap) {
  //         should(currentMap.nodes.length).be.equal(0); //the node is used twice
  //       });
  //     })
  //     .then(function() { // check the other map
  //       return WardleyMap.findById(secondCurrentMap._id).then(function(secondCurrentMap) {
  //         should(secondCurrentMap.nodes.length).be.equal(1); //the node is used twice
  //         should(secondCurrentMap.nodes).containEql(currentNodeId);
  //       });
  //     })
  //     .then(function() { // check workspace
  //       return Workspace.findById(secondCurrentMap.workspace).then(function(workspace) {
  //         should(workspace.timeline[0].nodes.length).be.equal(1); //the node is used twice
  //         should(workspace.timeline[0].nodes).containEql(currentNodeId);
  //       });
  //     })
  //     .done(function(v, e) {
  //       done(e);
  //     });
  // });
  //
  // it("remove node from the second map (and workspace)", function(done) {
  //   secondCurrentMap.removeNode(currentNodeId)
  //     .then(function() { // check the node
  //       return Node.findById(currentNodeId).then(function(node) {
  //         should(node).be.null; //the node has been just deleted (kabong!)
  //       });
  //     })
  //     .then(function() { // check the map
  //       return WardleyMap.findById(currentMap._id).then(function(currentMap) {
  //         should(currentMap.nodes.length).be.equal(0); //no nodes
  //       });
  //     })
  //     .then(function() { // check the other map
  //       return WardleyMap.findById(secondCurrentMap._id).then(function(secondCurrentMap) {
  //         should(secondCurrentMap.nodes.length).be.equal(0); //no nodes
  //       });
  //     })
  //     .then(function() { // check workspace
  //       return Workspace.findById(secondCurrentMap.workspace).then(function(workspace) {
  //         should(workspace.timeline[0].nodes.length).be.equal(0); //no nodes
  //       });
  //     })
  //     .done(function(v, e) {
  //       done(e);
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
