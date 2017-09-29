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
/*jslint node:true, mocha:true, expr: true */
var should = require('should');
var q = require('q');


var owner = "testy@mactest.test";
var mongoose = require('mongoose');
mongoose.Promise = q.Promise;
var MongoDBConnection = require('../../src-server/mongodb-helper');
var mongooseConnection = mongoose.createConnection(MongoDBConnection.test_usage.connectionURL);

var WardleyMap = require('../../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;
var currentMap1 = null;
var currentMap2 = null;
var emptySubmap = null;

describe('User tests', function() {


    before(function(done) {
        Workspace
            .initWorkspace("name", "description", "purpose", owner)
            .then(function(workspace) {
                currentWorkspace = workspace;
            })
            .done(function(v, e) {
                done(e);
            });
    });

    after(function(done) {
        mongooseConnection.db.dropDatabase();
        done();
    });


    it("map creation with no timeslice", function(done) {
      currentWorkspace.createAMap({
          name: 'name1',
          description: 'description1',
          purpose: 'purpose1',
          owner: owner
        })
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          currentWorkspace.timeline[0].maps[0].equals(currentMap1._id).should.be.true;
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("add first node to the first map", function(done) {
      currentMap1.addNode("name1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
        .then(function(map){
          return map.defaultPopulate();
        })
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          should.exist(currentMap1.nodes[0]);
          should.exist(currentMap1.nodes[0]._id);
        })
        .done(function(v, e) {
          done(e);
        });
    });


    it("add first user to the first map", function(done) {
      currentMap1.addUser({name:'name', description:'description', x: 0.1, y: 0.1})
        .then(function(map){
          return map.defaultPopulate();
        })
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          should.exist(currentMap1.users[0]);
          should.exist(currentMap1.users[0]._id);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("connect user", function(done) {
      currentMap1.makeUserDepTo(''+currentMap1.users[0]._id, ''+currentMap1.nodes[0]._id)
        .then(function(map){
          return map.defaultPopulate();
        })
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          should.exist(currentMap1.users[0].associatedNeeds[0]);
          should(''+currentMap1.users[0].associatedNeeds[0]).be.equal(''+currentMap1.nodes[0]._id);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("remove node", function(done) {
      currentMap1.removeNode(''+currentMap1.nodes[0]._id)
        .then(function(map){
          return map.defaultPopulate();
        })
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          // when a node is removed, the user should no longer hold a reference to it
          should(currentMap1.nodes.length).be.equal(0);
          should(currentMap1.users[0].associatedNeeds.length).be.equal(0);
        })
        .done(function(v, e) {
          done(e);
        });
    });



});
