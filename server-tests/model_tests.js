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
var MongoDBConnection = require('../src-server/mongodb-helper');
var mongooseConnection = mongoose.createConnection(MongoDBConnection.test_usage.connectionURL);

var WardleyMap = require('../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;
var currentMap1 = null;
var currentMap2 = null;
var emptySubmap = null;

describe('Model tests', function() {


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

    it("workspace initialized", function(done) {
        should.exist(currentWorkspace);
        should.exist(currentWorkspace.timeline);
        should.exist(currentWorkspace.timeline[0]);
        should.exist(currentWorkspace.timeline[0].current);
        currentWorkspace.timeline[0].current.should.be.true;
        currentWorkspace.nowId.should.equal(currentWorkspace.timeline[0]._id);
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

    it("map creation with timeslice specified", function(done) {
      currentWorkspace.createAMap({
          name: 'name1',
          description: 'description1',
          purpose: 'purpose1',
          owner: owner
        }, currentWorkspace.timeline[0]._id)
        .then(function(map) {
          currentMap2 = map;
          should.exist(currentMap2);
          currentMap2.timesliceId.should.equal(currentWorkspace.timeline[0]._id);
          currentWorkspace.timeline[0].maps[1].equals(currentMap2._id).should.be.true;
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("add first node to the first map", function(done) {
      currentMap1.addNode("name1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
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

    it("add second node to the first map", function(done) {
      currentMap1.addNode("name2", 0.6, 0.6, "INTERNAL", currentWorkspace._id, "description", 0, owner)
        .then(function(map) {
          currentMap1 = map;
          should.exist(currentMap1);
          should.exist(currentMap1.nodes[1]);
          should.exist(currentMap1.nodes[1]._id);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("add first node to the second map", function(done) {
      currentMap2.addNode("name1", 0.5, 0.5, "INTERNAL", currentWorkspace._id, "description", 0, owner)
        .then(function(map) {
          currentMap2 = map;
          should.exist(currentMap2);
          should.exist(currentMap2.nodes[0]);
          should.exist(currentMap2.nodes[0]._id);
          currentMap2.nodes.length.should.be.equal(1);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("add second node to the second map", function(done) {
      currentMap2.addNode("name2", 0.6, 0.6, "INTERNAL", currentWorkspace._id, "description", 0, owner)
        .then(function(map) {
          currentMap2 = map;
          should.exist(currentMap2);
          should.exist(currentMap2.nodes[1]);
          should.exist(currentMap2.nodes[1]._id);
          currentMap2.nodes.length.should.be.equal(2);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("rename second node in the second map", function(done) {
      currentMap2.changeNode("2", 0.7, 0.7, null, "INTERNAL", currentMap2.nodes[1]._id, "description", 1, owner)
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
          currentMap2.nodes.length.should.be.equal(2);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("add third node to the second map", function(done) {
      currentMap2.addNode("name3", 0.7, 0.7, "INTERNAL", currentWorkspace._id, "description", 0, owner)
        .then(function(map) {
          currentMap2 = map;
          should.exist(currentMap2);
          should.exist(currentMap2.nodes[2]);
          should.exist(currentMap2.nodes[2]._id);
          currentMap2.nodes.length.should.be.equal(3);
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("check there is no submaps available for the second map", function(done) {
      currentMap2.getAvailableSubmaps()
        .then(function(result) {
          result.length.should.be.equal(0);
        })
        .done(function(v, e) {
          done(e);
        });
    });


    it("create a submap from the second map, do not use any existing component", function(done) {
      var params = {
        submapName: 'submapName',
        coords: {
          x: 0.1,
          y: 0.1
        },
        owner: owner,
        listOfNodesToSubmap: [],
        listOfCommentsToSubmap: []
      };
      currentMap2.populate('workspace').execPopulate()
        .then(function(populated) {
          return populated.formASubmap(params);
        })
        .then(function(result) {
          should.exist(result);
          should.exist(result.nodes);
          result.nodes.length.should.be.equal(4);
          should.exist(result._id);
          result._id.should.be.equal(currentMap2._id);
        })
        .done(function(v, e) {
          done(e);
        });
    });


    it("check that formed submap is visible from the second map point of view", function(done) {
      currentMap2.getAvailableSubmaps()
        .then(function(result) {
          result.length.should.be.equal(1);
          result[0].name.should.equal('submapName');
          emptySubmap = result[0];
        })
        .done(function(v, e) {
          done(e);
        });
    });


    it("check that formed submap is visible from the first map point of view", function(done) {
      currentMap1.getAvailableSubmaps()
        .then(function(result) {
          result.length.should.be.equal(1);
          result[0].name.should.equal('submapName');
        })
        .done(function(v, e) {
          done(e);
        });
    });

    it("check empty submap usage", function(done) {
      emptySubmap.getSubmapUsage()
        .then(function(result) {
          result.length.should.be.equal(1);
          should.exist(result[0]._id);
          currentMap2._id.equals(result[0]._id).should.be.true;
        })
        .done(function(v, e) {
          done(e);
        });
    });

});
