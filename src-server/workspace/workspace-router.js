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
var workspaceLogger = require('./../log').getLogger('workspace');
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

  // TODO: make this client side one day
  module.router.get('/map/:mapID/name', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap
          .findOne({
              _id: req.params.mapID,
              archived: false
          })
          .select('user purpose name workspace responsiblePerson')
          .exec()
          .then(function(map){
            return map.verifyAccess(owner);
          })
          .fail(function(e) {
              defaultAccessDenied(res, e);
          })
          .done(function(result) {
              if (result.user && result.purpose) {
                  res.json({
                      map: {
                          _id: result._id,
                          name: 'As ' + result.user + ', I want to ' + result.purpose + '.'
                      }
                  });
              } else {
                  res.json({
                      map: {
                          _id: result._id,
                          name: result.name + '.'
                      }
                  });
              }
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
      Workspace
        .initWorkspace(req.body.name, req.body.description, req.body.purpose, owner)
        .fail(function(e){
            workspaceLogger.error(e);
            return res.status(500);
        })
        .done(function(workspace){
            res.json(workspace);
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
          .exec()
          .then(function(result) {
              return result.verifyAccess(getUserIdFromReq(req));
          })
          .then(function(result){
            return result.formJSON();
          })
          .fail(function(e) {
              defaultAccessDenied(res, e);
          })
          .done(function(map) {
              res.json({
                  map: map
              });
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

    var newNodeX = req.body.coords.x;
    var newNodeY = req.body.coords.y;

    var parentMapPromise = WardleyMap.findOne({
        _id: req.params.mapID,
        archived: false
    }).exec().then(function(map) {
        return map.verifyAccess(owner);
    });

    var submapPromise = WardleyMap.findOne({
        _id: req.params.submapID,
        archived: false
    }).exec().then(function(map) {
        return map.verifyAccess(owner);
    });

    q.allSettled([parentMapPromise, submapPromise])
        .then(function(results) {
            var parentMap = results[0].value;
            var submap = results[1].value;
            return new Node({
                    name: submap.name,
                    workspace: parentMap.workspace,
                    parentMap: parentMap,
                    type: 'SUBMAP',
                    x: newNodeX,
                    y: newNodeY,
                    submapID: submap._id,
                    responsiblePerson: submap.responsiblePerson
                })
                .save()
                .then(function(savedNode) {
                    parentMap.nodes.push(savedNode);
                    return parentMap.save();
                });
        })
        .then(function(map) {
            return map.populate("nodes").execPopulate();
        })
        .fail(function(e) {
            return defaultAccessDenied(res, e);
        })
        .done(function(savedMap) {
            res.json({
                map: savedMap
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
        submapName: submapName,
        coords: coords,
        owner: owner,
        listOfNodesToSubmap: listOfNodesToSubmap,
        listOfCommentsToSubmap: listOfCommentsToSubmap
    });

    WardleyMap.findOne({
          _id: req.params.mapID,
          archived: false})
      .populate('nodes workspace')
      .exec()
      .then(function(map){
        return map.verifyAccess(owner);
      })
      .then(function(map){
        //create structures
        var submapID = new ObjectId();
        var submap = new WardleyMap({
          _id : submapID,
          name      : submapName,
          isSubmap  : true,
          workspace : map.workspace,
          archived  : false,
          responsiblePerson : responsiblePerson
        });

        var submapNodeID = new ObjectId();
        var submapNode = new Node({
            _id: submapNodeID,
            name: submapName,
            workspace: map.workspace,
            parentMap: map,
            type: 'SUBMAP',
            submapID: submapID
        });

        map.workspace.maps.push(submap);
        map.nodes.push(submapNode);

        // move comments
        for (var ii = map.comments.length - 1; ii > -1; ii--) {
            var toBeTransfered = false;
            for (var jj = 0; jj < listOfCommentsToSubmap.length; jj++) {
                if (listOfCommentsToSubmap[jj] === '' + map.comments[ii]._id) {
                    toBeTransfered = true;
                }
            }
            if (toBeTransfered) {
                var commentToTransfer = map.comments.splice(ii, 1)[0];
                submap.comments.push(commentToTransfer);
            }
        }


        // move nodes and fix connections
        var nodesToSave = [];
        var transferredNodes = [];

        for(var i = map.nodes.length -1; i>= 0; i--){
          var index = listOfNodesToSubmap.indexOf(''+map.nodes[i]._id);
          if(index === -1){ // node not on the list to transfer
            var notTransferredNode = map.nodes[i];
            // if a node from the parent map depends on a node just transfered to the submap
            // it is necessary to replace that dependency
            for(var j = notTransferredNode.outboundDependencies.length - 1; j >= 0; j--){
              if(listOfNodesToSubmap.indexOf(''+ notTransferredNode.outboundDependencies[j]) > -1){
                notTransferredNode.outboundDependencies.set(j,submapNode);
                submapLogger.trace('fixing outboundDependencies for nonTransfer');
                nodesToSave.push(notTransferredNode);
              }
            }

            // if a transferred node depends on non-transfered
            // make the submap node depend on non-transfered
            for(var jjj = notTransferredNode.inboundDependencies.length - 1; jjj >= 0; jjj--){
              if(listOfNodesToSubmap.indexOf(''+ notTransferredNode.inboundDependencies[jjj]) > -1){
                notTransferredNode.inboundDependencies.set(jjj,submapNode);
                submapLogger.trace('fixing inboundDependencies for nonTransfer');
                nodesToSave.push(notTransferredNode);
              }
            }
          } else {

            var transferredNode = map.nodes.splice(i, 1)[0];
            transferredNode.parentMap = submap;  // transfer the node
            submap.nodes.push(transferredNode);
            transferredNodes.push(transferredNode);
            submapLogger.trace('transfering' ,transferredNode._id);

            // if a transfered node depends on a non-transferred node
            for(var k = transferredNode.outboundDependencies.length - 1; k >= 0; k--){
              if(listOfNodesToSubmap.indexOf(''+ transferredNode.outboundDependencies[k]) === -1){
                var dependencyAlreadyEstablished = false;
                submapNode.outboundDependencies.push(transferredNode.outboundDependencies[k]); // the submap node will replace the transfered node
                transferredNode.outboundDependencies.splice(k,1); // and the node will loose that connection
                submapLogger.trace('fixing outboundDependencies for transfer');
              }
            }

            // if a transfered node is required by non-transfered node
            for(var kk = transferredNode.inboundDependencies.length - 1; kk >= 0; kk--){
              if(listOfNodesToSubmap.indexOf(''+ transferredNode.inboundDependencies[kk]) === -1){
                submapNode.inboundDependencies.push(transferredNode.inboundDependencies[kk]);
                transferredNode.inboundDependencies.splice(kk,1);
                submapLogger.trace('fixing inboundDependencies for transfer');
              }
            }
          }
        }

        // calculate position of the submap node
        submapNode.x = coords ? coords.x : calculateMean(transferredNodes, 'x');
        submapNode.y = coords ? coords.y : calculateMean(transferredNodes, 'y');
        submapLogger.trace('coords calculated', submapNode.x, submapNode.y);

        removeDuplicatesDependencies(nodesToSave);

        var totalNodesToSave = nodesToSave.concat(transferredNodes);
        var promises = [];
        for(var z = 0; z < totalNodesToSave.length;z++){
          promises.push(totalNodesToSave[z].save());
        }
        promises.push(submapNode.save());
        promises.push(submap.save());
        promises.push(map.workspace.save());
        promises.push(map.save());
        return q.allSettled(promises);
      })
      .then(function(results){
        // last element in the array is map
        return results[results.length-1].value.formJSON();
      })
      .fail(function(e){
        return defaultAccessDenied(res,e);
      }).done(function(json){
        res.json({map:json});
      });
  });

  module.router.put('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
          _id: req.params.mapID,
          archived: false
      }).exec()
      .then(function(map){
        return map.verifyAccess(owner);
      })
      .then(function(map){
        return map.newBody(req.body.map);
      })
      .then(function(map){
        return map.formJSON();
      })
      .fail(function(e){
        return defaultAccessDenied(res,e);
      })
      .done(function(json) {
          res.json({
              map: json
          });
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
          .exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              map.workspace.maps.pull(map._id);
              var workspacePromise = map.workspace.save();

              map.archived = true;
              var mapPromise = map.save();

              return q.all([workspacePromise, mapPromise]);
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function() {
              res.json({
                  map: null
              });
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
      Workspace
          .findOne({
              _id: new ObjectId(req.body.workspaceID),
              owner: editor
          })
          .exec()
          .then(function(workspace) {
              if (!workspace) {
                  throw new Error("Workspace not found");
              }
              return workspace.createMap(editor, req.body.user, req.body.purpose, req.body.responsiblePerson);
          })
          .fail(function(e) {
              defaultAccessDenied.bind(res, e);
          })
          .done(function(result) {
              res.json({
                  map: result
              });
          });
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
          }).exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              return map.addNode(name, x, y, type, new ObjectId(workspaceID), description, inertia, responsiblePerson);
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function(map) {
              res.json({
                  map: map.toObject()
              });
          });
  });

  module.router.put('/workspace/:workspaceID/editor/:email', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var email = req.params.email;

      Workspace.findOne({
              owner: getUserIdFromReq(req),
              _id: req.params.workspaceID,
              archived: false
          }).exec()
          .then(function(workspace) {
              workspace.owner.push(email);
              return workspace.save();
          })
          .fail(function(e){
            return defaultAccessDenied(res, e);
          })
          .done(function(workspace) {
              res.json({
                  workspace: workspace
              });

              var helper = require('../sendgrid-helper');
              helper.sendInvitation({
                  owner: owner,
                  editor: email,
                  workspaceID: workspaceID,
                  name: workspace.name,
                  purpose: workspace.purpose,
                  description: workspace.description
              });
          });
  });


  module.router.delete('/workspace/:workspaceID/editor/:email', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var email = req.params.email;

    if (owner === email) {
        res.status(500).json({
            message: 'Cannot delete self'
        });
        return;
    }

    Workspace.findOne({
            owner: getUserIdFromReq(req),
            _id: req.params.workspaceID,
            archived: false
        }).exec()
        .then(function(workspace) {
            workspace.owner.pop(email);
            return workspace.save();
        })
        .fail(function(e) {
            return defaultAccessDenied(res, e);
        })
        .done(function(workspace) {
            res.json({
                workspace: workspace
            });
        });
});

  module.router.post('/workspace/:workspaceID/map/:mapID/comment', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var x = req.body.x;
      var y = req.body.y;
      var text = req.body.text;

      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              return map.makeComment({
                  x: x,
                  y: y,
                  text: text
              });
          })
          .then(function(map) {
              return map.formJSON();
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
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

      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              return map.updateComment(commentID, {
                  x: x,
                  y: y,
                  text: text
              });
          })
          .then(function(map) {
              return map.formJSON();
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          });
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var commentID = req.params.commentID;

    WardleyMap.findOne({
            _id: mapID,
            archived: false,
            workspace: workspaceID
        }).exec()
        .then(function(map) {
            return map.verifyAccess(owner);
        })
        .then(function(map) {
            return map.deleteComment(commentID);
        })
        .then(function(map) {
            return map.formJSON();
        })
        .fail(function(e) {
            return defaultAccessDenied(res, e);
        })
        .done(function(jsonResult) {
            res.json({
                map: jsonResult
            });
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
          .exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              return map.changeNode(name, x, y, type, desiredNodeId, description, inertia, responsiblePerson);
          })
          .then(function(result) {
              return result[1].value.formJSON();
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          });
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/node/:nodeID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var parentMap = new ObjectId(mapID);
      var desiredNodeId = new ObjectId(req.params.nodeID);


      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID,
              nodes: desiredNodeId
          })
          .exec()
          .then(function(map) {
              return map.verifyAccess(owner);
          })
          .then(function(map) {
              return map.removeNode(desiredNodeId);
          })
          .then(function(result) {
              return result[1].value.formJSON();
          })
          .fail(function(e) {
              return defaultAccessDenied(res, e);
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
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

          WardleyMap.findOne({
                  _id: mapID,
                  archived: false,
                  workspace: workspaceID,
                  nodes: nodeID1 // maybe, one day, check the second node, too
              })
              .exec()
              .then(function(map) {
                  return map.verifyAccess(owner);
              })
              .then(function(map) {
                  return q.allSettled([Node
                      .findById(nodeID1) //two ids we are looking for
                      .exec().then(function(node) {
                          return node.makeDependencyTo(nodeID2);
                      }), map.populate('nodes').execPopulate()
                  ]);
              })
              .then(function(result) {
                  return result[1].value.formJSON();
              })
              .fail(function(e) {
                  return defaultAccessDenied(res, e);
              })
              .done(function(jsonResult) {
                  res.json({
                      map: jsonResult
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

          WardleyMap.findOne({
                  _id: mapID,
                  archived: false,
                  workspace: workspaceID,
                  nodes: nodeID1 // maybe, one day, check the second node, too
              })
              .exec()
              .then(function(map) {
                  return map.verifyAccess(owner);
              })
              .then(function(map) {
                  return q.allSettled([Node
                      .findById(nodeID1) //two ids we are looking for
                      .exec().then(function(node) {
                          return node.removeDependencyTo(nodeID2);
                      }), map.populate('nodes').execPopulate()
                  ]);
              })
              .then(function(result) {
                  return result[1].value.formJSON();
              })
              .fail(function(e) {
                  return defaultAccessDenied(res, e);
              })
              .done(function(jsonResult) {
                  res.json({
                      map: jsonResult
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

              WardleyMap.findOne({
                      _id: mapID,
                      archived: false,
                      workspace: workspaceID,
                      nodes: nodeID1
                  })
                  .exec()
                  .then(function(map) {
                      return map.verifyAccess(owner);
                  })
                  .then(function(map) {
                      return q.allSettled([Node
                          .findById(nodeID1)
                          .exec().then(function(node) {
                              return node.makeAction(actionPos);
                          }), map.populate('nodes').execPopulate()
                      ]);
                  })
                  .then(function(result) {
                      return result[1].value.formJSON();
                  })
                  .fail(function(e) {
                      return defaultAccessDenied(res, e);
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
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

              WardleyMap.findOne({
                      _id: mapID,
                      archived: false,
                      workspace: workspaceID,
                      nodes: nodeID1
                  })
                  .exec()
                  .then(function(map) {
                      return map.verifyAccess(owner);
                  })
                  .then(function(map) {
                      return q.allSettled([Node
                          .findById(nodeID1)
                          .exec().then(function(node) {
                              return node.updateAction(seq, actionBody);
                          }), map.populate('nodes').execPopulate()
                      ]);
                  })
                  .then(function(result) {
                      return result[1].value.formJSON();
                  })
                  .fail(function(e) {
                      return defaultAccessDenied(res, e);
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
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

              WardleyMap.findOne({
                      _id: mapID,
                      archived: false,
                      workspace: workspaceID,
                      nodes: nodeID1
                  })
                  .exec()
                  .then(function(map) {
                      return map.verifyAccess(owner);
                  })
                  .then(function(map) {
                      return q.allSettled([Node
                          .findById(nodeID1)
                          .exec().then(function(node) {
                              return node.deleteAction(seq);
                          }), map.populate('nodes').execPopulate()
                      ]);
                  })
                  .then(function(result) {
                      return result[1].value.formJSON();
                  })
                  .fail(function(e) {
                      return defaultAccessDenied(res, e);
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
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
