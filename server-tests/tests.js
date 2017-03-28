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
var userAgent1 = request.agent(app);


describe('Workspaces & maps', function() {

    var workspaceID;
    var mapID;
    var node1ID, node2ID;
    var copyOfMap;
    var copyOfWorkspace;

    before(function(done) {
        this.timeout(2 * 60 * 1000);
        if(app.___app.webpack_middleware){
          app.___app.webpack_middleware.waitUntilValid(function(){
            done();
          });
        } else {
          //no webpack, nothing to wait for
          done();
        }
    });

    it('verify login', function(done) {
        userAgent1.post('/login').
        send({
                login: 'test1@test.test',
                password: 'password'
            })
            .expect(302)
            .expect(function(res){
              if(res.headers.location !== '/'){
                throw new Error('Login unsuccessful');
              }
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create workspace', function(done) {
        userAgent1.
        post('/api/workspace')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        get('/api/workspaces')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
                        // copyOfWorkspace.capabilityCategories.length.should.not.equal(0);
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

    it('get workspace', function(done) {
        userAgent1.
        get('/api/workspace/' + workspaceID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .expect(function(res) {
              res.body.workspace.capabilityCategories.length.should.not.equal(0);
            })
            .end(function(err, res) {
                done(err);
            });
    });

    it('create a map', function(done) {
        userAgent1.
        post('/api/map')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        get('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        get('/api/workspace/' + workspaceID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        put('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        put('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node1ID + '/outgoingDependency/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
        userAgent1.
        del('/api/workspace/' + workspaceID + '/map/' + mapID + '/node/' + node2ID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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

        var workspaceID;
        var mapID;
        var nodeID = [];
        var copyOfMap;
        var copyOfWorkspace;
        var submapName = "submapname";

        var createNodeInAMap = function(index, done) {
            var nodeName = "name";
            var node = {name:nodeName,x:0.5,y:0.5,type:"INTERNAL"};
            userAgent1.
            post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post( '/api/workspace/' + workspaceID +
                  '/map/' + mapID +
                  '/node/' + nodeID[source] +
                  '/outgoingDependency/' + nodeID[target])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post('/api/workspace')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post('/api/map')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
        //try to duplcate the connection
        it('connect nodes and verify duplicates are not created', function(done){
          userAgent1.
          post( '/api/workspace/' + workspaceID +
                '/map/' + mapID +
                '/node/' + nodeID[0] +
                '/outgoingDependency/' + nodeID[1])
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .expect(200)
              .expect(function(res) {
                  res.body.map.nodes[0].outboundDependencies.length.should.equal(1);
                  res.body.map.nodes[1].inboundDependencies.length.should.equal(1);
                  res.body.map.nodes[0].outboundDependencies[0].should.equal(res.body.map.nodes[1]._id);
                  res.body.map.nodes[1].inboundDependencies[0].should.equal(res.body.map.nodes[0]._id);
              })
              .end(function(err, res) {
                  done(err);
              });
        });
        it('connect nodes', connectNodes.bind(this, 1, 2));
        it('connect nodes', connectNodes.bind(this, 2, 3));

        var submapID;
        it('create a submap', function(done) {
            userAgent1.
            put('/api/map/' + mapID + '/submap')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
                  submapID = res.body.map.nodes[2].submapID;
                  submapID.should.not.be.null('missing submap id');
                  res.body.map.nodes[2].outboundDependencies.length.should.equal(1);
                  res.body.map.nodes[2].inboundDependencies.length.should.equal(1);
                  res.body.map.nodes[2].outboundDependencies[0].should.equal(res.body.map.nodes[1]._id);
                  res.body.map.nodes[2].inboundDependencies[0].should.equal(res.body.map.nodes[0]._id);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('verify the submap', function(done) {
          userAgent1.
            get('/api/map/' + submapID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res2){
                  submapName.should.equal(res2.body.map.name);
                  res2.body.map.isSubmap.should.equal(true);
                  res2.body.map.nodes.length.should.equal(2);
                  res2.body.map.nodes[1].outboundDependencies.length.should.equal(1);
                  res2.body.map.nodes[1].inboundDependencies.length.should.equal(0);
                  res2.body.map.nodes[0].inboundDependencies.length.should.equal(1);
                  res2.body.map.nodes[0].outboundDependencies.length.should.equal(0);
                  res2.body.map.nodes[1].outboundDependencies[0]
                    .should.equal(res2.body.map.nodes[0]._id);
                  res2.body.map.nodes[0].inboundDependencies[0]
                      .should.equal(res2.body.map.nodes[1]._id);
                }).end(function(err, res) {
                    done(err);
                });
        });

        it('verify submap usage info', function(done) {
          userAgent1.
            get('/api/submap/' + submapID + '/usage')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res2){
                  // console.log(res2.body);
                  res2.body.length.should.equal(1);
                  // res2.body.map.nodes.length.should.equal(2);
                }).end(function(err, res) {
                    done(err);
                });
        });

        it('verify suggestion', function(done) {
          userAgent1.
              get('/api/submaps/map/' + mapID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res2){
                  res2.body.listOfAvailableSubmaps.length.should.equal(1);
                  res2.body.listOfAvailableSubmaps[0]._id.should.equal(submapID);
                }).end(function(err, res) {
                    done(err);
                });
        });

        it('delete submap', function(done) {
          userAgent1.
            delete('/api/map/' + submapID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res2){
                  should.not.exist(res2.body.map);
                }).end(function(err, res) {
                    done(err);
                });
        });

        it('verify suggestion again', function(done) {
          userAgent1.
              get('/api/submaps/map/' + mapID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res2){
                  res2.body.listOfAvailableSubmaps.length.should.equal(0);
                }).end(function(err, res) {
                    done(err);
                });
        });


    });

    describe('Duplication', function() {

        var workspaceID;
        var mapID;
        var nodeID = [];
        var copyOfMap;
        var copyOfWorkspace;
        var submapName = "submapname";

        var createNodeInAMap = function(index, done) {
            var nodeName = "name";
            var node = {name:nodeName,x:0.5,y:0.5,type:"INTERNAL"};
            userAgent1.
            post('/api/workspace/' + workspaceID + '/map/' + mapID + '/node')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post( '/api/workspace/' + workspaceID +
                  '/map/' + mapID +
                  '/node/' + nodeID[source] +
                  '/outgoingDependency/' + nodeID[target])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post('/api/workspace')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
            userAgent1.
            post('/api/map')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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

        it('create another map', function(done) {
            userAgent1.
            post('/api/map')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .send({
                    workspaceID: workspaceID,
                    user: "Sample user",
                    purpose: "Sample purpose"
                })
                .expect(200)
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

        var submapID;
        it('create a submap', function(done) {
            userAgent1.
            put('/api/map/' + mapID + '/submap')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
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
                  submapID = res.body.map.nodes[2].submapID;
                  submapID.should.not.be.null('missing submap id');
                  res.body.map.nodes[2].outboundDependencies.length.should.equal(1);
                  res.body.map.nodes[2].inboundDependencies.length.should.equal(1);
                  res.body.map.nodes[2].outboundDependencies[0].should.equal(res.body.map.nodes[1]._id);
                  res.body.map.nodes[2].inboundDependencies[0].should.equal(res.body.map.nodes[0]._id);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('verify unprocessed components', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID + '/components/unprocessed')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                    res.body.maps.length.should.equal(2);
                })
                .end(function(err, res) {
                    done(err);
                });
        });


        var category = null;
        it('verify categories are present', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  res.body.workspace.capabilityCategories.length.should.not.equal(0);
                  category = res.body.workspace.capabilityCategories[0]._id;
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(0);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('create a capability', function(done) {
            userAgent1.
            post('/api/workspace/' + workspaceID + '/capabilitycategory/' + category + '/node/' + nodeID[0])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(1);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        var capabilityID = null;
        it('check capability creation', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID + '/components/processed')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  // console.log(res.body.workspace.capabilityCategories[0]);
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(1);
                  capabilityID = res.body.workspace.capabilityCategories[0].capabilities[0]._id;
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        var aliasID = null;
        it('add a node to capability', function(done) {
            userAgent1.
            put('/api/workspace/' + workspaceID + '/capability/' + capabilityID + '/node/' + nodeID[1])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  // console.log(res.body.workspace.capabilityCategories[0].capabilities[0]);
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(1);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases.length.should.equal(2);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases[0].nodes.length.should.equal(1);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases[1].nodes.length.should.equal(1);
                  aliasID = res.body.workspace.capabilityCategories[0].capabilities[0].aliases[1]._id;
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases[0].nodes[0].should.have.property('_id');
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('add a node to an alias', function(done) {
            userAgent1.
            put('/api/workspace/' + workspaceID + '/alias/' + aliasID + '/node/' + nodeID[1])
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  // console.log(res.body.workspace.capabilityCategories[0].capabilities[0]);
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(1);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases.length.should.equal(2);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases[0].nodes.length.should.equal(1);
                  res.body.workspace.capabilityCategories[0].capabilities[0].aliases[1].nodes.length.should.equal(2);
                })
                .end(function(err, res) {
                    done(err);
                });
        });
        it('get info', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID + '/node/' + nodeID[0] + '/usage/')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  console.log(res.body);
                  // res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(0);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('delete capability', function(done) {
            userAgent1.
            delete('/api/workspace/' + workspaceID + '/capability/' + capabilityID)
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  // console.log(res.body.workspace.capabilityCategories[0].capabilities[0]);
                  res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(0);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('verify unprocessed components', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID + '/components/unprocessed')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                    console.log(res.body.maps);
                    res.body.maps.length.should.equal(2);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

        it('get info', function(done) {
            userAgent1.
            get('/api/workspace/' + workspaceID + '/node/' + nodeID[0] + '/usage/')
                .set('Content-type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  console.log(res.body);
                  // res.body.workspace.capabilityCategories[0].capabilities.length.should.equal(0);
                })
                .end(function(err, res) {
                    done(err);
                });
        });

    });

    it('archive a map (/api/map/mapID)', function(done) {
        userAgent1.
        del('/api/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                done(err);
            });
    });

    it('verify map does not exist (directly)', function(done) {
        userAgent1.
        get('/api/workspace/' + workspaceID + '/map/' + mapID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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

    it('verify map does not exist (through workspace)', function(done) {
        userAgent1.
        get('/api/workspace/' + workspaceID)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
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
