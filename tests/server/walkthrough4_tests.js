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
var getId = require('../../src-server/util/util.js').getId;
var mongooseConnection = null;

var WardleyMap = null;
var Workspace = null;
var Node = null;


var currentWorkspace = null;
var maps = [];
var nodes = [];

describe('Verify deleting a map', function() {


  before(function(done) {
    mongooseConnection = mongoose.createConnection(getTestDB('walkthrough4_tests'));
    mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
    mongooseConnection.once('open', function callback() {
      WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
      Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
      Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);
      return Workspace
            .initWorkspace("name2", "description2", "purpose2", owner)
            .then(function(workspace) {
              currentWorkspace = workspace;
              return workspace.createAMap({
                name: 'map name ' + 0,
                description: 'description' + 0,
                purpose: 'purpose' + 0,
                owner: owner
              })
              .then(function(createdMap){
                maps.push(createdMap);
                return workspace.createAMap({
                  name: 'map name ' + 1,
                  description: 'description' + 1,
                  purpose: 'purpose' + 1,
                  owner: owner
                });
              });
            })
            .then(function(createdMap) {
              maps.push(createdMap);
              return maps[0]
                .addNode("am-1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
                .then(function() {
                  return maps[0].addNode("am-2", 0.6, 0.6, "INTERNAL", currentWorkspace._id, "description", 0, owner);
                })
                .then(function() {
                  return maps[1].addNode("am-3", 0.7, 0.7, "INTERNAL", currentWorkspace._id, "description", 0, owner);
                });
            })
            .done(function(r,e){
              done(e);
            });
    });
  });

  it("establish a connection", function() {
    nodes.push(getId(maps[0].nodes[0]));
    nodes.push(getId(maps[0].nodes[1]));
    return Node
      .findById(nodes[0])
      .then(function(node) {
        return node.makeDependencyTo(getId(maps[0]), getId(nodes[1]));
      })
      .then(function(node) {
        should(node.dependencies.length).be.equal(1);
        let dep = node.dependencies[0];
        should(dep.visibleOn.length).be.equal(1);
        should(dep.visibleOn[0].equals(getId(maps[0]))).be.true;
      });
  });

  it("reference both nodes on a second map, the connection should not become visible on the second map", function() {
    return maps[1].referenceNode(nodes[0], 0.3, 0)
      .then(function() {
        return maps[1].referenceNode(nodes[1], 0.9, 0);
      })
      .then(function() {
        return Node
          .findById(nodes[0])
          .then(function(node) {
            should(node.dependencies.length).be.equal(1);
            let dep = node.dependencies[0];
            should(dep.visibleOn.length).be.equal(1);
            should(dep.visibleOn[0].equals(getId(maps[0]))).be.true;
          });
      });
  });

  it("establish a connection on a second map", function() {
    return Node
      .findById(nodes[0])
      .then(function(node) {
        return node.makeDependencyTo(getId(maps[1]), getId(nodes[1]));
      })
      .then(function(node) {
        should(node.dependencies.length).be.equal(1);
        let dep = node.dependencies[0];

        should(dep.target.equals(getId(nodes[1]))).be.true;
        should(dep.visibleOn.length).be.equal(2);
        //the connection is visible on both maps
        should(dep.visibleOn[0].equals(getId(maps[0]))).be.true;
        should(dep.visibleOn[1].equals(getId(maps[1]))).be.true;
      });
  });

  it("delete a node on the second map", function() {
    return WardleyMap.findById(getId(maps[1])).exec()
      .then(function(map) {
        return map.removeNode(getId(nodes[0]));
      })
      .then(function() {
        return Node.findById(getId(nodes[0]));
      })
      .then(function(node) {
        should(node.dependencies.length).be.equal(1); //the dependency is still there
        should(node.dependencies[0].visibleOn.length).be.equal(1); //but visible on the first map only
        should(getId(maps[0]).equals(node.dependencies[0].visibleOn[0])).be.true;
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
