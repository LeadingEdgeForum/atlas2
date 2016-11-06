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
    var node1ID, node2ID;
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
        var nodeName = "name";
        var node = {name:nodeName,coords:{x:0.5,y:0.5},type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        request(app).
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send(node)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                node1ID = res.body.map.nodes[0]._id;
                res.body.map.nodes[0].name.should.equal(node.name);
                console.log(res.body.map.nodes);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('change a node in a map', function(done) {
        var nodeName = "name2";
        var node = {name:nodeName,x:0.5,y:0.5,type:"INTERNAL"};
        request(app).
        put('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send(node)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes[0].name.should.equal(node.name);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('change a node in a map', function(done) {
        var nodeName = "name3";
        var node = {name:nodeName};
        request(app).
        put('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send(node)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes[0].name.should.equal(node.name);
                res.body.map.nodes[0].x.should.equal(0.5);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('delete a node in a map', function(done) {
        request(app).
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes.length.should.equal(0);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create yet another node in a map 1', function(done) {
        var nodeName = "name_1";
        var node = {name:nodeName,coords:{x:0.5,y:0.5},type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        request(app).
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send(node)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                node1ID = res.body.map.nodes[0]._id;
                res.body.map.nodes[0].name.should.equal(node.name);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create yet another node in a map 2', function(done) {
        var nodeName = "name_2";
        var node = {name:nodeName,coords:{x:0.5,y:0.5},type:"INTERNAL"};
        copyOfMap.nodes.push(node);
        request(app).
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .send(node)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                node2ID = res.body.map.nodes[1]._id;
                res.body.map.nodes[1].name.should.equal(node.name);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('connect nodes', function(done) {
        request(app).
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes.length.should.equal(2);
                res.body.map.nodes[0].outboundDependencies[0].should.equal(res.body.map.nodes[1]._id);
                res.body.map.nodes[1].inboundDependencies[0].should.equal(res.body.map.nodes[0]._id);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('delete a connection', function(done) {
        request(app).
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes.length.should.equal(2);
                res.body.map.nodes[0].outboundDependencies.length.should.equal(0);
                res.body.map.nodes[1].inboundDependencies.length.should.equal(0);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('connect nodes again', function(done) {
        request(app).
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes.length.should.equal(2);
                res.body.map.nodes[0].outboundDependencies[0].should.equal(res.body.map.nodes[1]._id);
                res.body.map.nodes[1].inboundDependencies[0].should.equal(res.body.map.nodes[0]._id);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('delete the second node', function(done) {
        request(app).
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization', authorizationHeader)
            .expect(200)
            .expect(function(res) {
                copyOfMap = res.body.map;
                res.body.map.nodes.length.should.equal(1);
                res.body.map.nodes[0].outboundDependencies.length.should.equal(0);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    describe('Submaps', function() {

        var authorizationHeader = 'Basic ' + new Buffer(stormpathId + ":" + stormpathKey).toString("base64");
        var workspaceID;
        var mapID;
        var nodeID = [];
        var copyOfMap;
        var copyOfWorkspace;
        var submapName = "submapname";

        var createNodeInAMap = function(index, done) {
            var nodeName = "name";
            var node = {name:nodeName,x:0.5,y:0.5,type:"INTERNAL"};
            request(app).
            post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('Authorization', authorizationHeader)
                .send(node)
                .expect(200)
                .expect(function(res) {
                    copyOfMap = res.body.map;
                    nodeID.push(res.body.map.nodes[index]._id);
                    nodeName.should.equal(res.body.map.nodes[index].name);
                    (0.5).should.equal(res.body.map.nodes[index].x);
                    (0.5).should.equal(res.body.map.nodes[index].y);
                })
                .end(function(err, res) {
                    done(err);
                });
        };

        var connectNodes = function(source, target, done) {
            request(app).
            post( '/api/workspace/' + workspaceID +
                  '/map/' + mapID +
                  '/node/' + nodeID[source] +
                  '/outgoingDependency/' + nodeID[target])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('Authorization', authorizationHeader)
                .expect(200)
                .expect(function(res) {
                    res.body.map.nodes[source].outboundDependencies[0].should.equal(res.body.map.nodes[target]._id);
                    res.body.map.nodes[target].inboundDependencies[0].should.equal(res.body.map.nodes[source]._id);
                })
                .end(function(err, res) {
                    done(err);
                });
        };

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

        it('create a node in a map', createNodeInAMap.bind(this,0));
        it('create a node in a map', createNodeInAMap.bind(this,1));
        it('create a node in a map', createNodeInAMap.bind(this,2));
        it('create a node in a map', createNodeInAMap.bind(this,3));

        it('connect nodes', connectNodes.bind(this, 0, 1));
        it('connect nodes', connectNodes.bind(this, 1, 2));
        it('connect nodes', connectNodes.bind(this, 2, 3));

        it('create a submap', function(done) {
            request(app).
            put('/api/map/' + mapID + '/submap')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('Authorization', authorizationHeader)
                .send({
                    name: submapName,
                    listOfNodesToSubmap: [nodeID[1],nodeID[2]]
                })
                .expect(200)
                .expect(function(res) {
                  res.body.map.nodes.length.should.equal(3);
                  res.body.map.nodes[2].name.should.equal(submapName);
                  res.body.map.nodes[2].type.should.equal('SUBMAP');
                  res.body.map.nodes[0]._id.should.equal(nodeID[0]);
                  res.body.map.nodes[0].outboundDependencies[0]
                    .should.equal(res.body.map.nodes[2]._id);
                  res.body.map.nodes[1]._id.should.equal(nodeID[3]);
                  res.body.map.nodes[1].inboundDependencies[0]
                    .should.equal(res.body.map.nodes[2]._id);
                })
                .end(function(err, res) {
                    done(err);
                });
        });
    });

    //
    // it('create a third node in a map', function(done) {
    //     var node = {name:"name1",x:0.7,y:0.7,type:"INTERNAL"};
    //     copyOfMap.nodes.push(node);
    //     console.log({map:copyOfMap});
    //     request(app).
    //     put('/api/map/' + mapID)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .send({map:copyOfMap})
    //         .expect(200)
    //         .expect(function(res) {
    //             copyOfMap = res.body.map;
    //         })
    //         .end(function(err, res) {
    //             done(err);
    //         });
    // });
    //
    //
    //
    // it('create a capability', function(done) {
    //   var capabilityCategoryID = copyOfWorkspace.workspace.capabilityCategories[0]._id;
    //   var testName = 'testcapability';
    //     request(app).
    //     put('/api/workspace/' + workspaceID + '/capabilityCategory/' + capabilityCategoryID)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .send({name:testName,
    //           mapID:copyOfMap._id,
    //           nodeID:copyOfMap.nodes[1]._id})
    //         .expect(200)
    //         .expect(function(res) {
    //           request(app)
    //           .get('/api/map/' + copyOfMap._id)
    //           .set('Content-type', 'application/json')
    //           .set('Accept', 'application/json')
    //           .set('Authorization', authorizationHeader)
    //           .expect(function(res){
    //             if(res.body.map.nodes[1].categorized == false && res.body.map.nodes[1].category !== null){
    //               throw new Error('category not set properly');
    //             }
    //           }).end(function(err, res) {
    //               done(err);
    //           })
    //         }).end(function(err,res){});
    // });
    //
    // it('reference nodes and check the reference', function(done) {
    //     request(app).
    //     put('/api/reference/' + mapID +"/" + copyOfMap.nodes[0]._id + "/" + mapID + "/" + copyOfMap.nodes[1]._id)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .expect(200)
    //         .expect(function(res) {
    //           request(app)
    //           .get('/api/map/' + copyOfMap._id)
    //           .set('Content-type', 'application/json')
    //           .set('Accept', 'application/json')
    //           .set('Authorization', authorizationHeader)
    //           .expect(function(res){
    //             if(res.body.map.nodes[1].categorized == false || res.body.map.nodes[0].categorized == false){
    //               throw new Error('category not set properly');
    //             }
    //             if(res.body.map.nodes[0].category !== res.body.map.nodes[1].category){
    //               throw new Error('category not identical');
    //             }
    //             copyOfMap = res.body.map;
    //           }).end(function(err, res) {
    //               done(err);
    //           })
    //         })
    //         .end(function(err, res) {
    //         });
    // });
    //
    // it('delete node and check references', function(done){
    //   request(app)
    //       .del('/api/map/' + mapID + "/node/" + copyOfMap.nodes[1]._id)
    //       .set('Content-type', 'application/json')
    //       .set('Accept', 'application/json')
    //       .set('Authorization', authorizationHeader)
    //       .expect(200)
    //       .expect(function(res) {
    //         console.log('verofocatopm')
    //         var map = res.body.map;
    //         //there should be no category
    //         if(map.nodes[0].categorized){
    //           throw new Error('Category should be deleted');
    //         }
    //         if(map.nodes.length !== 2){
    //           throw new Error('Should be only two nodes, but are ' + map.nodes.length);
    //         }
    //       }).end(function(err, res) {
    //         done(err);
    //       });
    // });
    //
    // it('archive a map (/api/map/mapID)', function(done) {
    //     request(app).
    //     del('/api/map/' + mapID)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .expect(200)
    //         .end(function(err, res) {
    //             done(err);
    //         });
    // });
    //
    // it('verify map does not exist (map)', function(done) {
    //     request(app).
    //     get('/api/map/' + mapID)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .expect(200)
    //         .expect(function(res) {
    //             if (res.body.map) {
    //                 throw new Error('map should not be visible after archive' + res.body.map);
    //             }
    //         })
    //         .end(function(err, res) {
    //             done(err);
    //         });
    // });
    //
    // it('verify map does not exist (workspace)', function(done) {
    //     request(app).
    //     get('/api/workspace/' + workspaceID)
    //         .set('Content-type', 'application/json')
    //         .set('Accept', 'application/json')
    //         .set('Authorization', authorizationHeader)
    //         .expect(200)
    //         .expect(function(res) {
    //             var found = null;
    //             for (var i = 0; i < res.body.workspace.maps.length; i++) {
    //                 var _map = res.body.workspace.maps[i];
    //                 if (_map._id === mapID) {
    //                     found = _map;
    //                 }
    //             }
    //             if (found) {
    //                 throw new Error("Map " + mapID + " was not correctly removed from workspace " + workspaceID);
    //             }
    //         })
    //         .end(function(err, res) {
    //             done(err);
    //         });
    // });


});
