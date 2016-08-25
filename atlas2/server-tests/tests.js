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
                name: "Sample map",
                description: "Sample description"
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
                // console.log(res);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create a category', function(done) {
      console.log('categories', copyOfWorkspace);
      var capabilityCategoryID = copyOfWorkspace.workspace.capabilityCategories[0]._id;
      var testName = 'testcapability';
        request(app).
        put('/api/workspace/' + workspaceID + '/capabilityCategory/' + capabilityCategoryID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send({name:testName})
            .expect(200)
            .expect(function(res) {
              var actualName = res.body.workspace.capabilityCategories[0].capabilities[0].name;
                if(actualName  !== testName){
                  console.log(testName, actualName);
                  throw new Error('Capability not created properly');
                }
            })
            .end(function(err, res) {
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
