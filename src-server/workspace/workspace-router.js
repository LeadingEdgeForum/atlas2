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
/*jshint esversion: 6 */


var _ = require('underscore');
var logger = require('./../log');
var submapLogger = require('./../log').getLogger('submap');
var capabilityLogger = require('./../log').getLogger('capability');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var q = require('q');

var log4js = require('log4js');
submapLogger.setLevel(log4js.levels.WARN);


var getStormpathUserIdFromReq = function(req) {
  if (req && req.user && req.user.href) {
    var href = req.user.href;
    return href.substr(href.lastIndexOf('/') + 1);
  }
  //should never happen as indicates lack of authentication
  console.error('user.href not present');
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

var removeEmptyCapabilities = function(workspace){
  if(!workspace){
    return null;
  }
  workspace.capabilityCategories.forEach(function(cat){
    for(var j = cat.capabilities.length - 1; j >= 0; j--){
      for(var k = cat.capabilities[j].aliases.length - 1; k>= 0; k--){
        var alias = cat.capabilities[j].aliases[k];
        if(alias.nodes.length === 0){
          cat.capabilities[j].aliases.splice(k,1);
          console.log('removing empty alias');
        }
      }
      if(cat.capabilities[j].aliases.length === 0){
        console.log('removing empty cap');
        cat.capabilities.splice(j,1);
      }
    }
  });
  return workspace;
};

module.exports = function(stormpath, mongooseConnection) {
  var Model = require('./model')(mongooseConnection);
  var WardleyMap = Model.WardleyMap;
  var Workspace = Model.Workspace;
  var Node = Model.Node;
  var Alias = Model.Alias;
  var CapabilityCategory = Model.CapabilityCategory;
  var Capability = Model.Capability;

  var module = {};

  module.router = require('express').Router();

  // this is so shitty.... the name should be calculated client side
  // TODO: fix this
  module.router.get('/map/:mapID/name', stormpath.authenticationRequired, function(req, res) {
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).select('user purpose name').exec(function(err, result) {
      if(result.user && result.purpose){
        res.json({map: {_id : result._id, name:'As ' + result.user + ', I want to ' + result.purpose + '.'}});
      } else {
        res.json({map: {_id : result._id, name:result.name + '.'}});
      }
    });
  });


  module.router.get('/workspaces/', stormpath.authenticationRequired, function(req, res) {

    Workspace.find({
      owner: getStormpathUserIdFromReq(req),
      archived: false
    }, function(err, results) {
      console.error(err);
      var responseObject = {
        workspaces: []
      };
      results.forEach(workspace => responseObject.workspaces.push({workspace: workspace}));
      res.json(responseObject);
    });
  });

  module.router.post('/workspace/', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var name = req.body.name;
    if (!name) {
      name = "Anonymous workspace";
    }
    var description = req.body.description;
    if (!description) {
      description = "I am too lazy to fill this field even when I know it causes organizational mess";
    }
    var purpose = req.body.purpose;
    if (!purpose) {
      purpose = "No apparent purpose";
    }
    var wkspc = new Workspace({
      name: name,
      description: description,
      purpose:purpose,
      owner: owner,
      archived: false
    });
    var promisesToSave = [];
    var capabilityCategories = ['Customer Service','Product','Administrative','Quality','Operational','Marketing', 'Research','Finances'];
    capabilityCategories.forEach(function(name){
      promisesToSave.push((new CapabilityCategory({name})).save());
    });
    q.all(promisesToSave)
      .then(function(results){
        wkspc.capabilityCategories = results;
        return wkspc.save();
      })
      .fail(function(e){
          res.status(500).json(e);
      })
      .done(function(wkspc){
          res.json(wkspc);
      });
  });

  module.router.get('/workspace/:workspaceID', stormpath.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).populate('maps capabilityCategories').exec(function(err, result) {
      res.json({workspace: result});
    });
  });

  module.router.get('/map/:mapID', stormpath.authenticationRequired, function(req, res) {
    WardleyMap.findOne({
        owner: getStormpathUserIdFromReq(req),
        _id: req.params.mapID,
        archived: false})
    .populate('nodes')
    .exec(function(err, result) {
      if(err){
        console.error(err);
        res.json(err);
      }
      if(!result){
        res.statusCode = 404;
        res.send('map not found');
      }
      res.json({map: result});
    });
  });

  module.router.get('/submaps/map/:mapID', stormpath.authenticationRequired, function(req, res){
    WardleyMap.findOne({
      owner: getStormpathUserIdFromReq(req),
      _id: req.params.mapID,
      archived: false
    }).exec(function(err, targetMap) {
      // so we have a map that has a workspaceID, now it is time to look for all the maps within the workspace that has submap flag
      // we obviously miss a case where the map is already referenced, but let's leave it for future
      WardleyMap.find({
        workspace : targetMap.workspace,
        archived: false,
        owner: getStormpathUserIdFromReq(req),
        isSubmap : true
      }).exec(function(err, results){
        //handle the results - repack them into something useful.
        var listOfAvailableSubmaps = [];
        for(var i = 0; i < results.length; i++){
          listOfAvailableSubmaps.push({_id:results[i]._id, name:results[i].name});
        }
        res.json({listOfAvailableSubmaps:listOfAvailableSubmaps});
      });
    });
  });

  module.router.get('/submap/:submapID/usage', stormpath.authenticationRequired, function(req, res){
    Node.find({type:'SUBMAP', submapID : req.params.submapID}).select('parentMap').exec(function(e,r){
      var ids = [];
      r.forEach(item => ids.push(item.parentMap));
      WardleyMap
        .find({
          owner: getStormpathUserIdFromReq(req),
          archived: false,
          _id : {$in : ids}
        })
        .populate('nodes')
        .select('name user purpose _id').exec(function(err, availableMaps) {
            res.json(availableMaps);
        });
    });
  });

  module.router.put('/map/:mapID/submap/:submapID', stormpath.authenticationRequired, function(req, res) {

    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err0, map) {
      WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.submapID, archived: false}).exec(function(err1, submap) {
      var x = req.body.coords.x;
      var y = req.body.coords.y;

      var artificialNode = new Node({
              name:submap.name,
              workspace: map.workspace,
              parentMap: map,
              type:'SUBMAP',
              x:x,
              y:y,
              submapID : submap._id
            });
      artificialNode.save(function(err2, savedNode){
        map.nodes.push(savedNode);
        map.save(function(err3, savedMap){
            savedMap.populate('nodes', function(err4){
                //TODO: error loggin
                res.json({map:savedMap});
            });
        });
      });
    });
  });
});

  module.router.put('/map/:mapID/submap', stormpath.authenticationRequired, function(req, res) {
    var listOfNodesToSubmap = req.body.listOfNodesToSubmap ? req.body.listOfNodesToSubmap : [];
    var submapName = req.body.name;
    var coords = req.body.coords;
    var owner = getStormpathUserIdFromReq(req);
    submapLogger.trace({
      submapName:submapName,
      coords:coords,
      owner:owner,
      listOfNodesToSubmap:listOfNodesToSubmap });
    var toSave = [];
    var transferredNodes = [];

    WardleyMap.findOne({ // a very primitive check that we actually have right to the particular mapś
          owner: getStormpathUserIdFromReq(req),
          _id: req.params.mapID,
          archived: false})
      .populate('nodes')
      .exec(function(err, affectedMap) {
          //check that we actually own the map, and if yes
          var submap = new WardleyMap({
            name      : submapName,
            isSubmap  : true,
            owner     : getStormpathUserIdFromReq(req),
            workspace : affectedMap.workspace,
            archived  : false
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
                            res.json({map:p});
                          });
                    });
                  });
                });
              });
            });

          });

    });
  });

  module.router.put('/map/:mapID', stormpath.authenticationRequired, function(req, res) {
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, result) {
      // console.log('map found', err, result, req.body.map);
      //check that we actually own the map, and if yes
      if (result) {
        _.extend(result, req.body.map);
        _.extend(result.archived, false);

        result.save(function(err2, result2) {
          if (err2) {
            res.status(500);
          }
          WardleyMap
            .findOne({_id:result2._id})
            .populate('nodes')
            .exec(function(e3,mapresult){
              res.json(err2
                ? err2 // jshint ignore:line
                : {
                  map: mapresult
                });
          });
        });
      }
    });
  });

  module.router.put('/workspace/:workspaceID', stormpath.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).exec(function(err, result) {
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

  // TODO: remove nodes pointing to this map if it is a submap
  module.router.delete('/map/:mapID', stormpath.authenticationRequired, function(req, res) {
    WardleyMap
      .findOne({
          owner: getStormpathUserIdFromReq(req),
          _id: req.params.mapID,
          archived: false})
      .populate('workspace')
      .exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        res.status(500).json(err);
        return;
      }
      if (result) {
        result.archived = true;
        var worskpace = result.workspace;
        worskpace.maps.pull(result._id);
        worskpace.save(function(e1, savedWorkspace){
          result.save(function(e2, savedMap) {
            if(e1 || e2){
              res.status(500).json([e1,e2]);
              return;
            }
            res.json({map: null});
          });
        });
      }
    });
  });

  module.router.delete('/workspace/:workspaceID', stormpath.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).exec(function(err, result) {
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

  module.router.post('/map/', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var user = req.body.user;
    if (!user) {
      user = "your competitor";
    }
    var purpose = req.body.purpose;
    if (!purpose) {
      purpose = "be busy with nothing";
    }
    var workspaceID = req.body.workspaceID;
    if (!workspaceID) {
      res.send('Missing workspaceID');
      return;
    }

    Workspace.findOne({ //this is check that the person logged in can actually write to workspace
      _id: workspaceID,
      owner: owner,
      archived: false
    }, function(err, result) {
      // console.log('workspace found', err, result);
      if (err) {
        res.send(err);
        // console.error(err);
        return;
      }
      if (!result) {
        // res.send("workspace not found");
        return;
      }
      var wm = new WardleyMap({user: user, purpose: purpose, owner: owner, workspace: result._id, archived: false});
      wm.save(function(err, savedMap) {
        // console.log('map saved', err, savedMap);
        if (err) {
          res.send(err);
          return;
        }
        result.maps.push(savedMap._id);
        result.save(function(err, saveResult) {
          // console.log('workspace saved', err, saveResult);
          res.json({map: savedMap});
        });
      });
    });
  });


  module.router.post('/workspace/:workspaceID/map/:mapID/node', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var name = req.body.name;
    var x = req.body.x;
    var y = req.body.y;
    var type = req.body.type;
    var parentMap = new ObjectId(mapID);

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
      _id: mapID,
      owner: owner,
      archived: false,
      workspace : workspaceID
    }, function(err, mapResult) {
      if (err) {
        res.send(err);
        return;
      }
      if(!mapResult){
        res.statusCode = 404;
        res.send('Map not found in a workspace');
      }

      var newNode = new Node({
        name : name,
        x : x,
        y : y,
        type : type,
        workspace : new ObjectId(workspaceID),
        parentMap : parentMap
      });
      newNode.save(function(errNewNode, resultNewNode){
        if(errNewNode){
          res.statusCode = 500;
          res.send(errNewNode);
          return;
        }
        mapResult.nodes.push(resultNewNode._id);
        mapResult.save(function(errModifiedMap, resultModifiedMap){
          if(errModifiedMap){
            console.error('Inconsistent database node created but not added to map');
            res.statusCode = 500;
            res.send(errModifiedMap);
          }
          WardleyMap.populate(
            resultModifiedMap,
            {path:'nodes', model: 'Node'},
            function(popError, popResult){
              res.json({map: popResult});
            });
          });
      });
    });
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/node/:nodeID', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var name = req.body.name;
    var x = req.body.x;
    var y = req.body.y;
    var type = req.body.type;
    var parentMap = new ObjectId(mapID);
    var desiredNodeId = new ObjectId(req.params.nodeID);

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
      _id: mapID,
      owner: owner,
      archived: false,
      workspace : workspaceID,
    })
    .populate('nodes')
    .exec(function(err, mapResult) {
      if (err) {
        res.send(err);
        return;
      }
      if(!mapResult){
        res.statusCode = 404;
        res.send('Map not found in a workspace');
      }

      var found = false;
      for(var i = 0; i < mapResult.nodes.length; i++){
        if(desiredNodeId.equals(mapResult.nodes[i]._id)){
          found = true;
          var modifiedNode = mapResult.nodes[i];

          if (name) {
            modifiedNode.name = name;
          }
          if (x) {
            modifiedNode.x = x;
          }
          if (y) {
            modifiedNode.y = y;
          }
          if (type) {
            modifiedNode.type = type;
          }

          modifiedNode.save(
            function(errNodeSave, resultNodeSave){ //jshint ignore:line
              if(errNodeSave){
                res.statusCode = 500;
                res.send(errNodeSave);
                return;
              }
              WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
                // all owners should be replaced with some sort of accessibility check
                _id: mapID,
                owner: owner,
                archived: false,
                workspace : workspaceID,
              })
              .populate('nodes')
              .exec(function(err2, mapResult2) {
                  if(err2){
                    res.statusCode = 500;
                    res.send(err2);
                    return;
                  }
                  res.json({map: mapResult2});
              });
            }
          );
          break;
        }
      }
      if(!found){
        res.statusCode = 404;
        res.send('Node not found in a map');
      }
    });
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/node/:nodeID', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var parentMap = new ObjectId(mapID);
    var desiredNodeId = new ObjectId(req.params.nodeID);

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
      _id: mapID,
      owner: owner,
      archived: false,
      workspace : workspaceID,
    }).exec(function(err, mapResult) {
      if (err) {
        res.send(err);
        return;
      }
      if(!mapResult){
        res.statusCode = 404;
        res.send('Map not found in a workspace');
      }
      Node.findById(desiredNodeId)
        .exec(function(err,result){
          if(err){
            res.statusCode = 500;
            res.send(err);
            return;
          }
          result.remove(function(e, r){
            WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
              // all owners should be replaced with some sort of accessibility check
              _id: mapID,
              owner: owner,
              archived: false,
              workspace : workspaceID,
            })
            .populate('nodes')
            .exec(function(err2, mapResult2) {
                if(err2){
                  res.statusCode = 500;
                  res.send(err2);
                  return;
                }
                res.json({map: mapResult2});
            });
          });
        });
    });
  });

  module.router.post(
    '/workspace/:workspaceID/map/:mapID/node/:nodeID1/outgoingDependency/:nodeID2',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var nodeID1 = new ObjectId(req.params.nodeID1);
      var nodeID2 = new ObjectId(req.params.nodeID2);
      var parentMap = new ObjectId(mapID);

      Node
        .findById(nodeID1) //two ids we are looking for
        .exec(function(err, node){
          if(err){
            res.statusCode = 500;
            res.json(err);
            return;
          }
          node.makeDependencyTo(nodeID2, function(err, result){
            WardleyMap.findOne({
              _id: mapID,
              owner: owner,
              archived: false,
              workspace : workspaceID,
            })
            .populate('nodes')
            .exec(function(err2, mapResult2) {
                if(err2){
                  res.statusCode = 500;
                  res.send(err2);
                  return;
                }
                if(err === 400){
                  res.statusCode = 400;
                }
                res.json({map: mapResult2});
            });
          });
        });
  });

  module.router.delete(
    '/workspace/:workspaceID/map/:mapID/node/:nodeID1/outgoingDependency/:nodeID2',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var nodeID1 = new ObjectId(req.params.nodeID1);
      var nodeID2 = new ObjectId(req.params.nodeID2);
      var parentMap = new ObjectId(mapID);

      Node
        .findById(nodeID1)
        .exec(function(err, node){
          if(err){
            res.statusCode = 500;
            res.json(err);
            return;
          }
          node.removeDependencyTo(nodeID2, function(err, result){
            WardleyMap.findOne({
              _id: mapID,
              owner: owner,
              archived: false,
              workspace : workspaceID,
            })
            .populate('nodes')
            .exec(function(err2, mapResult2) {
                if(err2){
                  res.statusCode = 500;
                  res.send(err2);
                  return;
                }
                res.json({map: mapResult2});
            });
          });
        });
  });

  module.router.get(
    '/workspace/:workspaceID/components/unprocessed',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      WardleyMap
        .find({       // find all undeleted maps within workspace
          archived:false,
          owner: owner,
          workspace : workspaceID
        })
        .select('user purpose name')
        .then(function(maps){
          var loadPromises = [];
          maps.forEach(function(cv, i, a){
              loadPromises.push(Node
                .find({
                  parentMap : cv,
                  processedForDuplication : false
                })
                .then(function(nodes){
                    a[i].nodes = nodes;
                    return a[i];
                }));
          });
          return q.all(loadPromises)
                  .then(function(results){
                    var finalResults = [];
                    return results.filter(function(map){
                        return map.nodes && map.nodes.length > 0;
                    });
                  });
        })
        .fail(function(e){
          res.status(500).json(e);
        })
        .done(function(maps){
          res.json({maps:maps});
        })
        ;
  });


  module.router.get(
    '/workspace/:workspaceID/components/processed',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;

      Workspace
        .findOne({
          archived : false,
          owner : owner,
          _id : workspaceID
        })
        .populate({
            path: 'capabilityCategories',
            model: 'CapabilityCategory',
            populate : {
              path: 'capabilities',
              model: 'Capability',
              populate : {
                path: 'aliases',
                model : 'Alias',
                populate: {
                  model: 'Node',
                  path:'nodes'
                }
              }
            }
        })
        .exec()
        .then(function(wk){
          capabilityLogger.trace('responding get', wk._id ? wk._id : 'null');
          res.json({workspace: removeEmptyCapabilities(wk)});
        }).fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });


  module.router.post(
    '/workspace/:workspaceID/capabilitycategory/:categoryID/node/:nodeID',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var categoryID = req.params.categoryID;
      var nodeID = req.params.nodeID;
      capabilityLogger.trace(workspaceID, categoryID, nodeID);
      Workspace
        .find({
            _id : workspaceID,
            owner : owner,
            archived : false,
            capabilityCategories : categoryID})
        .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }
          return Node.update({
            _id : nodeID
          },{
            processedForDuplication : true
          },{
            safe:true
          }).exec();
        })
        .then(function(node){
          capabilityLogger.trace('creating alias');
          return new Alias({nodes:[new ObjectId(nodeID)]}).save();
        })
        .then(function(alias){
          capabilityLogger.trace('creating capability');
          return new Capability({aliases:[alias._id]}).save();
        })
        .then(function(capability){
          capabilityLogger.trace('capability created', capability._id);
          capabilityLogger.trace('adding it to category', categoryID);
          return CapabilityCategory.findOneAndUpdate({
                  _id : categoryID
                },{
                  $push : {
                    capabilities : new ObjectId(capability._id)
                  }
                },{
                  safe:true,
                  new:true
                }
          ).exec();
        })
        .then(function(ur){
          capabilityLogger.trace('populating response, update result', ur, ur.isModified());
          var wkPromise =  Workspace
            .findOne({
              archived : false,
              owner : owner,
              _id : workspaceID
            })
            .populate({
                path: 'capabilityCategories',
                model: 'CapabilityCategory',
                populate : {
                  path: 'capabilities',
                  model: 'Capability',
                  populate : {
                    path: 'aliases',
                    model : 'Alias',
                    populate: {
                      model: 'Node',
                      path:'nodes'
                    }
                  }
                }
            })
            .exec();
            return wkPromise;
        })
        .then(function(wk){
          capabilityLogger.trace('responding ...', wk);
          res.json({workspace: removeEmptyCapabilities(wk)});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });


  module.router.put(
    '/workspace/:workspaceID/capability/:capabilityID/node/:nodeID',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var capabilityID = req.params.capabilityID;
      var nodeID = req.params.nodeID;
      capabilityLogger.trace(workspaceID, capabilityID, nodeID);
      Workspace
        .find({
            _id : workspaceID,
            owner : owner,
            archived : false})// this is not the best security check as we do not check relation between workspace & cap & node
        .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }

          return Node.update({
            _id : nodeID
          },{
            processedForDuplication : true
          },{
            safe:true
          }).exec();
        })
        .then(function(node){
          capabilityLogger.trace('creating alias');
          return new Alias({nodes:[new ObjectId(nodeID)]}).save();
        })
        .then(function(alias){
          capabilityLogger.trace('adding alias to capability', alias,  capabilityID);
          return Capability.findOneAndUpdate({
                  _id : capabilityID
                },{
                  $push : {
                    aliases : new ObjectId(alias._id)
                  }
                },{
                  safe:true,
                  new:true
                }
          ).exec();
        })
        .then(function(ur){
          capabilityLogger.trace('populating response', ur);
          var wkPromise =  Workspace
            .findOne({
              archived : false,
              owner : owner,
              _id : workspaceID
            })
            .populate({
                path: 'capabilityCategories',
                model: 'CapabilityCategory',
                populate : {
                  path: 'capabilities',
                  model: 'Capability',
                  populate : {
                    path: 'aliases',
                    model : 'Alias',
                    populate: {
                      model: 'Node',
                      path:'nodes'
                    }
                  }
                }
            })
            .exec();
            return wkPromise;
        })
        .then(function(wk){
          capabilityLogger.trace('responding ...', wk.capabilityCategories[0]);
          res.json({workspace: removeEmptyCapabilities(wk)});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });

  module.router.put(
    '/workspace/:workspaceID/alias/:aliasID/node/:nodeID',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var aliasID = req.params.aliasID;
      var nodeID = req.params.nodeID;
      capabilityLogger.trace(workspaceID, aliasID, nodeID);
      Workspace
        .find({
            _id : workspaceID,
            owner : owner,
            archived : false})// this is not the best security check as we do not check relation between workspace & cap & node
        .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }

          return Node.update({
            _id : nodeID
          },{
            processedForDuplication : true
          },{
            safe:true
          }).exec();
        })
        .then(function(node){
          capabilityLogger.trace('adding to alias');
          return Alias.findOneAndUpdate({
                  _id : aliasID
                },{
                  $push : {
                    nodes : new ObjectId(nodeID)
                  }
                },{
                  safe:true,
                  new:true
                }).exec();
        })
        .then(function(ur){
          capabilityLogger.trace('populating response', ur);
          var wkPromise =  Workspace
            .findOne({
              archived : false,
              owner : owner,
              _id : workspaceID
            })
            .populate({
                path: 'capabilityCategories',
                model: 'CapabilityCategory',
                populate : {
                  path: 'capabilities',
                  model: 'Capability',
                  populate : {
                    path: 'aliases',
                    model : 'Alias',
                    populate: {
                      model: 'Node',
                      path:'nodes'
                    }
                  }
                }
            })
            .exec();
            return wkPromise;
        })
        .then(function(wk){
          capabilityLogger.trace('responding ...', wk.capabilityCategories[0]);
          res.json({workspace: removeEmptyCapabilities(wk)});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });

  module.router.get(
    '/workspace/:workspaceID/node/:nodeID/usage',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var nodeID = req.params.nodeID;
      Workspace
        .find({
            _id : workspaceID,
            owner : owner,
            archived : false})// this is not the best security check as we do not check relation between workspace & cap & node
        .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }

          return Alias.findOne({nodes : nodeID}).exec();
        })
        .then(function(alias){
          capabilityLogger.trace('tracking parent capability');
          if(!alias) {return alias;}
          return Capability.findOne({
                  aliases : alias._id
                }).populate({
                  path: 'aliases',
                  model : 'Alias',
                  populate: {
                    model: 'Node',
                    path:'nodes',
                    populate: {
                      model:'WardleyMap',
                      path: 'parentMap'
                    }
                  }
                }).exec();
        })
        .then(function(cp){
          capabilityLogger.trace('responding ...', cp);
          res.json({capability: cp});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });


  module.router.delete(
    '/workspace/:workspaceID/capability/:capabilityID',
    stormpath.authenticationRequired,
    function(req, res) {
      var owner = getStormpathUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var capabilityID = req.params.capabilityID;
      capabilityLogger.trace(workspaceID, capabilityID);
      Workspace
        .find({
            _id : workspaceID,
            owner : owner,
            archived : false})// this is not the best security check as we do not check relation between workspace & cap & node
        .exec()
        .then(function(workspace){
          if(!workspace){
            res.status(404).json("workspace not found");
            return null;
          }
          return Capability.findById(capabilityID).exec();
        })
        .then(function(cap){
          return cap.remove();
        })
        .then(function(ur){
          capabilityLogger.trace('populating response...');
          var wkPromise =  Workspace
            .findOne({
              archived : false,
              owner : owner,
              _id : workspaceID
            })
            .populate({
                path: 'capabilityCategories',
                model: 'CapabilityCategory',
                populate : {
                  path: 'capabilities',
                  model: 'Capability',
                  populate : {
                    path: 'aliases',
                    model : 'Alias',
                    populate: {
                      model: 'Node',
                      path:'nodes'
                    }
                  }
                }
            })
            .exec();
            return wkPromise;
        })
        .then(function(wk){
          capabilityLogger.trace('responding ...');
          res.json({workspace: removeEmptyCapabilities(wk)});
        })
        .fail(function(e){
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });

  return module;
};
