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

var WardleyMap = require('../src-server/workspace/model/map-schema')(mongooseConnection);
var Workspace = require('../src-server/workspace/model/workspace-schema')(mongooseConnection);
var Node = require('../src-server/workspace/model/node-schema')(mongooseConnection);


var currentWorkspace = null;

describe('Timeline management tests', function() {


    before(function(done) {
        Workspace
            .initWorkspace("name", "description", "purpose", owner)
            .then(function(workspace) {
                currentWorkspace = workspace;
                var promises = [];
                promises.push(currentWorkspace.createAMap({
                    name: 'name1',
                    description: 'description1',
                    purpose: 'purpose1',
                    owner: owner
                  }));
                return q.all(promises);

            })
            .done(function(v, e) {
                done(e);
            });
    });

    after(function(done) {
        mongooseConnection.db.dropDatabase();
        done();
    });

    it("cloning timeslice with an empty map", function(done) {
      currentWorkspace.cloneTimeslice(currentWorkspace.nowId)
        .then(function(savedWorkspace) {
          // two timeslices
          currentWorkspace.timeline.length.should.equal(2);

          // timeslices point at each other
          currentWorkspace.timeline[1].previous.equals(currentWorkspace.timeline[0]._id).should.be.ok;

          currentWorkspace.timeline[0].next[0].equals(currentWorkspace.timeline[1]._id).should.be.ok;
          currentWorkspace.timeline[0].maps.length.should.equal(currentWorkspace.timeline[1].maps.length);

          currentWorkspace.timeline[1].maps[0].previous.equals(currentWorkspace.timeline[0].maps[0]._id).should.be.ok;
          currentWorkspace.timeline[0].maps[0].next[0].equals(currentWorkspace.timeline[1].maps[0]._id).should.be.ok;
        }).done(function(v, e) {
          done(e);
        });
    });

    it("cloning timeslice with two nodes", function(done) {
      currentWorkspace.timeline[0].maps[0]
        .addNode('name1', 0.1, 0.1, 'INTERNAL', currentWorkspace._id, 'desc1', 0.33, 'me', 10)
        .then(function(map){
          return map.addNode('name2', 0.2, 0.2, 'EXTERNAL', currentWorkspace._id, 'desc3', 1, 'you', 20);
        })
        .then(function(map){
          return currentWorkspace.cloneTimeslice(currentWorkspace.nowId);
        })
        .then(function(workspace){
          return workspace.populate('timeline.maps timeline.maps.nodes').execPopulate();
        })
        .then(function(savedWorkspace) {
          // three timeslices
          currentWorkspace.timeline.length.should.equal(3);
          //two future
          currentWorkspace.timeline[0].next.length.should.equal(2);
          // timeslices point at each other
          currentWorkspace.timeline[2].previous.equals(currentWorkspace.timeline[0]._id).should.be.ok;

          currentWorkspace.timeline[0].next[0].equals(currentWorkspace.timeline[2]._id).should.be.ok;
          currentWorkspace.timeline[0].maps.length.should.equal(currentWorkspace.timeline[2].maps.length);

          currentWorkspace.timeline[2].maps[0].previous.equals(currentWorkspace.timeline[0].maps[0]._id).should.be.ok;
          currentWorkspace.timeline[0].maps[0].next[0].equals(currentWorkspace.timeline[2].maps[0]._id).should.be.ok;

          console.log(currentWorkspace.timeline[2].maps[0]);
          currentWorkspace.timeline[2].maps[0].nodes.length.should.equal(2); //two nodes copied

          console.log(currentWorkspace.timeline[2].maps[0]);
          currentWorkspace.timeline[2].maps[0].nodes[0].previous.equals(currentWorkspace.timeline[0].maps[0].nodes[0]).should.be.ok;
        }).done(function(v, e) {
          done(e);
        });
    });
});
