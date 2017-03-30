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
var mongooseConnection = mongoose.createConnection("mongodb://localhost:27017/test-duplication");

var WardleyMap = require('../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;
var maps = [];

describe('Duplication tests', function() {


    before(function(done) {
        Workspace
            .initWorkspace("name", "description", "purpose", owner)
            .then(function(workspace) {
                currentWorkspace = workspace;
                var promises = [];
                for(var i = 0; i < 3; i++){
                    (function(index){
                       promises[index] = workspace.createMap(owner, "blah" + index, "blah" + index, owner);
                    })(i);
                }
                return q.allSettled(promises);
            })
            .then(function(results){
                for(var i = 0; i < 3; i++){
                  maps[i] = results[i].value;
                }
            })
            .then(function() {
                var promises = [];
                for (var i = 0; i < 3; i++) {
                    for (var j = 0; j < 3; j++) {
                        (function(index1, index2) {
                            promises[index1 * 3 + index2] = maps[index1].addNode("name" + index2, 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner);
                        })(i, j);
                    }
                }
                return q.allSettled(promises);
            })
            .then(function(results){
                for(var i = 0; i < 3; i++){
                  maps[i] = results[i*3+2].value;
                }
            })
            .done(function(v, e) {
                done(e);
            });
    });


    after(function(done) {
        mongooseConnection.db.dropDatabase();
        done();
    });


    it("verify all unprocessed", function(done) {
        currentWorkspace.findUnprocessedNodes()
            .then(function(unprocessedList) {
                unprocessedList.length.should.equal(3);
                unprocessedList[0].nodes.length.should.equal(3);
                unprocessedList[1].nodes.length.should.equal(3);
                unprocessedList[2].nodes.length.should.equal(3);
            })
            .done(function(v, e) {
                done(e);
            });
    });


    it("verify nothing is processed", function(done) {
        currentWorkspace.findProcessedNodes()
            .then(function(workspace) {
                for(var i = 0; i < workspace.capabilityCategories; i++){
                  var category = workspace.capabilityCategories[i];
                  category.capabilities.length.should.equal(0);
                }
            })
            .done(function(v, e) {
                done(e);
            });
    });


    it("create capability -> alias -> node", function(done) {
        currentWorkspace.createNewCapabilityAndAliasForNode(currentWorkspace.capabilityCategories[0], maps[0].nodes[0]._id)
            .then(function(workspace) {
                for (var i = 0; i < workspace.capabilityCategories; i++) {
                    var category = workspace.capabilityCategories[i];
                    if (i === 0) {
                        category.capabilities.length.should.equal(1);
                        category.capabilities[0].aliases.length.should.equal(1);
                        category.capabilities[0].aliases[0].nodes.length.should.equal(1);
                        should.exist(category.capabilities[0].aliases[0].nodes[0]._id);
                    } else {
                        category.capabilities.length.should.equal(0);
                    }
                }
            })
            .done(function(v, e) {
                done(e);
            });
    });



    it("verify all but one unprocessed", function(done) {
        currentWorkspace.findUnprocessedNodes()
            .then(function(unprocessedList) {
                unprocessedList.length.should.equal(3);
                for (var i = 0; i < unprocessedList.length; i++) {
                    if (unprocessedList[i]._id.equals(maps[0]._id)) {
                        unprocessedList[i].nodes.length.should.equal(3 - 1);
                    } else {
                        unprocessedList[i].nodes.length.should.equal(3);
                    }
                }
            })
            .done(function(v, e) {
                done(e);
            });
    });


    it("verify one is processed", function(done) {
        currentWorkspace.findProcessedNodes()
            .then(function(workspace) {
                for (var i = 0; i < workspace.capabilityCategories; i++) {
                    var category = workspace.capabilityCategories[i];
                    if (i === 0) {
                        category.capabilities.length.should.equal(1);
                        category.capabilities[0].aliases.length.should.equal(1);
                        category.capabilities[0].aliases[0].nodes.length.should.equal(1);
                        should.exist(category.capabilities[0].aliases[0].nodes[0]._id);
                    } else {
                        category.capabilities.length.should.equal(0);
                    }
                }
                currentWorkspace = workspace;
            })
            .done(function(v, e) {
                done(e);
            });
    });


    it("verify usage info", function(done) {
        currentWorkspace.getNodeUsageInfo(maps[0].nodes[0]._id)
            .then(function(capability) {
                should.exist(capability);
                console.log(currentWorkspace.capabilityCategories[0].capabilities[0]._id, capability._id);
            })
            .done(function(v, e) {
                done(e);
            });
    });


    it("verify removed", function(done) {
        var promises = [];
        for (var i = 0; i < maps.length; i++) {
            promises.push(maps[i].remove());
        }
        q.all(promises).then(function() {
            return currentWorkspace.findUnprocessedNodes()
                .then(function(unprocessedList) {
                    unprocessedList.length.should.equal(0);
                });
        }).then(function() {
            return currentWorkspace.findProcessedNodes()
                .then(function(workspace) {
                    for (var i = 0; i < workspace.capabilityCategories; i++) {
                        var category = workspace.capabilityCategories[i];
                        category.capabilities.length.should.equal(0);
                    }
                });
        }).done(function(v, e) {
            done(e);
        });
    });

});
