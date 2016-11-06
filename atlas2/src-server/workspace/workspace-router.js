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

var Model = require('./model');
var WardleyMap = Model.WardleyMap;
var Workspace = Model.Workspace;
var Node = Model.Node;
var _ = require('underscore');
var logger = require('./../log');
var submapLogger = require('./../log').getLogger('submap');
submapLogger.Level = 'TRACE';
var mongoose = require('mongoose');
var q = require('q');
mongoose.Promise = q.Promise;
var ObjectId = mongoose.Types.ObjectId;


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


var cleanNodeCapability = function(removeAllNodes, owner, mapID, nodeID, callback){
  if(!removeAllNodes){
    console.error('cleaning single node category not implemented yet, fallback on removing all nodes');
  }
  WardleyMap.findOne({owner: owner, _id: mapID, archived: false}).exec(function(err, mainAffectedMap) {
    //check that we actually own the map, and if yes
    if (mainAffectedMap) {
      console.log('Map subject to cleaning', mainAffectedMap);
      var mainAffectedNode = null;
      for (var i = 0; i < mainAffectedMap.nodes.length; i++) {
        var _node = mainAffectedMap.nodes[i];
        // this compare is intentional as _node.id is object and nodeID is string from URL
        if (_node.id == nodeID) { //jshint ignore:line
          _node.categorized = false;
          _node.category = null;
          mainAffectedNode = _node;
        }
      }
      var referencedNodes = [mainAffectedNode._id];  // this will be a whole cluster of all nodes that point at each other
      for (var j = 0; j < mainAffectedNode.referencedNodes.length; j++) {
        referencedNodes.push(mainAffectedNode.referencedNodes[j].nodeID);
      }

      var query = WardleyMap.find({
        'nodes._id' : {$in:referencedNodes}
      });

      query.exec(function(err2, affectedMapsArray) {
        if (err2) {
          callback(err2);
          return;
        }
        affectedMapsArray.map(map => {
          map.nodes.map(node => {
            referencedNodes.map(referencedNode => {
              if ("" + node._id === "" + referencedNode) {
                //TODO: instead of cleaning all nodes, it should be possible to remove one node from category and remove its reference from other nodes
                node.categorized = false;
                node.category = null;
                node.referencedNodes = [];
              }
            });
          });
        });
        // and the tricky part - save all maps
        var limit = affectedMapsArray.length;
        var counter = 0;
        var errors = [];
        var results = [];
        affectedMapsArray.map(map => {
          map.save(function(err3, result3) {
            if (err3) {
              errors.push(err3);
              counter++;
            } else {
              results.push(result3);
              counter++;
            }
            if (counter === limit) {
              if (errors.length !== 0) {
                callback(errors, null);
              } else {
                //callback with one map if possible
                var oneMapCallback = false;
                for(var z = 0; z < results.length;z++){
                  if(''+results[z]._id === ''+mainAffectedMap._id){
                      oneMapCallback = true;
                      callback(null, results[z]);
                      break;
                  }
                }
                if(!oneMapCallback){
                  console.error('Could not find the map to return');
                }
              }
            }
          });
        });
      });
    }
  });
};

var deleteNode = function(err, mainAffectedMap, nodeID,  callback) {

  //check that we actually own the map, and if yes
  if (err) {
    callback(err);
  }
  if(!mainAffectedMap){
    callback('map not found');
  }
  if(mainAffectedMap){
    // remove the component from nodes
    for(var k = mainAffectedMap.nodes.length - 1; k>=0; k--){
      if(mainAffectedMap.nodes[k]._id + "" === "" + nodeID){
        mainAffectedMap.nodes.splice(k, 1);
      } else {
        // if node is not being removed, scan all the connections
        for(var l = mainAffectedMap.nodes[k].dependencies.length - 1; l >= 0; l--){
          // at this point we do not have depenency Types
          if(mainAffectedMap.nodes[k].dependencies[l].nodeID === "" + nodeID){
            mainAffectedMap.nodes[k].dependencies.splice(l,1);
          }
        }
      }
    }
    mainAffectedMap.save(callback);
  }
};
/**
Remove object from populated list
*/
var removeFromArrayBy_ID = function(array, item){
  for(var i = 0; i < array.length; i++){
    if(array[i]._id.equals(item._id)){
      array.splice(i,1);
      break;
    }
  }
};
/**
Remove object from unpopulated list
*/
var removeFromArrayOfStringsBy_ID = function(array, item){
  for(var i = 0; i < array.length; i++){
    if(array[i].equals('' + item._id)){
      array.splice(i,1);
      break;
    }
  }
};


var multiSave = function(array, callback){
    if(!array || array.length === 0){
      return callback([],[]);
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


module.exports = function(stormpath) {
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
      archived: false,
      capabilityCategories: [
        {
          name: 'Customer Service'
        }, {
          name: 'Product'
        }, {
          name: 'Administrative'
        }, {
          name: 'Quality'
        }, {
          name: 'Operational'
        }, {
          name: 'Marketing'
        }, {
          name: 'Research'
        }, {
          name: 'Finances'
        }
      ]
    });
    wkspc.save(function(err, result) {
      if (err) {
        res.status(500).json(err);
      }
      res.json(result);
    });
  });

  module.router.get('/workspace/:workspaceID', stormpath.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).populate('maps').exec(function(err, result) {
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
    WardleyMap.find({
      owner: getStormpathUserIdFromReq(req),
      archived: false,
      'nodes.type': 'SUBMAP',
      'nodes.submapID' : req.params.submapID
    }).select('name user purpose _id').exec(function(err, availableMaps) {
        res.json(availableMaps);
    });
  });

  module.router.put('/map/:mapID/submap/:submapID', stormpath.authenticationRequired, function(req, res) {

    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.submapID, archived: false}).exec(function(err, submap) {
      var submapName = submap.name;

      var x = req.body.coords.x;
      var y = req.body.coords.y;

      var fakeNodeID = mongoose.Types.ObjectId();
      var fakeNode = new Node({
              name: submapName,
              _id: fakeNodeID,
              x:x,
              y:y,
              type:'SUBMAP',
              dependencies:[],
              submapID : req.params.submapID});
      WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, affectedMap) {
          affectedMap.nodes.push(fakeNode);
          affectedMap.save(function(err, result){
            if(err){
              res.json(err);
              return;
            }
            res.json({map:result});
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
                    parentMap: affectedMap._id,
                    type:'SUBMAP',
                    submapID : ''+savedSubmap._id});
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
                      savedNode.outboundDependencies.push(transferredNode.outboundDependencies[j]);
                      nodesToSave.push(savedNode);
                      submapLogger.trace('fixing outboundDependencies for transfer');
                    }
                  }

                  // and fix dependencies if necessary
                  for(var j = transferredNode.inboundDependencies.length - 1; j >= 0; j--){
                    if(listOfNodesToSubmap.indexOf(''+ transferredNode.inboundDependencies[j]) === -1){
                      savedNode.inboundDependencies.push(transferredNode.inboundDependencies[j]);
                      nodesToSave.push(savedNode);
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
        result.nodes = req.body.map.nodes || [];
        _.extend(result.archived, false);

        result.save(function(err2, result2) {
          if (err2) {
            res.status(500);
          }
          res.json(err2
            ? err2 // jshint ignore:line
            : {
              map: result2
            });
        });
      }
    });
  });

  var assignComponentToCapability = function(initialResponse, mapID, nodeID, capabilityID) {
    WardleyMap.findOne({_id: mapID, archived: false}).exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        initialResponse.status(500).json(err);
      }
      if (result) {
        for (var i = 0; i < result.nodes.length; i++) {
          var _node = result.nodes[i];
          if (nodeID == _node._id) { //jshint ignore:line
            _node.categorized = true;
            _node.category = capabilityID;
          }
        }
        result.save(function(err2, result2) {
          if (err2) {
            initialResponse.status(500).json(err2);
          } else {
            initialResponse.status(200).end();
          }
        });
      }
    });
  };

  module.router.delete('/map/:mapID/node/:nodeID/capability', stormpath.authenticationRequired, function(req, res) {
    cleanNodeCapability(true, getStormpathUserIdFromReq(req),req.params.mapID, req.params.nodeID, function(err, map){
      WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, mainAffectedMap) {
        //check that we actually own the map, and if yes
        if (err) {
          res.status(500).json(err);
        }
        if(!mainAffectedMap){
          res.status(404).end();
        }
        if(mainAffectedMap){
          res.json(mainAffectedMap);
        }
      });
    });
  });

//TODO: figure out what to do with map archive
  module.router.delete('/map/:mapID/node/:nodeID', stormpath.authenticationRequired, function(req, res) {
    cleanNodeCapability(true, getStormpathUserIdFromReq(req),req.params.mapID, req.params.nodeID, function(err, map){
      // console.log('capability cleaned');
      WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, mainAffectedMap) {
        // console.log('map reloaded', mainAffectedMap);
        deleteNode(err, mainAffectedMap, req.params.nodeID, function(err, result){
          // console.log('node', result);
          if (err) {
            res.status(500).json(err);
          } else {
            res.json({map:result});
          }
          // console.log('done');
        });
      });
      });
    });

  // assign node to existing capability
  module.router.put('/workspace/:workspaceID/capabilityCategory/:capabilityCategoryID/capability/:capabilityID', stormpath.authenticationRequired, function(req, res) {
    assignComponentToCapability(res, req.body.mapID, req.body.nodeID, req.params.capabilityID);
  });

  // create a new capability and assign node to it
  module.router.put('/workspace/:workspaceID/capabilityCategory/:capabilityCategoryID/', stormpath.authenticationRequired, function(req, res) {
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).exec(function(err, result) {
      //check that we actually own the workspace, and if yes
      if (err) {
        res.status(500).json(err);
      }
      if (result) {
        var i = -1;
        var capabilityIndex = -1;
        for (i = 0; i < result.capabilityCategories.length; i++) {
          var capabilityCategory = result.capabilityCategories[i];
          if (capabilityCategory._id == req.params.capabilityCategoryID) { //jshint ignore:line
            capabilityCategory.capabilities.push({name: req.body.name});
            capabilityIndex = capabilityCategory.capabilities.length - 1;
            break;
          }
        }
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
          }
          assignComponentToCapability(res, req.body.mapID, req.body.nodeID, result2.capabilityCategories[i].capabilities[capabilityIndex]._id);
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
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, result) {
      //check that we actually own the map, and if yes
      if (err) {
        res.status(500).json(err);
      }
      if (result) {
        result.archived = true;
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
          }
          Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: result2.workspace, archived: false}).exec(function(err3, result3) {
            //check that we actually own the workspace, and if yes
            if (err3) {
              res.status(500).json(err3);
            }
            if (result3) {
              for (var i = 0; i < result3.maps.length; i++) {
                if (("" + result3.maps[i]) === req.params.mapID) {
                  result3.maps.splice(i, 1); //hide the map from workspace
                }
              }
              result3.save(function(err4, result4) {
                if (err4) {
                  res.status(500).json(err4);
                }
                res.json({map: null});
              });
            }
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
          }
          res.json({workspace: null});
        });
      }
    });
  });

  module.router.put('/reference/:mapID1/:nodeID1/:mapID2/:nodeID2', stormpath.authenticationRequired, function(req, res) {
    var query = WardleyMap.find({owner: getStormpathUserIdFromReq(req)}).where("nodes._id"). in([req.params.nodeID1, req.params.nodeID2]);

    query.exec(function(err, arrayOfMaps) {
      //so we have two maps that have all the nodes, let's build a nodes referenced cluster, that is all nodes that should be point at each other
      var cluster = [];
      var targetCategory = null;
      arrayOfMaps.map(map => {
        map.nodes.map(node => {
          if (node._id == req.params.nodeID1 || node._id == req.params.nodeID2) {
            cluster.concat(node.referencedNodes);
          }
          if (node._id == req.params.nodeID2) {
            targetCategory = node.category;
          }
        });
      });
      cluster.push({nodeID: req.params.nodeID1, mapID: req.params.mapID1});
      cluster.push({nodeID: req.params.nodeID2, mapID: req.params.mapID2});

      var referencedMaps = [];
      cluster.map(item => {
        referencedMaps.push(item.mapID);
      });
      //so right now we have a list of all maps that fit into the cluster.
      // we load all of them, and then modify their nodes so the referenced nodes are correctly set up

      var allAffectedMapsQuery = WardleyMap.find({owner: getStormpathUserIdFromReq(req)}).where("_id"). in(referencedMaps);
      allAffectedMapsQuery.exec(function(err, allReferencedMapsArray) {
        if (err) {
          res.status(500).json(err);
          return;
        }
        allReferencedMapsArray.map(map => {
          map.nodes.map(node => {
            var nodeForProcessing = false;
            cluster.map(item => {
              if (item.nodeID == node._id) {
                nodeForProcessing = true;
              }
            });
            if (!nodeForProcessing) {
              return;
            }
            node.referencedNodes = [];
            node.categorized = true;
            node.category = targetCategory;
            cluster.map(referencedNode => {
              if (referencedNode.nodeID != node._id) {
                //TODO: check for existince of the reference node on the list
                node.referencedNodes.push(referencedNode);
              }
            });
          });
        });

        // and the tricky part - save all maps
        var limit = allReferencedMapsArray.length;
        var counter = 0;
        var errors = [];
        var results = [];
        allReferencedMapsArray.map(map => {
          map.save(function(err, result) {
            if (err) {
              errors.push(err);
              counter++;
            } else {
              results.push(result);
              counter++;
            }
            if (counter === limit) {
              if (errors.length !== 0) {
                res.status(500).json(errors);
              } else {
                res.json(results);
              }
            }
          });
        });
      });
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
          var deleteNode = mapResult.nodes[i];
          //1.  remove all the references
          Node.populate(
            deleteNode,
            {path:'inboundDependencies outboundDependencies', model: 'Node'},
            function(err,deleteNode){
              var nodesToSave = []; // all return references removed
              for(var k = 0; k < deleteNode.inboundDependencies.length; k++){
                removeFromArrayOfStringsBy_ID(deleteNode.inboundDependencies[k].outboundDependencies, deleteNode);
                nodesToSave.push(deleteNode.inboundDependencies[k]);
              }
              for(var l = 0; l < deleteNode.outboundDependencies.length; l++){
                removeFromArrayOfStringsBy_ID(deleteNode.outboundDependencies[l].inboundDependencies, deleteNode);
                nodesToSave.push(deleteNode.outboundDependencies[l]);
              }
              var multiSaveCallback = function(errors, savedItems){
                if(errors.length !== 0){
                  res.statusCode = 500;
                  res.send(errors);
                  return;
                }
                // and we can safely remove the main node
                deleteNode.remove(
                  function(errNodeRemove){ //jshint ignore:line
                    if(errNodeRemove){
                      res.statusCode = 500;
                      res.send(errNodeRemove);
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
              };
              // by now no other node is referencing this one
              multiSave(nodesToSave, multiSaveCallback);
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
        .find({_id:{$in:[nodeID1,nodeID2]}}) //two ids we are looking for
        .populate('parentMap')
        .exec(function(err, nodes){
          if(err){
            console.error(err);
            res.statusCode = 500;
            res.json(err);
            return;
          }
          if(!nodes && nodes.length !== 2){
            console.error('expect two nodes, but got ' + nodes);
            res.statusCode = 500;
            res.json('expect two nodes, but got ' + nodes);
            return;
          }
          if((nodes[0].parentMap.owner !== owner) || (nodes[1].parentMap.owner !== owner)){
            console.error('improper ownership');
            res.statusCode = 500;
            res.json('improper ownership');
            return;
          }
          var dependencySourceNode = nodeID1.equals(nodes[0]._id) ? nodes[0] : nodes[1];
          var dependencyTargetNode = nodeID2.equals(nodes[0]._id) ? nodes[0] : nodes[1];
          dependencySourceNode.outboundDependencies.push(dependencyTargetNode);
          dependencyTargetNode.inboundDependencies.push(dependencySourceNode);
          dependencySourceNode.save(function(errDSN, resultDSN){
            dependencyTargetNode.save(function(errDTN, resultDTN){
              if(errDSN || errDTN){
                console.error(errDSN, errDTN);
                res.statusCode = 500;
                res.json({e1:errDSN,e2:errDTN});
                return;
              }
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
        .find({_id:{$in:[nodeID1,nodeID2]}}) //two ids we are looking for
        .populate('parentMap inboundDependencies outboundDependencies')
        .exec(function(err, nodes){
          if(err){
            console.error(err);
            res.statusCode = 500;
            res.json(err);
            return;
          }
          if(!nodes && nodes.length !== 2){
            console.error('expect two nodes, but got ' + nodes);
            res.statusCode = 500;
            res.json('expect two nodes, but got ' + nodes);
            return;
          }
          if((nodes[0].parentMap.owner !== owner) || (nodes[1].parentMap.owner !== owner)){
            console.error('improper ownership');
            res.statusCode = 500;
            res.json('improper ownership');
            return;
          }
          var dependencySourceNode = nodeID1.equals(nodes[0]._id) ? nodes[0] : nodes[1];
          var dependencyTargetNode = nodeID2.equals(nodes[0]._id) ? nodes[0] : nodes[1];
          removeFromArrayBy_ID(dependencySourceNode.outboundDependencies,dependencyTargetNode);
          removeFromArrayBy_ID(dependencyTargetNode.inboundDependencies, dependencySourceNode);
          dependencySourceNode.save(function(errDSN, resultDSN){
            dependencyTargetNode.save(function(errDTN, resultDTN){
              if(errDSN || errDTN){
                console.error(errDSN, errDTN);
                res.statusCode = 500;
                res.json({e1:errDSN,e2:errDTN});
                return;
              }
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
  });

  return module;
};
