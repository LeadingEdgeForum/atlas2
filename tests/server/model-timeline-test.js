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
/*jslint node:true, mocha:true, expr: true*/

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

          currentWorkspace.timeline[1].previous.equals(currentWorkspace.timeline[0]._id).should.be.true;
          currentWorkspace.timeline[0].next[0].equals(currentWorkspace.timeline[1]._id).should.be.true;
          currentWorkspace.timeline[0].maps.length.should.equal(currentWorkspace.timeline[1].maps.length);

          currentWorkspace.timeline[1].maps[0].previous.equals(currentWorkspace.timeline[0].maps[0]._id).should.be.true;
          currentWorkspace.timeline[0].maps[0].next[0].equals(currentWorkspace.timeline[1].maps[0]._id).should.be.true;
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
          return map.makeComment({x:0.3,y:03, text:'comment'});
        })
        .then(function(map){
          return map.defaultPopulate();
        })
        .then(function(map){
          return map.nodes[0].makeDependencyTo(map.nodes[1]._id);
        })
        .then(function(workspace){
          return currentWorkspace.populateTimeslices();
        })
        .then(function(map){
          return currentWorkspace.cloneTimeslice(currentWorkspace.nowId);
        })
        .then(function(clonedWorkspace) {
          // three timeslices
          clonedWorkspace.timeline.length.should.equal(3);
          //two future
          clonedWorkspace.timeline[0].next.length.should.equal(2);
          // timeslices point at each other
          clonedWorkspace.timeline[2].previous.equals(clonedWorkspace.timeline[0]._id).should.be.true;

          clonedWorkspace.timeline[0].next[0].equals(clonedWorkspace.timeline[2]._id).should.be.true;
          clonedWorkspace.timeline[0].maps.length.should.equal(clonedWorkspace.timeline[2].maps.length);

          clonedWorkspace.timeline[2].maps[0].previous.equals(clonedWorkspace.timeline[0].maps[0]._id).should.be.true;
          clonedWorkspace.timeline[0].maps[0].next[0].equals(clonedWorkspace.timeline[2].maps[0]._id).should.be.true;

          clonedWorkspace.timeline[2].maps[0].nodes.length.should.equal(2); //two nodes copied

          clonedWorkspace.timeline[2].maps[0].nodes[0].previous.equals(clonedWorkspace.timeline[0].maps[0].nodes[0]).should.be.true;

          // ensure comment is copied
          clonedWorkspace.timeline[2].maps[0].comments.length.should.be.equal(1);
          clonedWorkspace.timeline[2].maps[0].comments[0].text.should.be.equal('comment');
          clonedWorkspace.timeline[2].maps[0].comments[0].previous.equals(clonedWorkspace.timeline[0].maps[0].comments[0]._id).should.be.true;

          // ensure dependency is copied
          clonedWorkspace.timeline[2].maps[0].nodes[0].outboundDependencies[0].equals(clonedWorkspace.timeline[2].maps[0].nodes[1]._id).should.be.true;

        }).done(function(v, e) {
          done(e);
        });
    });
});

describe('Timeline deduplication tests', function() {

    let currentMap = null;

    before(function(done) {
        Workspace
            .initWorkspace("name", "description", "purpose", owner)
            .then(function(workspace) {
                currentWorkspace = workspace;
                return workspace.createAMap({
                    name: 'name1',
                    description: 'description1',
                    purpose: 'purpose1',
                    owner: owner
                  });

            })
            .then(function(map){
              currentMap = map;
              return currentMap.addNode('name1', 0.1, 0.1, 'INTERNAL', currentWorkspace._id, 'desc1', 1, 'you', 20);
            })
            .then(function(){
              return currentMap.addNode('name2', 0.2, 0.2, 'EXTERNAL', currentWorkspace._id, 'desc2', 1, 'you', 20);
            })
            .then(function(){
              return currentMap.addNode('name3', 0.3, 0.3, 'USERNEED', currentWorkspace._id, 'desc3', 1, 'you', 20);
            })
            .then(function() {
                return currentWorkspace.populateTimeslices();
            })
            .then(function(populatedWorkspace){
              currentWorkspace = populatedWorkspace;
              return currentWorkspace.createNewCapabilityAndAliasForNode(currentWorkspace.timeline[0]._id, currentWorkspace.timeline[0].capabilityCategories[0]._id,currentWorkspace.timeline[0].maps[0].nodes[0]);
            })
            .then(function(){
              return currentWorkspace.createNewCapabilityAndAliasForNode(currentWorkspace.timeline[0]._id, currentWorkspace.timeline[0].capabilityCategories[1]._id,currentWorkspace.timeline[0].maps[0].nodes[1]);
            })
            .then(function(){
              return currentWorkspace.addNodeToAlias(currentWorkspace.timeline[0]._id, currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].aliases[0],currentWorkspace.timeline[0].maps[0].nodes[2]);
            })
            .then(function(){ //timesliceId, capabilityID, name, description, evolution
              return currentWorkspace.createNewMarketReferenceInCapability(currentWorkspace.timeline[0]._id, currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0]._id, 'name', 'description', 0.2);
            })
            .then(function(){
              return currentWorkspace.cloneTimeslice(currentWorkspace.timeline[0]._id);
            })
            .then(function(workspace){
              return workspace.cloneTimeslice(currentWorkspace.timeline[0]._id);
            })
            .then(function(workspace){
              return workspace.cloneTimeslice(currentWorkspace.timeline[1]._id);
            })
            .then(function(workspace){
              return workspace.cloneTimeslice(currentWorkspace.timeline[1]._id);
            })
            .then(function() {
                return currentWorkspace.populateTimeslices();
            })
            .then(function(workspace){
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

    it("verify all timeslices are created", function() {
      currentWorkspace.timeline.length.should.equal(5);
    });

    it("verify timeslice references", function() {
      should.not.exist(currentWorkspace.timeline[0].previous);
      currentWorkspace.timeline[0].next.length.should.be.equal(2);

      currentWorkspace.timeline[0].next[0].equals(currentWorkspace.timeline[1]._id).should.be.true;
      currentWorkspace.timeline[1].previous.equals(currentWorkspace.timeline[0]._id).should.be.true;

      currentWorkspace.timeline[0].next[1].equals(currentWorkspace.timeline[2]._id).should.be.true;
      currentWorkspace.timeline[2].previous.equals(currentWorkspace.timeline[0]._id).should.be.true;

      currentWorkspace.timeline[1].next[0].equals(currentWorkspace.timeline[3]._id).should.be.true;
      currentWorkspace.timeline[3].previous.equals(currentWorkspace.timeline[1]._id).should.be.true;

      currentWorkspace.timeline[1].next[1].equals(currentWorkspace.timeline[4]._id).should.be.true;
      currentWorkspace.timeline[4].previous.equals(currentWorkspace.timeline[1]._id).should.be.true;

    });

    it("verify capability category references", function() {
      for(let i = 0; i < 2; i++){
        should.not.exist(currentWorkspace.timeline[0].capabilityCategories[i].previous);
        currentWorkspace.timeline[0].capabilityCategories[i].next.length.should.be.equal(2);

        currentWorkspace.timeline[0].capabilityCategories[i].next[0].equals(currentWorkspace.timeline[1].capabilityCategories[i]._id).should.be.true;
        currentWorkspace.timeline[1].capabilityCategories[i].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i]._id).should.be.true;

        currentWorkspace.timeline[0].capabilityCategories[i].next[1].equals(currentWorkspace.timeline[2].capabilityCategories[i]._id).should.be.true;
        currentWorkspace.timeline[2].capabilityCategories[i].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].next[0].equals(currentWorkspace.timeline[3].capabilityCategories[i]._id).should.be.true;
        currentWorkspace.timeline[3].capabilityCategories[i].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].next[1].equals(currentWorkspace.timeline[4].capabilityCategories[i]._id).should.be.true;
        currentWorkspace.timeline[4].capabilityCategories[i].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i]._id).should.be.true;
      }
    });

    it("verify capability references", function() {
      for(let i = 0; i < 2; i++){
        should.not.exist(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].previous);
        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].next.length.should.be.equal(2);

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].next[0].equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0]._id).should.be.true;
        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0]._id).should.be.true;

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].next[1].equals(currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0]._id).should.be.true;
        currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].next[0].equals(currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0]._id).should.be.true;
        currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].next[1].equals(currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0]._id).should.be.true;
        currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0]._id).should.be.true;
      }
    });

    it("verify aliases", function() {
      for(let i = 0; i < 2; i++){
        should.not.exist(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0].previous);
        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0].next.length.should.be.equal(2);

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0].next[0].equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;
        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0].next[1].equals(currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;
        currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0].aliases[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0].next[0].equals(currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;
        currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0].aliases[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0].next[1].equals(currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;
        currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0].aliases[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].aliases[0]._id).should.be.true;
      }
    });

    it("verify market references", function() {
        let i = 1;
        should.not.exist(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0].previous);
        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0].next.length.should.be.equal(2);

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0].next[0].equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;
        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;

        currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0].next[1].equals(currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;
        currentWorkspace.timeline[2].capabilityCategories[i].capabilities[0].marketreferences[0].previous.equals(currentWorkspace.timeline[0].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0].next[0].equals(currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;
        currentWorkspace.timeline[3].capabilityCategories[i].capabilities[0].marketreferences[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;

        currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0].next[1].equals(currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;
        currentWorkspace.timeline[4].capabilityCategories[i].capabilities[0].marketreferences[0].previous.equals(currentWorkspace.timeline[1].capabilityCategories[i].capabilities[0].marketreferences[0]._id).should.be.true;
    });

    it("delete category", function(done) {
      currentWorkspace.deleteCategory(currentWorkspace.timeline[1]._id, currentWorkspace.timeline[1].capabilityCategories[1]._id)
        .then(function(workspace) {
          workspace.timeline[1].capabilityCategories.length.should.equal(workspace.timeline[0].capabilityCategories.length - 1);
        }).done(function(v, e) {
          done(e);
        });
    });

    it("timeslice references should be intact", function() {
      should.not.exist(currentWorkspace.timeline[0].previous);
      currentWorkspace.timeline[0].next.length.should.be.equal(2);

      currentWorkspace.timeline[0].next[0].equals(currentWorkspace.timeline[1]._id).should.be.true;
      currentWorkspace.timeline[1].previous.equals(currentWorkspace.timeline[0]._id).should.be.true;

      currentWorkspace.timeline[0].next[1].equals(currentWorkspace.timeline[2]._id).should.be.true;
      currentWorkspace.timeline[2].previous.equals(currentWorkspace.timeline[0]._id).should.be.true;

      currentWorkspace.timeline[1].next[0].equals(currentWorkspace.timeline[3]._id).should.be.true;
      currentWorkspace.timeline[3].previous.equals(currentWorkspace.timeline[1]._id).should.be.true;

      currentWorkspace.timeline[1].next[1].equals(currentWorkspace.timeline[4]._id).should.be.true;
      currentWorkspace.timeline[4].previous.equals(currentWorkspace.timeline[1]._id).should.be.true;

    });

    it("verify capability category references after deletion", function() {
        currentWorkspace.timeline[0].capabilityCategories[1].next.length.should.be.equal(1); //second one was removed
        currentWorkspace.timeline[0].capabilityCategories[1].next[0].equals(currentWorkspace.timeline[2].capabilityCategories[1]._id).should.be.true;

        should.not.exist(currentWorkspace.timeline[3].capabilityCategories[1].previous);

        should.not.exist(currentWorkspace.timeline[4].capabilityCategories[1].previous);
    });

    it("verify capability references after deletion", function() {
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].next.length.should.be.equal(1); //second one was removed
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].next[0].equals(currentWorkspace.timeline[2].capabilityCategories[1].capabilities[0]._id).should.be.true;

        should.not.exist(currentWorkspace.timeline[3].capabilityCategories[1].capabilities[0].previous);

        should.not.exist(currentWorkspace.timeline[4].capabilityCategories[1].capabilities[0].previous);
    });

    it("verify aliases references after deletion", function() {
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].aliases[0].next.length.should.be.equal(1); //second one was removed
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].aliases[0].next[0].equals(currentWorkspace.timeline[2].capabilityCategories[1].capabilities[0].aliases[0]._id).should.be.true;

        should.not.exist(currentWorkspace.timeline[3].capabilityCategories[1].capabilities[0].aliases[0].previous);

        should.not.exist(currentWorkspace.timeline[4].capabilityCategories[1].capabilities[0].aliases[0].previous);
    });

    it("verify marketreferences references after deletion", function() {
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].marketreferences[0].next.length.should.be.equal(1); //second one was removed
        currentWorkspace.timeline[0].capabilityCategories[1].capabilities[0].marketreferences[0].next[0].equals(currentWorkspace.timeline[2].capabilityCategories[1].capabilities[0].marketreferences[0]._id).should.be.true;

        should.not.exist(currentWorkspace.timeline[3].capabilityCategories[1].capabilities[0].marketreferences[0].previous);

        should.not.exist(currentWorkspace.timeline[4].capabilityCategories[1].capabilities[0].marketreferences[0].previous);
    });



});
