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
/*jshint esversion: 6 */
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
let mapExport = require('../../src-server/workspace/model/map-import-export').mapExport;
let mapImport = require('../../src-server/workspace/model/map-import-export').mapImport;

let workspace1 = null;
let workspace2 = null;
let map1 = null;
let map2 = null;
let exportedJSON1 = null;
let exportedJSON2 = null;
const mapTitle = 'mapName1';

describe('Import export tests', function() {


    before(function(done) {
      this.timeout(5000);
      q.allSettled([ //create worksapces
          Workspace
          .initWorkspace("name1", "description1", "purpose1", owner)
          .then(function(workspace) {
            workspace1 = workspace;
          }),
          Workspace
          .initWorkspace("name2", "description2", "purpose2", owner)
          .then(function(workspace) {
            workspace2 = workspace;
          }),
        ])
        .then(function(r) { //create a map
          return workspace1.createAMap({
            name: mapTitle,
            description: 'description1',
            purpose: 'purpose1',
            owner: owner
          });
        })
        .then(function(map1) { //create a map
          return map1.addNode('name1', 0.1, 0.1, 'INTERNAL', workspace1._id, 'desc1', 1, 'you', 20);
        })
        .then(function(map1) { //create a map
          return map1.addNode('name2', 0.3, 0.3, 'INTERNAL', workspace1._id, 'desc2', 1, 'you', 20);
        })
        .then(function(map1) { //create a map
          return map1.addNode('name2', 0.3, 0.3, 'INTERNAL', workspace1._id, 'desc2', 1, 'you', 20);
        })
        .then(function(map1){
          return map1.defaultPopulate();
        })
        .then(function(map1){
          return map1.nodes[0].makeDependencyTo(map1.nodes[1]._id).then(function(){return map1;});
        })
        .then(function(map1){
          return map1.nodes[0].makeDependencyTo(map1.nodes[2]._id).then(function(){return map1;});
        })
        .then(function(map1){
          return map1.nodes[1].makeDependencyTo(map1.nodes[2]._id).then(function(){return map1;});
        })
        .then(function(v, e) {
          map1 = v;
          done(e);
        });
    });

    after(function(done) {
        mongooseConnection.db.dropDatabase();
        done();
    });

    it("export", function(){
        exportedJSON1 = mapExport(map1);
        should.exist(exportedJSON1);
        should.exist(exportedJSON1.title);
        exportedJSON1.title.should.be.equal(mapTitle);
        should.exist(exportedJSON1.elements);
        exportedJSON1.elements.should.be.an.Array();
        exportedJSON1.elements.length.should.be.equal(3);
        should.exist(exportedJSON1.links);
        exportedJSON1.links.should.be.an.Array();
        exportedJSON1.links.length.should.be.equal(3);
        for(let i = 0; i < 3; i++){
          should.exist(exportedJSON1.elements[i]);
          should.exist(exportedJSON1.elements[i].id);
          should.exist(exportedJSON1.elements[i].name);
          should.exist(exportedJSON1.elements[i].maturity);
          should.exist(exportedJSON1.elements[i].visibility);
        }
        for(let i = 0; i < 3; i++){
          should.exist(exportedJSON1.links[i]);
          should.exist(exportedJSON1.links[i].start);
          should.exist(exportedJSON1.links[i].end);
        }
    });

    it("import", function() {
      return mapImport(Node, workspace2, exportedJSON1)
        .then(function(map) {
          map2 = map;
          // console.log('map2', map2);
          should.exist(map.name);
          map.name.should.be.equal(mapTitle);

          should.exist(map.nodes);
          map.nodes.should.be.an.Array();
          map.nodes.length.should.be.equal(3);


          // at least check that we have one node without dependencies,
          // one with one, and one with two
          // nodes can change order because of sorting
          let twoDeps = false, oneDep = false , zeroDep = false;

          for(let i = 0; i < 3; i++){
            let analysedNode = map.nodes[i];
            if(analysedNode.outboundDependencies.length === 0){
              zeroDep = true;
            }
            if(analysedNode.outboundDependencies.length === 1){
              oneDep = true;
            }
            if(analysedNode.outboundDependencies.length === 2){
              twoDeps = true;
            }
          }
          should(zeroDep).be.equal(true, 'node with no dependencies should be found');
          should(oneDep).be.equal(true, 'node with 1 dependencies should be found');
          should(twoDeps).be.equal(true, 'node with 2 dependencies should be found');
        });
    });

    it("export again", function() {
      exportedJSON2 = mapExport(map2);
      should.exist(exportedJSON2);
      should.exist(exportedJSON2.title);
      exportedJSON2.title.should.be.equal(mapTitle);
      should.exist(exportedJSON2.elements);
      exportedJSON2.elements.should.be.an.Array();
      exportedJSON2.elements.length.should.be.equal(3);
      should.exist(exportedJSON2.links);
      exportedJSON2.links.should.be.an.Array();
      exportedJSON2.links.length.should.be.equal(3);
      // must preserve ids and order
      for(let i = 0; i < 3; i++){
        should.exist(exportedJSON2.elements[i]);
        should.exist(exportedJSON2.elements[i].id);
        exportedJSON2.elements[i].id.should.equal(exportedJSON1.elements[i].id);
        should.exist(exportedJSON2.elements[i].name);
        exportedJSON2.elements[i].name.should.equal(exportedJSON1.elements[i].name);
        should.exist(exportedJSON2.elements[i].maturity);
        should.exist(exportedJSON2.elements[i].visibility);
      }
      for(let i = 0; i < 3; i++){
        should.exist(exportedJSON2.links[i]);
        should.exist(exportedJSON2.links[i].start);
        exportedJSON2.links[i].start.should.equal(exportedJSON1.links[i].start);
        should.exist(exportedJSON2.links[i].end);
        exportedJSON2.links[i].end.should.equal(exportedJSON1.links[i].end);
      }
    });

    it("regression test - https://github.com/cdaniel/atlas2/issues/107", function(){
      const failingMap = JSON.parse('{"title":"SimpleMap","elements":[{"id":"59f306eeb0a74b00364af3b8","name":"NewNode1","visibility":0.7496598639455783,"maturity":0.8917469147344802}],"links":[]}');
      return mapImport(Node, workspace2, failingMap)
        .then(function(importedMap){
          should.exist(importedMap.name);
          importedMap.name.should.be.equal(failingMap.title);

          importedMap.nodes.length.should.be.equal(1);
          importedMap.nodes[0].name.should.be.equal(failingMap.elements[0].name);

          importedMap.nodes[0].outboundDependencies.length.should.be.equal(0);
        });
    });

    it("regression test 2 - https://github.com/cdaniel/atlas2/issues/107", function(){
      const failingMap = JSON.parse('{"title":"SimpleMap","elements":[{"id":"59f306eeb0a74b00364af3b8","name":"NewNode1","visibility":0.7496598639455783,"maturity":0.8917469147344802}]}');
      return mapImport(Node, workspace2, failingMap)
        .then(function(importedMap){
          should.exist(importedMap.name);
          importedMap.name.should.be.equal(failingMap.title);

          importedMap.nodes.length.should.be.equal(1);
          importedMap.nodes[0].name.should.be.equal(failingMap.elements[0].name);

          importedMap.nodes[0].outboundDependencies.length.should.be.equal(0);
        });
    });
});
