//#!/bin/env node
/* Copyright 2016,2017 Leading Edge Forum

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


var _ = require('underscore');
var logger = require('./../log');
var submapLogger = require('./../log').getLogger('submap');
var capabilityLogger = require('./../log').getLogger('capability');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var q = require('q');
var _async = require('async');

var log4js = require('log4js');
submapLogger.setLevel(log4js.levels.WARN);


var getUserIdFromReq = function(req) {
  if (req && req.user && req.user.email) {
    return req.user.email;
  }
  //should never happen as indicates lack of authentication
  console.error('user.email not present');
  return null;
};


var calculateMean = function(list, field){
  // submapLogger.trace('multisave', list, field);
  if(!list || list.length === 0){
    return 0.5;
  }
  var mean = 0;
  for(var i = 0; i < list.length; i++){
    mean += list[i][field];
  }
  return mean / list.length;
};

var multiSave = function(array, callback){
    if(!array || array.length === 0){
      return callback([],[]);
    }

    // cut out dupicates as handling them in mongoose really sucks
    var mySet = new Set();
    for(var i = 0; i < array.length; i++){
      mySet.add(''+array[i]._id);
    }
    for(var j = array.length - 1; j >= 0; j--){
      if(mySet.has(''+array[j]._id)){
        mySet.delete(''+array[j]._id);
      } else {
        array.splice(j,1);
      }
    }
    var errors = [];
    var savedObjects = [];
    var counter  = [0];
    var onSave = function(err, result){
      if(err){
        errors.push(err);
      }
      if(result){
        savedObjects.push(result);
      }
      if(savedObjects.length === array.length){
        return callback(errors,savedObjects);
      }
    };
    for(var i = 0; i < array.length; i++){
      array[i].save(onSave);
    }
};

var removeDuplicatesDependenciesFromList = function(dependencies){
  var mySet = new Set();
  for(var i = 0; i < dependencies.length; i++){
    mySet.add(''+dependencies[i]);
  }
  for(var j = dependencies.length - 1; j >= 0; j--){
    if(mySet.has(''+dependencies[j])){
      mySet.delete(''+dependencies[j]);
    } else {
      dependencies.splice(j,1);
      j--;
    }
  }
};

var removeDuplicatesDependencies = function(nodes){
    for(var i = 0 ; i < nodes.length; i++){
        removeDuplicatesDependenciesFromList(nodes[i].outboundDependencies);
        removeDuplicatesDependenciesFromList(nodes[i].inboundDependencies);
    }
};


module.exports = function(authGuardian, mongooseConnection) {
  var WardleyMap = require('./model/map-schema')(mongooseConnection);
  var Workspace = require('./model/workspace-schema')(mongooseConnection);
  var Node = require('./model/node-schema')(mongooseConnection);


  var module = {};

  module.router = require('express').Router();

  var defaultAccessDenied = function(res, err){
    console.error('default error handler', err);
      if(err){
          return res.send(500);
      }
      res.send(403);
  };

  // this is so shitty.... the name should be calculated client side
  // TODO: fix this
  module.router.get('/map/:mapID/name', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    WardleyMap
        .findOne({_id: req.params.mapID, archived: false})
        .select('user purpose name workspace responsiblePerson')
        .exec(function(err, result) {
            if(!result){
                return res.status(404);
            }
            result.verifyAccess(owner,function(){
                if(result.user && result.purpose){
                    res.json({map: {_id : result._id, name:'As ' + result.user + ', I want to ' + result.purpose + '.'}});
                  } else {
                    res.json({map: {_id : result._id, name:result.name + '.'}});
                  }
            }, defaultAccessDenied.bind(null, res));

    });
  });


  module.router.get('/workspaces/', authGuardian.authenticationRequired, function(req, res) {
      Workspace.find({
          owner: getUserIdFromReq(req),
          archived: false
      }, function(err, results) {
          if (err) {
              return res.send(500);
          }
          var responseObject = {
              workspaces: []
          };
          results.forEach(workspace => responseObject.workspaces.push({
              workspace: workspace
          }));
          res.json(responseObject);
      });
  });

  module.router.post('/workspace/', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      Workspace.initWorkspace(req.body.name, req.body.description, req.body.purpose, owner, function(err, wkspc) {
          if (err) {
              return res.status(500);
          }
          res.json(wkspc);
      });
  });

  module.router.get('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
      Workspace
          .findOne({
              owner: getUserIdFromReq(req),
              _id: req.params.workspaceID,
              archived: false
          })
          .populate('maps capabilityCategories')
          .exec(function(err, result) {
              if (err) {
                  return res.send(500);
              }
              res.json({
                  workspace: result.toObject()
              });
          });
  });

  module.router.get('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
    WardleyMap.findOne({
            _id: req.params.mapID,
            archived: false
        })
        .populate('nodes')
        .exec(function(err, result) {
            if (err) {
                res.statusCode = 500;
                res.json(err);
                return;
            }
            if (!result) {
                res.send(404);
                return;
            }
            result.verifyAccess(getUserIdFromReq(req), function() {
                res.json({
                    map: result.toObject()
                });
            }, defaultAccessDenied.bind(this,res));
        });
    });

  module.router.get('/submaps/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      Workspace.getAvailableSubmapsForMap(req.params.mapID, owner, function(listOfAvailableSubmaps) {
          res.json({
              listOfAvailableSubmaps: listOfAvailableSubmaps
          });
      }, defaultAccessDenied.bind(res));
  });

  module.router.get('/submap/:submapID/usage', authGuardian.authenticationRequired, function(req, res){
    var owner = getUserIdFromReq(req);
    Workspace.getSubmapUsage(req.params.submapID, owner, function(availableMaps) {
        res.json(availableMaps);
    }, defaultAccessDenied.bind(res));
  });

  module.router.put('/map/:mapID/submap/:submapID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    WardleyMap.findOne({_id: req.params.mapID, archived: false}).exec(function(err0, map) {
      WardleyMap.findOne({_id: req.params.submapID, archived: false}).exec(function(err1, submap) {
      map.verifyAccess(owner, function(){
          submap.verifyAccess(owner, function(){

              var x = req.body.coords.x;
              var y = req.body.coords.y;

              var artificialNode = new Node({
                      name:submap.name,
                      workspace: map.workspace,
                      parentMap: map,
                      type:'SUBMAP',
                      x:x,
                      y:y,
                      submapID : submap._id,
                      responsiblePerson : submap.responsiblePerson
                    });
              artificialNode.save(function(err4, savedNode){
                if(err4){
                  res.send(500);
                  return;
                }
                map.nodes.push(savedNode);
                map.save(function(err5, savedMap){
                    if(err5){
                      res.send(500);
                      return;
                    }
                    savedMap.populate('nodes', function(err6){
                      if(err6){
                        res.send(500);
                        return;
                      }
                        res.json({map:savedMap});
                    });
                });
              });
          }, defaultAccessDenied.bind(this,res));
      }, defaultAccessDenied.bind(this,res));
    });
  });
});

  module.router.put('/map/:mapID/submap', authGuardian.authenticationRequired, function(req, res) {
    var listOfNodesToSubmap = req.body.listOfNodesToSubmap ? req.body.listOfNodesToSubmap : [];
    var listOfCommentsToSubmap = req.body.listOfCommentsToSubmap ? req.body.listOfCommentsToSubmap : [];
    var submapName = req.body.name;
    var coords = req.body.coords;
    var responsiblePerson = req.body.responsiblePerson;

    var owner = getUserIdFromReq(req);
    submapLogger.trace({
      submapName:submapName,
      coords:coords,
      owner:owner,
      listOfNodesToSubmap:listOfNodesToSubmap,
      listOfCommentsToSubmap : listOfCommentsToSubmap});
    var toSave = [];
    var transferredNodes = [];

    WardleyMap.findOne({
          _id: req.params.mapID,
          archived: false})
      .populate('nodes')
      .exec(function(err, affectedMap) {
          affectedMap.verifyAccess(owner, function(){
              //check that we actually own the map, and if yes
              var submap = new WardleyMap({
                name      : submapName,
                isSubmap  : true,
                workspace : affectedMap.workspace,
                archived  : false,
                responsiblePerson : responsiblePerson
              });
              submap.save(function(err, savedSubmap){
                var artificialNode = new Node({
                        name: submapName,
                        workspace: affectedMap.workspace,
                        parentMap: affectedMap,
                        type:'SUBMAP',
                        submapID : savedSubmap});
                artificialNode.save(function(err, savedNode){
                  submapLogger.trace('submap and node saved');
                  var nodesToSave = [];
                  for(var i = affectedMap.nodes.length -1; i>= 0; i--){
                    var index = listOfNodesToSubmap.indexOf(''+affectedMap.nodes[i]._id);
                    if(index === -1){ // node not being transferred
                      var notTransferredNode = affectedMap.nodes[i];
                      // and fix dependencies if necessary
                      for(var j = notTransferredNode.outboundDependencies.length - 1; j >= 0; j--){
                        if(listOfNodesToSubmap.indexOf(''+ notTransferredNode.outboundDependencies[j]) > -1){
                          notTransferredNode.outboundDependencies.set(j,savedNode);
                          submapLogger.trace('fixing outboundDependencies for nonTransfer');
                          nodesToSave.push(notTransferredNode);
                        }
                      }

                      // and fix dependencies if necessary
                      for(var j = notTransferredNode.inboundDependencies.length - 1; j >= 0; j--){
                        if(listOfNodesToSubmap.indexOf(''+ notTransferredNode.inboundDependencies[j]) > -1){
                          notTransferredNode.inboundDependencies.set(j,savedNode);
                          submapLogger.trace('fixing inboundDependencies for nonTransfer');
                          nodesToSave.push(notTransferredNode);
                        }
                      }
                    } else {
                      var transferredNode = affectedMap.nodes.splice(i, 1)[0];
                      transferredNode.parentMap = savedSubmap;  // transfer the node
                      savedSubmap.nodes.push(transferredNode);
                      transferredNodes.push(transferredNode);
                      submapLogger.trace('transfering' ,transferredNode._id);

                      // and fix dependencies if necessary
                      for(var j = transferredNode.outboundDependencies.length - 1; j >= 0; j--){
                        if(listOfNodesToSubmap.indexOf(''+ transferredNode.outboundDependencies[j]) === -1){
                          var dependencyAlreadyEstablished = false;
                          savedNode.outboundDependencies.push(transferredNode.outboundDependencies[j]);
                          nodesToSave.push(savedNode);
                          transferredNode.outboundDependencies.splice(j,1);
                          submapLogger.trace('fixing outboundDependencies for transfer');
                        }
                      }

                      // and fix dependencies if necessary
                      for(var j = transferredNode.inboundDependencies.length - 1; j >= 0; j--){
                        if(listOfNodesToSubmap.indexOf(''+ transferredNode.inboundDependencies[j]) === -1){
                          savedNode.inboundDependencies.push(transferredNode.inboundDependencies[j]);
                          nodesToSave.push(savedNode);
                          transferredNode.inboundDependencies.splice(j,1);
                          submapLogger.trace('fixing inboundDependencies for transfer');
                        }
                      }
                    }
                  }

                  savedNode.x = coords ? coords.x : calculateMean(transferredNodes, 'x');
                  savedNode.y = coords ? coords.y : calculateMean(transferredNodes, 'y');
                  submapLogger.trace('coords calculated', savedNode.x, savedNode.y);
                  affectedMap.nodes.push(savedNode);
                  nodesToSave.push(savedNode);

                  removeDuplicatesDependencies(nodesToSave);

                  //before save - migrate comments
                  for(var ii = affectedMap.comments.length - 1; ii > -1; ii--){
                    var toBeTransfered = false;
                    for(var jj = 0; jj < listOfCommentsToSubmap.length; jj++){
                      if(listOfCommentsToSubmap[jj] === '' + affectedMap.comments[ii]._id){
                        toBeTransfered = true;
                      }
                    }
                    if(toBeTransfered){
                      var commentToTransfer = affectedMap.comments.splice(ii,1)[0];
                      submap.comments.push(commentToTransfer);
                    }
                  }

                  // console.log(nodesToSave);
                  multiSave(nodesToSave.concat(transferredNodes), function(e1, r1){
                    submapLogger.trace('multisave');
                    savedSubmap.save(function(err, savedSubmap2){
                      submapLogger.trace('save map');
                      affectedMap.save(function(e2, savedAffectedMap){
                        submapLogger.trace('all saved');
                        WardleyMap
                          .findOne({_id:savedAffectedMap._id})
                          .populate('nodes')
                          .exec(function(e3,p){
                            Workspace
                              .findById(savedSubmap2.workspace)
                              .exec(function(e4, rworkspace){
                                rworkspace.maps.push(savedSubmap2);
                                rworkspace.save(function(e5,w){});
                                if(e1.length > 0 || e2 || e3 || e4){
                                  console.log(e1,e2,e3,e4);
                                  res.status(500).json([e1,e2,e3,e4]);
                                  return;
                                }
                                res.json({map:p.toObject()});
                              });
                        });
                      });
                    });
                  });
                });

              });
          }, defaultAccessDenied.bind(this,res));
    });
  });

  module.router.put('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
          _id: req.params.mapID,
          archived: false
      }).exec(function(err, result) {
          // console.log('map found', err, result, req.body.map);
          //check that we actually own the map, and if yes
          if (!result) {
              return res.send(404);
          }
          result.verifyAccess(owner, function() {

              result.newBody(req.body.map, function() {
                  result.formJSON(function(json) {
                      res.json(json);
                  }, defaultAccessDenied.bind(this,res));
              }, defaultAccessDenied.bind(this,res));
          }, defaultAccessDenied.bind(this,res));
      });
  });

  module.router.put('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).exec(function(err, result) {
      //check that we actually own the workspace, and if yes
      if (err) {
        res.status(500).json(err);
      }
      if (result) {
        result.name = req.body.name;
        result.description = req.body.description;
        result.purpose = req.body.purpose;
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
          }
          res.json({map: result2});
        });
      }
    });
  });

  module.router.delete('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    WardleyMap
        .findOne({
            _id: req.params.mapID,
            archived: false
        })
        .populate('workspace')
        .exec(function(err, result) {
            //check that we actually own the map, and if yes
            if (err) {
                res.status(500).json(err);
                return;
            }
            if (result) {
                result.verifyAccess(owner, function() {

                    result.archived = true;
                    var worskpace = result.workspace;
                    worskpace.maps.pull(result._id);
                    worskpace.save(function(e1, savedWorkspace) {
                        result.save(function(e2, savedMap) {
                            if (e1 || e2) {
                                res.status(500).json([e1, e2]);
                                return;
                            }
                            res.json({
                                map: null
                            });
                        });
                    });
                }, defaultAccessDenied.bind(this, res));
            }
        });
});

  module.router.delete('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        res.status(500).json(err);
        return;
      }
      if (result) {
        result.archived = true;
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
            return;
          }
          res.json({workspace: null});
        });
      }
    });
  });

  module.router.post('/map/', authGuardian.authenticationRequired, function(req, res) {
      var editor = getUserIdFromReq(req);
      Workspace.createMap(req.body.workspaceID, editor, req.body.user, req.body.purpose, req.body.responsiblePerson, function(result) {
          res.json({
              map: result
          });
      }, defaultAccessDenied.bind(res));
  });


  module.router.post('/workspace/:workspaceID/map/:mapID/node', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var name = req.body.name;
    var description = req.body.description;
    var inertia = req.body.inertia;
    var responsiblePerson = req.body.responsiblePerson;
    var x = req.body.x;
    var y = req.body.y;
    var type = req.body.type;
    var parentMap = new ObjectId(mapID);

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
        _id: mapID,
        archived: false,
        workspace: workspaceID
    }, function(err, mapResult) {
        if (err) {
            return defaultAccessDenied(res, err);
        }
        if (!mapResult) {
            return defaultAccessDenied(res, err);
        }
        mapResult.verifyAccess(owner, function() {
            mapResult.addNode(name, x, y, type, new ObjectId(workspaceID), parentMap, description, inertia, responsiblePerson, function(success_result) {
                res.json({
                    map: success_result.toObject()
                });
            }, defaultAccessDenied.bind(this, res));
        }, defaultAccessDenied.bind(this, res));
    });
});

  module.router.put('/workspace/:workspaceID/editor/:email', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var email = req.params.email;

    Workspace.findOne(
      {owner: getUserIdFromReq(req),
        _id: req.params.workspaceID,
        archived: false
    }).exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        res.status(500).json(err);
        return;
      }
      if (result) {
        result.owner.push(email);
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
            return;
          }
          res.json({workspace: result2});
          var helper = require('../sendgrid-helper');
          helper.sendInvitation({
              owner : owner,
              editor : email,
              workspaceID : workspaceID,
              name : result.name,
              purpose : result.purpose,
              description : result.description
          });
        });
      }
    });

  });


  module.router.delete('/workspace/:workspaceID/editor/:email', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var email = req.params.email;

    if(owner === email){
      res.status(500).json({message:'Cannot delete self'});
      return;
    }

    Workspace.findOne(
      {owner: getUserIdFromReq(req),
        _id: req.params.workspaceID,
        archived: false
    }).exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        res.status(500).json(err);
        return;
      }
      if (result) {
        result.owner.pop(email);
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
            return;
          }
          res.json({workspace: result2});
        });
      }
    });

  });

  module.router.post('/workspace/:workspaceID/map/:mapID/comment', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var x = req.body.x;
    var y = req.body.y;
    var text = req.body.text;

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
        _id: mapID,
        archived: false,
        workspace: workspaceID
    }, function(err, mapResult) {
        if (err) {
            return defaultAccessDenied(res, err);
        }
        if (!mapResult) {
            return defaultAccessDenied(res, err);
        }
        mapResult.verifyAccess(owner, function() {
            mapResult.makeComment({x:x,y:y,text:text}, function(err, success_result) {
              success_result.formJSON(function(formed){
                res.json(formed);
              }, defaultAccessDenied.bind(this, res));
            }, defaultAccessDenied.bind(this, res));
        }, defaultAccessDenied.bind(this, res));
    });
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var x = req.body.x;
    var y = req.body.y;
    var text = req.body.text;
    var commentID = req.params.commentID;

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
        _id: mapID,
        archived: false,
        workspace: workspaceID
    }, function(err, mapResult) {
        if (err) {
            return defaultAccessDenied(res, err);
        }
        if (!mapResult) {
            return defaultAccessDenied(res, err);
        }
        mapResult.verifyAccess(owner, function() {
            mapResult.updateComment(commentID,{x:x,y:y,text:text}, function(err, success_result) {
              success_result.formJSON(function(formed){
                res.json(formed);
              }, defaultAccessDenied.bind(this, res));
            }, defaultAccessDenied.bind(this, res));
        }, defaultAccessDenied.bind(this, res));
    });
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var commentID = req.params.commentID;

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
        _id: mapID,
        archived: false,
        workspace: workspaceID
    }, function(err, mapResult) {
        if (err) {
            return defaultAccessDenied(res, err);
        }
        if (!mapResult) {
            return defaultAccessDenied(res, err);
        }
        mapResult.verifyAccess(owner, function() {
            mapResult.deleteComment(commentID, function(err, success_result) {
              success_result.formJSON(function(formed){
                res.json(formed);
              }, defaultAccessDenied.bind(this, res));
            }, defaultAccessDenied.bind(this, res));
        }, defaultAccessDenied.bind(this, res));
    });
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/node/:nodeID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var name = req.body.name;
      var x = req.body.x;
      var y = req.body.y;
      var type = req.body.type;
      var desiredNodeId = new ObjectId(req.params.nodeID);
      var description = req.body.description;
      var inertia = req.body.inertia;
      var responsiblePerson = req.body.responsiblePerson;

      // find a map with a node
      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID,
              nodes: desiredNodeId
          })
          .exec(function(err, mapResult) {
              if (err) {
                  return defaultAccessDenied(res, err);
              }
              if (!mapResult) {
                  return defaultAccessDenied(res, err);
              }
              mapResult.verifyAccess(owner, function() {
                  mapResult.changeNode(name, x, y, type, desiredNodeId, description, inertia, responsiblePerson, function(success_result) {
                      res.json({
                          map: success_result.toObject()
                      });
                  }, defaultAccessDenied.bind(this, res));
              }, defaultAccessDenied.bind(this, res));
          });
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/node/:nodeID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var parentMap = new ObjectId(mapID);
      var desiredNodeId = new ObjectId(req.params.nodeID);

      // find a map with that node
      WardleyMap.findOne({
          _id: mapID,
          archived: false,
          workspace: workspaceID,
          nodes: desiredNodeId
      }).exec(function(err, mapResult) {
          if (err) {
              res.send(err);
              return;
          }
          if (!mapResult) {
              res.statusCode = 404;
              res.send('Map not found in a workspace');
          }
          mapResult.verifyAccess(owner, function() {
              Node.findById(desiredNodeId)
                  .exec(function(err2, result) {
                      if (err2) {
                          return defaultAccessDenied(res, err2);
                      }
                      if (!result) {
                          return defaultAccessDenied(res);
                      }
                      result.remove(function(e, r) {
                          mapResult.formJSON(function(success_result) {
                              res.json(success_result);
                          }, defaultAccessDenied.bind(this.res));
                      });
                  });
          }, defaultAccessDenied.bind(this, res));
      });
  });

  module.router.post(
      '/workspace/:workspaceID/map/:mapID/node/:nodeID1/outgoingDependency/:nodeID2',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var mapID = req.params.mapID;
          var nodeID1 = new ObjectId(req.params.nodeID1);
          var nodeID2 = new ObjectId(req.params.nodeID2);
          var parentMap = new ObjectId(mapID);

          Node
              .findById(nodeID1) //two ids we are looking for
              .exec(function(err, node) {
                  if (err) {
                      res.statusCode = 500;
                      res.json(err);
                      return;
                  }
                  node.makeDependencyTo(nodeID2, function(err, result) {
                      WardleyMap.findOne({
                              _id: mapID,
                              archived: false,
                              workspace: workspaceID,
                          })
                          .populate('nodes')
                          .exec(function(err2, mapResult2) {
                              if (err2) {
                                  res.statusCode = 500;
                                  res.send(err2);
                                  return;
                              }
                              if (err === 400) {
                                  res.statusCode = 400;
                              }
                              mapResult2.verifyAccess(owner, function() {
                                  res.json({
                                      map: mapResult2.toObject()
                                  });
                              }, defaultAccessDenied.bind(this, res));

                          });
                  });
              });
      });

  module.router.delete(
      '/workspace/:workspaceID/map/:mapID/node/:nodeID1/outgoingDependency/:nodeID2',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var mapID = req.params.mapID;
          var nodeID1 = new ObjectId(req.params.nodeID1);
          var nodeID2 = new ObjectId(req.params.nodeID2);
          var parentMap = new ObjectId(mapID);

          Node
              .findById(nodeID1)
              .exec(function(err, node) {
                  if (err) {
                      res.statusCode = 500;
                      res.json(err);
                      return;
                  }
                  node.removeDependencyTo(nodeID2, function(err, result) {
                      WardleyMap.findOne({
                              _id: mapID,
                              archived: false,
                              workspace: workspaceID,
                          })
                          .populate('nodes')
                          .exec(function(err2, mapResult2) {
                              if (err2) {
                                  res.statusCode = 500;
                                  res.send(err2);
                                  return;
                              }
                              mapResult2.verifyAccess(owner, function() {
                                  res.json({
                                      map: mapResult2.toObject()
                                  });
                              }, defaultAccessDenied.bind(this, res));
                          });
                  });
              });
      });

      module.router.post(
          '/workspace/:workspaceID/map/:mapID/node/:nodeID1/action/',
          authGuardian.authenticationRequired,
          function(req, res) {
              var owner = getUserIdFromReq(req);
              var workspaceID = req.params.workspaceID;
              var mapID = req.params.mapID;
              var nodeID1 = new ObjectId(req.params.nodeID1);
              var parentMap = new ObjectId(mapID);
              var actionPos = req.body;

              Node
                  .findById(nodeID1) //two ids we are looking for
                  .exec(function(err, node) {
                      if (err) {
                          res.statusCode = 500;
                          res.json(err);
                          return;
                      }
                      node.makeAction(actionPos, function(err, result) {
                          WardleyMap.findOne({
                                  _id: mapID,
                                  archived: false,
                                  workspace: workspaceID,
                              })
                              .populate('nodes')
                              .exec(function(err2, mapResult2) {
                                  if (err2) {
                                      res.statusCode = 500;
                                      res.send(err2);
                                      return;
                                  }
                                  if (err === 400) {
                                      res.statusCode = 400;
                                  }
                                  mapResult2.verifyAccess(owner, function() {
                                      res.json({
                                          map: mapResult2.toObject()
                                      });
                                  }, defaultAccessDenied.bind(this, res));

                              });
                      });
                  });
          });

      module.router.put(
          '/workspace/:workspaceID/map/:mapID/node/:nodeID1/action/:seq',
          authGuardian.authenticationRequired,
          function(req, res) {
              var owner = getUserIdFromReq(req);
              var workspaceID = req.params.workspaceID;
              var mapID = req.params.mapID;
              var nodeID1 = new ObjectId(req.params.nodeID1);
              var parentMap = new ObjectId(mapID);
              var seq = req.params.seq;
              var actionBody = req.body;

              Node
                  .findById(nodeID1) //two ids we are looking for
                  .exec(function(err, node) {
                      if (err) {
                          res.statusCode = 500;
                          res.json(err);
                          return;
                      }
                      node.updateAction(seq, actionBody, function(err, result) {
                          WardleyMap.findOne({
                                  _id: mapID,
                                  archived: false,
                                  workspace: workspaceID,
                              })
                              .populate('nodes')
                              .exec(function(err2, mapResult2) {
                                  if (err2) {
                                      res.statusCode = 500;
                                      res.send(err2);
                                      return;
                                  }
                                  if (err === 400) {
                                      res.statusCode = 400;
                                  }
                                  mapResult2.verifyAccess(owner, function() {
                                      res.json({
                                          map: mapResult2.toObject()
                                      });
                                  }, defaultAccessDenied.bind(this, res));

                              });
                      });
                  });
          });

      module.router.delete(
          '/workspace/:workspaceID/map/:mapID/node/:nodeID1/action/:seq',
          authGuardian.authenticationRequired,
          function(req, res) {
              var owner = getUserIdFromReq(req);
              var workspaceID = req.params.workspaceID;
              var mapID = req.params.mapID;
              var nodeID1 = new ObjectId(req.params.nodeID1);
              var parentMap = new ObjectId(mapID);
              var seq = req.params.seq;

              Node
                  .findById(nodeID1) //two ids we are looking for
                  .exec(function(err, node) {
                      if (err) {
                          res.statusCode = 500;
                          res.json(err);
                          return;
                      }
                      node.deleteAction(seq, function(err, result) {
                          WardleyMap.findOne({
                                  _id: mapID,
                                  archived: false,
                                  workspace: workspaceID,
                              })
                              .populate('nodes')
                              .exec(function(err2, mapResult2) {
                                  if (err2) {
                                      res.statusCode = 500;
                                      res.send(err2);
                                      return;
                                  }
                                  if (err === 400) {
                                      res.statusCode = 400;
                                  }
                                  mapResult2.verifyAccess(owner, function() {
                                      res.json({
                                          map: mapResult2.toObject()
                                      });
                                  }, defaultAccessDenied.bind(this, res));

                              });
                      });
                  });
          });


  module.router.get(
      '/workspace/:workspaceID/components/unprocessed',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          Workspace.findOne({
              archived: false,
              owner: owner, //confirms owner & access
              _id: new ObjectId(workspaceID)
          }).exec(function(err, result) {
              if (!result) {
                  return res.send(403);
              }
              result.findUnprocessedNodes()
                  .fail(function(e) {
                      res.status(500).json(e);
                  })
                  .done(function(maps) {
                      res.json({
                          maps: maps
                      });
                  });
          });
      });


  module.router.get(
      '/workspace/:workspaceID/components/processed',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;

          Workspace
              .findOne({
                  archived: false,
                  owner: owner,
                  _id: workspaceID
              }).then(function(workspace) {
                  if (!workspace) {
                      return res.send(404);
                  }
                  return workspace.findProcessedNodes();
              })
              .fail(function(e) {
                  capabilityLogger.error('responding...', e);
                  res.status(500).json(e);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding get processed', wk._id ? wk.capabilityCategories[0].capabilities[0].aliases[0] : 'null');
                  res.json({
                      workspace: wk
                  });
              });
      });


  module.router.post(
      '/workspace/:workspaceID/capabilitycategory/:categoryID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var categoryID = new ObjectId(req.params.categoryID);
          var nodeID = new ObjectId(req.params.nodeID);
          capabilityLogger.trace(workspaceID, categoryID, nodeID);
          Workspace
              .findOne({
                  _id: workspaceID,
                  owner: owner,
                  archived: false
              })
              .exec()
              .then(function(workspace) {
                  if (!workspace) {
                      res.status(404).json("workspace not found");
                      return null;
                  }
                  return workspace.createNewCapabilityAndAliasForNode(categoryID, nodeID);
              })
              .fail(function(e) {
                  capabilityLogger.error('responding with error', e);
                  res.status(500).json(e);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
              });
      });


  module.router.put(
      '/workspace/:workspaceID/capability/:capabilityID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var capabilityID = new ObjectId(req.params.capabilityID);
          var nodeID = new ObjectId(req.params.nodeID);
          capabilityLogger.trace(workspaceID, capabilityID, nodeID);
          Workspace
              .findOne({
                  _id: workspaceID,
                  owner: owner,
                  archived: false,
              })
              .exec()
              .then(function(workspace) {
                  if (!workspace) {
                      res.status(404).json("workspace not found");
                      return null;
                  }
                  return workspace.createNewAliasForNodeInACapability(capabilityID, nodeID);
              })
              .fail(function(e) {
                  capabilityLogger.error('responding...', e);
                  res.status(500).json(e);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
              });
      });

  module.router.put(
      '/workspace/:workspaceID/alias/:aliasID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var aliasID = new ObjectId(req.params.aliasID);
          var nodeID = new ObjectId(req.params.nodeID);
          capabilityLogger.trace(workspaceID, aliasID, nodeID);

          Workspace
              .findOne({
                  _id: workspaceID,
                  owner: owner,
                  archived: false,
              })
              .exec()
              .then(function(workspace) {
                  if (!workspace) {
                      return res.status(404).json("workspace not found");
                  }
                  return workspace.addNodeToAlias(aliasID, nodeID);
              })
              .fail(function(e) {
                  capabilityLogger.error('responding...', e);
                  res.status(500).json(e);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
              });
      });

  module.router.get(
    '/workspace/:workspaceID/node/:nodeID/usage',
    authGuardian.authenticationRequired,
    function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var nodeID = new ObjectId(req.params.nodeID);
      Workspace
          .findOne({
              _id: workspaceID,
              owner: owner,
              archived: false
          }) // this is not the best security check as we do not check relation between workspace & cap & node
          .populate({
              path: 'capabilityCategories',
              populate: {
                  path: 'capabilities',
                  populate: {
                      path: 'aliases',
                      populate: {
                          model: 'Node',
                          path: 'nodes',
                          populate: {
                            model:'WardleyMap',
                            path: 'parentMap'
                          }
                      }
                  }
              }
          })
          .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }

          var capability = null;
          for (var i = 0; i < workspace.capabilityCategories.length; i++) {
              for (var j = 0; j < workspace.capabilityCategories[i].capabilities.length; j++) {
                  for (var k = 0; k < workspace.capabilityCategories[i].capabilities[j].aliases.length; k++) {
                      for (var l = 0; l < workspace.capabilityCategories[i].capabilities[j].aliases[k].nodes.length; l++) {
                          if (nodeID.equals(workspace.capabilityCategories[i].capabilities[j].aliases[k].nodes[l]._id)) {
                              capability = workspace.capabilityCategories[i].capabilities[j];
                          }
                      }
                  }
              }
          }
          return res.json({capability: capability});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });


  module.router.delete(
    '/workspace/:workspaceID/capability/:capabilityID',
    authGuardian.authenticationRequired,
    function(req, res) {
        var owner = getUserIdFromReq(req);
        var workspaceID = req.params.workspaceID;
        var capabilityID = new ObjectId(req.params.capabilityID);
        capabilityLogger.trace(workspaceID, capabilityID);
        Workspace
            .findOne({
                _id: workspaceID,
                owner: owner,
                archived: false
            }) // this is not the best security check as we do not check relation between workspace & cap & node
            .exec()
            .then(function(workspace) {
                if (!workspace) {
                    res.status(404).json("workspace not found");
                    return null;
                }
                var promises = [];
                var capability = null;
                for (var i = 0; i < workspace.capabilityCategories.length; i++) {
                    for (var j = 0; j < workspace.capabilityCategories[i].capabilities.length; j++) {
                        if (capabilityID.equals(workspace.capabilityCategories[i].capabilities[j]._id)) {
                            capability = workspace.capabilityCategories[i].capabilities[j];
                            workspace.capabilityCategories[i].capabilities.splice(j, 1);
                            break;
                        }
                    }
                }
                promises.push(workspace.save());
                for (var k = 0; k < capability.aliases.length; k++) {
                    for (var l = 0; l < capability.aliases[k].nodes.length; l++) {
                        promises.push(Node.findOneAndUpdate({
                            _id: capability.aliases[k].nodes[l]
                        }, {
                            $set: {
                                processedForDuplication: false
                            }
                        }).exec());
                    }
                }
                return q.all(promises);
            })
            .then(function(ur) {
                capabilityLogger.trace('populating response...');
                var wkPromise = Workspace
                    .findOne({
                        archived: false,
                        owner: owner,
                        _id: workspaceID
                    })
                    .populate({
                        path: 'capabilityCategories',
                        populate: {
                            path: 'capabilities',
                            populate: {
                                path: 'aliases',
                                populate: {
                                    model: 'Node',
                                    path: 'nodes'
                                }
                            }
                        }
                    })
                    .exec();
                return wkPromise;
            })
            .then(function(wk) {
                capabilityLogger.trace('responding ...');
                res.json({
                    workspace: wk
                });
            })
            .fail(function(e) {
                capabilityLogger.error('responding...', e);
                res.status(500).json(e);
            });
    });

  return module;
};
