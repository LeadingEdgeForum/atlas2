//#!/bin/env node
/* Copyright 2016 Leading Edge Forum

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
var app = require('../app');
var request = require('supertest');


//maybe automate getting test users and test keys from stormpath in the future
var stormpathId = process.env.WM_STORMPATH_TEST_ACCOUNT1_KEY;
var stormpathKey = process.env.WM_STORMPATH_TEST_ACCOUNT1_SECRET;


describe('Workspaces & maps', function() {

    var authorizationHeader = 'Basic ' + new Buffer(stormpathId + ":" + stormpathKey).toString("base64");
    var workspaceID;
    var mapID;
    var copyOfMap;
    var copyOfWorkspace;

    before(function(done) {
        this.timeout(2 * 60 * 1000);
        app.___app.on('stormpath.ready', function() {
            console.log('stormpath ready for tests');
            done();
        });
    });

    it('verify login', function(done) {
        request(app).
        get('/api/workspaces')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .end(function(err, res) {
                done(err);
            });
    });

    it('create workspace', function(done) {
        request(app).
        post('/api/workspace')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({
                name: "Testworkspace1",
                description: "I hate long descriptions"
            })
            .expect(function(res) {
                if (!res.body._id) {
                    throw new Error('_id should be assigned during workspace creation');
                }
                workspaceID = res.body._id;
            })
            .expect(200)
            .end(function(err, res) {
                done(err);
            });
    });

    it('get workspaces and confirm creation', function(done) {
        request(app).
        get('/api/workspaces')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                if (!res.body.workspaces) {
                    throw new Error('Workspaces should be returned');
                }
                var found = false;
                for (var i = 0; i < res.body.workspaces.length; i++) {
                    if (res.body.workspaces[i].workspace._id === workspaceID) {
                        found = true;
                        copyOfWorkspace = res.body.workspaces[i];
                    }
                }
                if (!found) {
                    throw new Error('Workspace ' + workspaceID + ' not present on the list');
                }

            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create a map', function(done) {
        request(app).
        post('/api/map')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({
                workspaceID: workspaceID,
                user: "Sample user",
                purpose: "Sample purpose"
            })
            .expect(200)
            .expect(function(res) {
                if (!res.body.map._id) {
                    throw new Error('_id should be assigned during map creation');
                }
                mapID = res.body.map._id;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('verify map created (/api/map/mapID)', function(done) {
        request(app).
        get('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                if (!(res.body.map && res.body.map._id)) {
                    throw new Error('map not loaded properly ' + res.body.map);
                }
                if (res.body.map.workspace !== workspaceID) {
                    throw new Error('workspace not assigned properly, should be' + workspaceID + " but was " + res.body.map.workspace);
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('add journey step and ensure consistency', function(done) {
        request(app).
        post('/api/map/' + mapID + '/journeystep/')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({position:0, step:{name:'teststep',interaction:'true'}})
            .expect(200)
            .expect(function(res) {
                if (!(res.body.map && res.body.map.journey.length === 1)) {
                    throw new Error('Step was not created as expected', res.body.map.journey);
                }
                if (res.body.map.journey[0].name !== 'teststep') {
                    throw new Error('Step has no valid name ' + res.body.map.journey[0].name);
                }
                if(!(res.body.map.nodes.length === 1)){
                  throw new Error('There should be exactly one node created', res.body.map.node);
                }
                if(!(res.body.map.journey[0].implementingNode._id === res.body.map.nodes[0]._id)){
                  throw new Error('Reference is wrongly set ' + res.body.map.journey[0].implementingNode._id + " " + res.body.map.nodes[0]._id);
                }
                if(res.body.map.nodes[0].name !== 'teststep'){
                  throw new Error('Reference has wrong name ' + res.body.map.nodes[0].name);
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('change journey step name and ensure consistency', function(done) {
        request(app).
        put('/api/map/' + mapID + '/journeystep/' + copyOfMap.journey[0]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({name:'teststep2',interaction:'true'})
            .expect(200)
            .expect(function(res) {
                if (res.body.map.journey[0].name !== 'teststep2') {
                  console.log(res.body.map);
                  throw new Error('Step not renamed ' + res.body.map.journey[0].name);
                }
                if(res.body.map.nodes[0].name !== 'teststep2'){
                  throw new Error('Corresponding node not changed' + res.body.map.nodes[0].name);
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('change journey step name and noninteractive and ensure consistency', function(done) {
        request(app).
        put('/api/map/' + mapID + '/journeystep/' + copyOfMap.journey[0]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({name:'teststep3',interaction:'false'})
            .expect(200)
            .expect(function(res) {
                if (res.body.map.journey[0].name !== 'teststep3') {
                    throw new Error('Step not renamed');
                }
                if(res.body.map.nodes.length !== 0){
                  throw new Error('Corresponding node not deleted');
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('change journey step interaction and ensure consistency', function(done) {
        request(app).
        put('/api/map/' + mapID + '/journeystep/' + copyOfMap.journey[0]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({name:'teststep3', interaction:'true'})
            .expect(200)
            .expect(function(res) {
                if(res.body.map.nodes.length !== 1 || res.body.map.nodes[0].name !== 'teststep3'){
                  throw new Error('Corresponding node not recreated');
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('delete journey step and ensure consistency', function(done) {
        request(app).
        delete('/api/map/' + mapID + '/journeystep/' + copyOfMap.journey[0]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                if (!(res.body.map && res.body.map.journey.length === 0)) {
                    throw new Error('Step was not deleted as expected ' + res.body.map.journey.length);
                }
                if(!(res.body.map.nodes.length === 0)){
                  throw new Error('The node should be removed', res.body.map.node);
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('add noninteractive journey step and ensure consistency', function(done) {
        request(app).
        post('/api/map/' + mapID + '/journeystep/')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({position:0, step:{name:'teststep',interaction:'false'}})
            .expect(200)
            .expect(function(res) {
                if (!(res.body.map && res.body.map.journey.length === 1)) {
                    throw new Error('Step was not created as expected', res.body.map.journey);
                }
                if (res.body.map.journey[0].name !== 'teststep') {
                    throw new Error('Step has no valid name ' + res.body.map.journey[0].name);
                }
                if(!(res.body.map.nodes.length === 0)){
                  throw new Error('Corresponding node should not be created');
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('delete journey step and ensure consistency', function(done) {
        request(app).
        delete('/api/map/' + mapID + '/journeystep/' + copyOfMap.journey[0]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                if (!(res.body.map && res.body.map.journey.length === 0)) {
                    throw new Error('Step was not deleted as expected', res.body.map.journey);
                }
                if(!(res.body.map.nodes.length === 0)){
                  throw new Error('There should be no nodes');
                }
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('verify map created (/api/workspace/workspaceID)', function(done) {
        request(app).
        get('/api/workspace/' + workspaceID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                var found = null;
                for (var i = 0; i < res.body.workspace.maps.length; i++) {
                    var _map = res.body.workspace.maps[i];
                    if (_map._id === mapID) {
                        found = _map;
                    }
                }
                if (!found) {
                    throw new Error("Map " + mapID + " was not correctly attached to workspace " + workspaceID);
                }
                if(!found.nodes){
                    throw new Error("Map " + mapID + " should have nodes array");
                }
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create a node in a map', function(done) {
        var node = {name:"name",x:0.5,y:0.5,type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        console.log({map:copyOfMap});
        request(app).
        put('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({map:copyOfMap})
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create a second node in a map', function(done) {
        var node = {name:"name1",x:0.7,y:0.5,type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        console.log({map:copyOfMap});
        request(app).
        put('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({map:copyOfMap})
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('establish connection', function(done){
      copyOfMap.connections.push({source:copyOfMap.nodes[0]._id, target:copyOfMap.nodes[1]._id, type:'test'});
      request(app).
        put('/api/map/' + mapID)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .set('Authorization', authorizationHeader)
          .send({map:copyOfMap})
          .expect(200)
          .expect(function(res) {
              copyOfMap = res.body.map;
              if(copyOfMap.connections.length !== 1){
                throw new Error('connection not created');
              }
          })
          .end(function(err, res) {
              done(err);
          });
    });

    it('delete connection', function(done){
      copyOfMap.connections = undefined;
      request(app).
        put('/api/map/' + mapID)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .set('Authorization', authorizationHeader)
          .send({map:copyOfMap})
          .expect(200)
          .expect(function(res) {
              copyOfMap = res.body.map;
              if(copyOfMap.connections.length !== 0){
                throw new Error('connection not deleted');
              }
          })
          .end(function(err, res) {
              done(err);
          });
    });

    it('create a third node in a map', function(done) {
        var node = {name:"name1",x:0.7,y:0.7,type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        console.log({map:copyOfMap});
        request(app).
        put('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({map:copyOfMap})
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
            })
            .end(function(err, res) {
                done(err);
            });
    });



    it('create a capability', function(done) {
      var capabilityCategoryID = copyOfWorkspace.workspace.capabilityCategories[0]._id;
      var testName = 'testcapability';
        request(app).
        put('/api/workspace/' + workspaceID + '/capabilityCategory/' + capabilityCategoryID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({name:testName,
              mapID:copyOfMap._id,
              nodeID:copyOfMap.nodes[1]._id})
            .expect(200)
            .expect(function(res) {
              request(app)
              .get('/api/map/' + copyOfMap._id)
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .set('Authorization', authorizationHeader)
              .expect(function(res){
                if(res.body.map.nodes[1].categorized == false && res.body.map.nodes[1].category !== null){
                  throw new Error('category not set properly');
                }
              }).end(function(err, res) {
                  done(err);
              })
            }).end(function(err,res){});
    });

    it('reference nodes and check the reference', function(done) {
        request(app).
        put('/api/reference/' + mapID +"/" + copyOfMap.nodes[0]._id + "/" + mapID + "/" + copyOfMap.nodes[1]._id)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
              request(app)
              .get('/api/map/' + copyOfMap._id)
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .set('Authorization', authorizationHeader)
              .expect(function(res){
                if(res.body.map.nodes[1].categorized == false || res.body.map.nodes[0].categorized == false){
                  throw new Error('category not set properly');
                }
                if(res.body.map.nodes[0].category !== res.body.map.nodes[1].category){
                  throw new Error('category not identical');
                }
                copyOfMap = res.body.map;
              }).end(function(err, res) {
                  done(err);
              })
            })
            .end(function(err, res) {
            });
    });

    it('delete node and check references', function(done){
      request(app)
          .del('/api/map/' + mapID + "/node/" + copyOfMap.nodes[1]._id)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .set('Authorization', authorizationHeader)
          .expect(200)
          .expect(function(res) {
            console.log('verofocatopm')
            var map = res.body.map;
            //there should be no category
            if(map.nodes[0].categorized){
              throw new Error('Category should be deleted');
            }
            if(map.nodes.length !== 2){
              throw new Error('Should be only two nodes, but are ' + map.nodes.length);
            }
          }).end(function(err, res) {
            done(err);
          });
    });

    it('archive a map (/api/map/mapID)', function(done) {
        request(app).
        del('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .end(function(err, res) {
                done(err);
            });
    });

    it('verify map does not exist (map)', function(done) {
        request(app).
        get('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                if (res.body.map) {
                    throw new Error('map should not be visible after archive' + res.body.map);
                }
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('verify map does not exist (workspace)', function(done) {
        request(app).
        get('/api/workspace/' + workspaceID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                var found = null;
                for (var i = 0; i < res.body.workspace.maps.length; i++) {
                    var _map = res.body.workspace.maps[i];
                    if (_map._id === mapID) {
                        found = _map;
                    }
                }
                if (found) {
                    throw new Error("Map " + mapID + " was not correctly removed from workspace " + workspaceID);
                }
            })
            .end(function(err, res) {
                done(err);
            });
    });


});
