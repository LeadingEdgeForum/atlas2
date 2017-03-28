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
/*jslint node:true, mocha:true */
var should = require('should');
var q = require('q');


var owner = "testy@mactest.test";
var mongoose = require('mongoose');
mongoose.Promise = q.Promise;
var mongooseConnection = mongoose.createConnection("mongodb://localhost:27017/test-usage");
// var MongoDBConnectionURL = require('../src-server/mongodb-helper');
// var mongooseConnection = mongoose.connect(MongoDBConnectionURL);

var WardleyMap = require('../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;
var currentMap1 = null;
var currentMap2 = null;

describe('Usage tests', function() {


    before(function(done) {
        Workspace
            .initWorkspace("name", "description", "purpose", owner)
            .then(function(workspace) {
                currentWorkspace = workspace;
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    after(function(done) {
        mongooseConnection.db.dropDatabase();
        done();
    });

    it("workspace initialized", function(done) {
        should.exist(currentWorkspace);
        done();
    });

    it("map creation 1", function(done) {
        currentWorkspace.createMap(owner, "blah1", "blah1", owner)
            .then(function(map) {
                currentMap1 = map;
                should.exist(currentMap1);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("map creation 2", function(done) {
        currentWorkspace.createMap(owner, "blah2", "blah2", owner)
            .then(function(map) {
                currentMap2 = map;
                should.exist(currentMap2);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("add 1 node to map 1", function(done) {
        currentMap1.addNode("name1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
            .then(function(map) {
              console.log('what is the map', map);
                currentMap1 = map;
                should.exist(currentMap1);
                should.exist(currentMap1.nodes[0]);
                should.exist(currentMap1.nodes[0]._id);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("add 2 node to map 1", function(done) {
        currentMap1.addNode("name2", 0.6, 0.6, "INTERNAL", currentWorkspace._id, "description", 0, owner)
            .then(function(map) {
                currentMap1 = map;
                should.exist(currentMap1);
                should.exist(currentMap1.nodes[1]);
                should.exist(currentMap1.nodes[1]._id);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("add 1 node to map 2", function(done) {
        currentMap2.addNode("name1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
            .then(function(map) {
                currentMap2 = map;
                should.exist(currentMap2);
                should.exist(currentMap2.nodes[0]);
                should.exist(currentMap2.nodes[0]._id);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("add 2 node to map 2", function(done) {
        currentMap2.addNode("name2", 0.6, 0.6, "INTERNAL", currentWorkspace._id, "description", 0, owner)
            .then(function(map) {
                currentMap2 = map;
                should.exist(currentMap2);
                should.exist(currentMap2.nodes[1]);
                should.exist(currentMap2.nodes[1]._id);
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });

    it("rename node 2 in map 2", function(done) {
        currentMap2.changeNode("2", 0.7, 0.7, "INTERNAL", currentMap2.nodes[1]._id, "description", 1, owner)
            .then(function(result) {
                return result[1].value.formJSON();
            })
            .then(function(map) {
                currentMap2 = map;
                should.exist(currentMap2);
                should.exist(currentMap2.nodes[1]);
                should.exist(currentMap2.nodes[1]._id);
                should.exist(currentMap2.nodes[1].name);
                currentMap2.nodes[1].name.should.equal("2");
            })
            .fail(function(e) {
                done(e);
            })
            .done(function() {
                done();
            });
    });


});
