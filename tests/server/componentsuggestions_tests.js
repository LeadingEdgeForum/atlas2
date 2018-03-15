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
var mongooseConnection = mongoose.createConnection(getTestDB('suggestions'));

var WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);

var findSuggestions = require('../../src-server/workspace/model/workspace/workspacemethods.js').findSuggestions;

var currentWorkspace = null;
var maps = [];

function createAMapWithNodes(workspace, index){
  return workspace.createAMap({
      name: 'map name ' + index,
      description: 'description' + index,
      purpose: 'purpose' + index,
      owner: owner
    })
    .then(function(map) {
      maps.push(map);
      let promises = [];
      promises.push(map.addNode("am-" + index + "-1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner));
      promises.push(map.addNode("bam-" + index + "-2", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner));
      promises.push(map.addNode("camd-" + index + "-3", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner));
      return q.allSettled(promises).then(function(){
        return map.defaultPopulate();
      });
    });
}


describe('Suggestion tests', function() {


    before(function(done) {
      Workspace
          .initWorkspace("name", "description", "purpose", owner)
          .then(function(workspace) {
              currentWorkspace = workspace;
              let promises = [];
              promises.push(createAMapWithNodes(workspace, 0));
              promises.push(createAMapWithNodes(workspace, 1));
              promises.push(createAMapWithNodes(workspace, 2));
              return q.allSettled(promises);
          })
          .done(function(v, e) {
              done(e);
          });
    });

    it("no match search", function(done) {
      findSuggestions(currentWorkspace, Node, currentWorkspace.getTimeSlice(null), '' + maps[0]._id, 'xyz')
      .then(function(nodes){
        should(nodes.length).be.equal(0);
      })
      .done(function(v, e) {
          done(e);
      });
    });

    it("search", function(done) {
      findSuggestions(currentWorkspace, Node, currentWorkspace.getTimeSlice(null), '' + maps[0]._id, 'camd')
      .then(function(nodes){
        should(nodes.length).be.equal(2);
      })
      .done(function(v, e) {
          done(e);
      });
    });

    it("search only from the first map", function(done) {
      //-0- appears in all nodes in the first map
      findSuggestions(currentWorkspace, Node, currentWorkspace.getTimeSlice(null), '' + maps[0]._id, '-0-')
      .then(function(nodes){
        should(nodes.length).be.equal(0);
      })
      .done(function(v, e) {
          done(e);
      });
    });

    it("search only from the second map", function(done) {
      findSuggestions(currentWorkspace, Node, currentWorkspace.getTimeSlice(null), '' + maps[0]._id, '-1-')
      .then(function(nodes){
        should(nodes.length).be.equal(3);
      })
      .done(function(v, e) {
          done(e);
      });
    });

    after(function(done) {
        mongooseConnection.db.dropDatabase(
          function(err, result){
            mongooseConnection.close(function(err, result){
              done();
            });
          }
        );
    });

});
