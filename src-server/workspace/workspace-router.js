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
var accessLogger = require('./../log').getLogger('access');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var q = require('q');
q.longStackSupport = true;

var _async = require('async');

var log4js = require('log4js');

var track = require('../tracker-helper');

var getUserIdFromReq = function(req) {
  if (req && req.user && req.user.email) {
    accessLogger.trace('user identified ' + req.user.email);
    return req.user.email;
  }
  //should never happen as indicates lack of authentication
  return null;
};

function AccessError(status, message){
  this.status = status;
  this.message = message;
}
AccessError.prototype = Object.create(Error.prototype);
AccessError.prototype.constructor = AccessError;

var checkAccess = function(id, user, map) {
  if (!user) {
    accessLogger.error('user.email not present');
    throw new AccessError(401, 'user.email not present');
  }
  if (!map) {
    accessLogger.warn('map ' + id + ' does not exist');
    throw new AccessError(404, 'map ' + id + ' does not exist');
  }
  return map.verifyAccess(user).then(function(verifiedMap) {
    if (!verifiedMap) {
      accessLogger.warn(user + ' has no access to map ' + id + '.');
      throw new AccessError(403, user + ' has no access to map ' + id + '.');
    }
    return verifiedMap;
  });
};

module.exports = function(authGuardian, mongooseConnection) {
  var WardleyMap = require('./model/map-schema')(mongooseConnection);
  var Workspace = require('./model/workspace-schema')(mongooseConnection);
  var Node = require('./model/node-schema')(mongooseConnection);


  var module = {};

  module.router = require('express').Router();

  var defaultErrorHandler = function(res, err){
      if(err){
          if(err instanceof AccessError){
            return res.status(err.status).send(err.message);
          }
          workspaceLogger.error(err);
          return res.status(500).send(err.message);
      }
      res.status(500).send("No more details available");
  };

  module.router.get('/map/:mapID/name', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap
          .findOne({
              _id: req.params.mapID,
              archived: false
          })
          .select('name isSubmap workspace responsiblePerson')
          .exec()
          .then(checkAccess.bind(this,req.params.mapID,owner))
          .done(function(result) {
            res.json({
              map: {
                _id: result._id,
                name: result.name
              }
            });
          }, defaultErrorHandler.bind(this, res));
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
        .done(function(workspace){
            res.json(workspace);
            track(owner,'create_workspace',{
              'id' : workspace._id
            }, req.body);
        }, function(e){
            workspaceLogger.error(e);
            return res.status(500).send(e);
        });
  });

  module.router.post('/workspace/:workspaceID/variant/:sourceTimeSlice', authGuardian.authenticationRequired, function(req, res) {
    if(req.params.sourceTimeSlice === 'null'){
      req.params.sourceTimeSlice = null;
    }
    let owner = getUserIdFromReq(req);
    Workspace
      .findOne({
        owner: owner,
        _id: req.params.workspaceID,
        archived: false
      }).exec()
      .then(function(workspace){
        return workspace.cloneTimeslice(req.params.sourceTimeSlice || workspace.nowId, req.body.name, req.body.description);
      })
      .then(function(workspace) {
        return workspace.populate('timeline timeline.maps timeline.capabilityCategories').execPopulate();
      })
      .then(function(workspace, err) {
        if (err) {
          return res.send(500);
        }
        res.json({
          workspace: workspace.toObject()
        });
        track(owner,'clone_timeslice',{
          'id' : req.params.workspaceID,
        }, {
          'name' : req.body.name,
          'description' : req.body.description,
        });
      });
  });

  module.router.put('/workspace/:workspaceID/variant/:sourceTimeSlice', authGuardian.authenticationRequired, function(req, res) {
    if(req.params.sourceTimeSlice === 'null'){
      req.params.sourceTimeSlice = null;
    }
    let owner = getUserIdFromReq(req);
    Workspace
      .findOne({
        owner: getUserIdFromReq(req),
        _id: req.params.workspaceID,
        archived: false
      }).exec()
      .then(function(workspace){
        return workspace.modifyTimeslice(req.params.sourceTimeSlice || workspace.nowId, req.body.name, req.body.description, req.body.current);
      })
      .then(function(workspace) {
        return workspace.populate('timeline timeline.maps timeline.capabilityCategories').execPopulate();
      })
      .then(function(workspace, err) {
        if (err) {
          return res.send(500);
        }
        res.json({
          workspace: workspace.toObject()
        });
        track(owner,'modify_timeslice',{
          'id' : req.params.workspaceID,
        }, {
          'name' : req.body.name,
          'description' : req.body.description,
          'current' : req.body.current,
        });
      });
  });

  module.router.get('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
      Workspace
          .findOne({
              owner: getUserIdFromReq(req),
              _id: req.params.workspaceID,
              archived: false
          })
          .populate('timeline timeline.maps timeline.capabilityCategories')
          .exec(function(err, result) {
              if (err) {
                  return res.send(500);
              }
              if(!result){
                return res.send(404);
              }
              res.json({
                  workspace: result.toObject()
              });
          });
  });

  module.router.get('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(result){
            return result.defaultPopulate();
          })
          .done(function(map) {
              res.json({
                  map: map
              });
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/map/:mapID/json', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(result){
            return result.defaultPopulate();
          })
          .done(function(map) {
              let newMap = {
                title : '',
                elements : [],
                links : []
              };
              newMap.title = map.name;

              // build look up table to avoid constant checking for id
              let idLookupTable = {};
              for(let i = 0; i < map.nodes.length; i ++){
                idLookupTable['' + map.nodes[i]._id] = map.nodes[i];
              }

              for(let i = 0; i < map.nodes.length; i ++){
                let node = map.nodes[i];
                //translate nodes
                newMap.elements.push({
                  id : node._id,
                  name : node.name,
                  visibility : 1 - node.y, //atlas uses screen based positioning
                  maturity : 1 - node.x
                });

                //translate links
                for(let j = 0; j < node.outboundDependencies.length; j++){
                  let targetId = node.outboundDependencies[j];
                  newMap.links.push({
                    start : node.name,
                    end: idLookupTable['' + targetId].name
                  });
                }
              }
              res.type('json').json(newMap);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/map/:mapID/diff', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(result){
            return result.calculateDiff();
          })
          .done(function(diffResult) {
              res.json(diffResult);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/map/:mapID/variants', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(result){
            return result.getRelevantVariants();
          })
          .done(function(diffResult) {
              res.json(diffResult);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/submaps/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(result) {
              return result.getAvailableSubmaps();
          })
          .then(function(listOfSubmaps) {
              var listOfAvailableSubmaps = [];
              for (var i = 0; i < listOfSubmaps.length; i++) {
                  listOfAvailableSubmaps.push({
                      _id: listOfSubmaps[i]._id,
                      name: listOfSubmaps[i].name
                  });
              }
              return listOfAvailableSubmaps;
          })
          .done(function(listOfAvailableSubmaps) {
              res.json({
                  listOfAvailableSubmaps: listOfAvailableSubmaps
              });
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/submap/:submapID/usage', authGuardian.authenticationRequired, function(req, res){
    var owner = getUserIdFromReq(req);

    WardleyMap.findOne({
            _id: req.params.submapID,
            archived: false
        })
        .exec()
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(result) {
            return result.getSubmapUsage();
        })
        .done(function(listOfMaps) {
            res.json(listOfMaps);
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/map/:mapID/submap/:submapID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);

    var newNodeX = req.body.coords.x;
    var newNodeY = req.body.coords.y;

    var parentMapPromise = WardleyMap.findOne({
        _id: req.params.mapID,
        archived: false
    }).exec().then(checkAccess.bind(this, req.params.mapID, owner));

    var submapPromise = WardleyMap.findOne({
        _id: req.params.submapID,
        archived: false
    }).exec().then(checkAccess.bind(this, req.params.submapID, owner));

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
            return map.defaultPopulate();
        })
        .done(function(savedMap) {
            res.json({
                map: savedMap
            });
        }, defaultErrorHandler.bind(this, res));
});

  module.router.put('/map/:mapID/submap', authGuardian.authenticationRequired, function(req, res) {
      var listOfNodesToSubmap = req.body.listOfNodesToSubmap ? req.body.listOfNodesToSubmap : [];
      var listOfCommentsToSubmap = req.body.listOfCommentsToSubmap ? req.body.listOfCommentsToSubmap : [];
      var submapName = req.body.name;
      var coords = req.body.coords;
      var responsiblePerson = req.body.responsiblePerson;

      var owner = getUserIdFromReq(req);

      var params = {
          submapName: submapName,
          coords: coords,
          owner: owner,
          listOfNodesToSubmap: listOfNodesToSubmap,
          listOfCommentsToSubmap: listOfCommentsToSubmap
      };

      submapLogger.trace(params);

      WardleyMap.findOne({
              _id: req.params.mapID,
              archived: false
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.formASubmap(params);
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .done(function(json) {
              res.json({
                  map: json
              });
              track(owner,'submap_formed',{
                'id' : req.params.mapID,
              }, {
                'components' : listOfNodesToSubmap.length,
              });
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
          _id: req.params.mapID,
          archived: false
      }).exec()
      .then(checkAccess.bind(this, req.params.mapID, owner))
      .then(function(map){
        return map.newBody(req.body.map);
      })
      .then(function(map){
        return map.defaultPopulate();
      })
      .done(function(json) {
          res.json({
              map: json
          });
      }, defaultErrorHandler.bind(this, res));
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
          Workspace.populate(result2, {
              path: 'timeline timeline.maps timeline.capabilityCategories'
          }, function(err, result3) {
              if (err) {
                  return res.send(500);
              }
              res.json({
                  workspace: result3.toObject()
              });
          });
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
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              map.workspace.getTimeSlice(map.timesliceId).maps.pull(map._id);
              var workspacePromise = map.workspace.save()
              .then(function(workspace){
                  return workspace.populate('timeline timeline.maps timeline.capabilityCategories').execPopulate();
              });

              map.archived = true;
              var mapPromise = map.save();

              return q.all([workspacePromise, mapPromise]);
          })
          .done(function(args) {
              res.json({
                  workspace: args[0]
              });
              track(owner,'delete_map',{
                'id' : req.params.mapID,
              });
          }, defaultErrorHandler.bind(this, res));
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
          track(getUserIdFromReq(req),'delete_workspace',{
            'id' : req.params.workspaceID,
          });
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
              return workspace.createAMap({
                name : req.body.name,
                responsiblePerson : req.body.responsiblePerson,
              });
          })
          .done(function(result) {
              res.json({
                  map: result
              });
              track(editor,'create_map',{
                'id' : result._id,
                'name' : req.body.name
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/variant/:timesliceId/map', authGuardian.authenticationRequired, function(req, res) {
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
              return workspace.createAMap({
                name : req.body.name,
                responsiblePerson : req.body.responsiblePerson,
              }, req.params.timesliceId);
          })
          .done(function(result) {
              res.json({
                  map: result
              });
              track(editor,'create_map',{
                'id' : result._id,
                'name' : req.body.name
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
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
      var constraint = req.body.constraint;
      var parentMap = new ObjectId(mapID);

      WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.addNode(name, x, y, type, new ObjectId(workspaceID), description, inertia, responsiblePerson, constraint);
          })
          .then(function(map){
              return map.defaultPopulate();
          })
          .done(function(map) {
              res.json({
                  map: map
              });
              track(owner,'create_node',{
                'map_id' : req.params.mapID,
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
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
          .then(function(workspace){
            return workspace.populate('timeline timeline.maps timeline.capabilityCategories').execPopulate();
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
              track(owner,'share_workspace',{
                'editor' : email,
                'workspace_id' : workspaceID
              });
          }, defaultErrorHandler.bind(this, res));
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
            workspace.owner.pull(email);
            return workspace.save();
        })
        .then(function(workspace){
          return workspace.populate('timeline timeline.maps timeline.capabilityCategories').execPopulate();
        })
        .done(function(workspace) {
            res.json({
                workspace: workspace
            });
        }, defaultErrorHandler.bind(this, res));
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
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.makeComment({
                  x: x,
                  y: y,
                  text: text
              });
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
              track(owner,'create_comment',{
                'map_id' : req.params.mapID,
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var x = req.body.x;
      var y = req.body.y;
      var width = req.body.width;
      var text = req.body.text;
      var commentID = req.params.commentID;

      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.updateComment(commentID, {
                  x: x,
                  y: y,
                  text: text,
                  width : width
              });
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          }, defaultErrorHandler.bind(this, res));
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
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(map) {
            return map.deleteComment(commentID);
        })
        .then(function(map) {
            return map.defaultPopulate();
        })
        .done(function(jsonResult) {
            res.json({
                map: jsonResult
            });
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/user/:userID/dep/:nodeID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var userID = req.params.userID;
    var nodeID = req.params.nodeID;

    WardleyMap.findOne({
            _id: mapID,
            archived: false,
            workspace: workspaceID
        }).exec()
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(map) {
            return map.deleteUserDepTo(userID, nodeID);
        })
        .then(function(map) {
            return map.defaultPopulate();
        })
        .done(function(jsonResult) {
            res.json({
                map: jsonResult
            });
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceID/map/:mapID/user/:userID/dep/:nodeID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var userID = req.params.userID;
    var nodeID = req.params.nodeID;

    WardleyMap.findOne({
            _id: mapID,
            archived: false,
            workspace: workspaceID
        }).exec()
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(map) {
            return map.makeUserDepTo(userID, nodeID);
        })
        .then(function(map) {
            return map.defaultPopulate();
        })
        .done(function(jsonResult) {
            res.json({
                map: jsonResult
            });
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceID/map/:mapID/user', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var x = req.body.x;
      var y = req.body.y;
      var name = req.body.name;
      var description = req.body.description;

      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.addUser({
                  x: x,
                  y: y,
                  name: name,
                  description: description
              });
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
              track(owner,'create_user',{
                'map_id' : req.params.mapID,
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/user/:userID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var x = req.body.x;
      var y = req.body.y;
      var width = req.body.width;
      var name = req.body.name;
      var description = req.body.description;
      var userID = req.params.userID;

      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID
          }).exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.updateUser(userID, {
                  x: x,
                  y: y,
                  name: name,
                  description: description,
                  width : width
              });
          })
          .then(function(map) {
              return map.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          }, defaultErrorHandler.bind(this, res));
  });

  module.router.delete('/workspace/:workspaceID/map/:mapID/user/:userID', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var mapID = req.params.mapID;
    var userID = req.params.userID;

    WardleyMap.findOne({
            _id: mapID,
            archived: false,
            workspace: workspaceID
        }).exec()
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(map) {
            return map.deleteUser(userID);
        })
        .then(function(map) {
            return map.defaultPopulate();
        })
        .done(function(jsonResult) {
            res.json({
                map: jsonResult
            });
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/workspace/:workspaceID/map/:mapID/node/:nodeID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var name = req.body.name;
      var x = req.body.x;
      var y = req.body.y;
      var width = req.body.width;
      var type = req.body.type;
      var desiredNodeId = new ObjectId(req.params.nodeID);
      var description = req.body.description;
      var inertia = req.body.inertia;
      var constraint = req.body.constraint;
      var responsiblePerson = req.body.responsiblePerson;

      // find a map with a node
      WardleyMap.findOne({
              _id: mapID,
              archived: false,
              workspace: workspaceID,
              nodes: desiredNodeId
          })
          .exec()
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.changeNode(name, x, y, width, type, desiredNodeId, description, inertia, responsiblePerson, constraint);
          })
          .then(function(result) {
              return result.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          }, defaultErrorHandler.bind(this, res));
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
          .then(checkAccess.bind(this, req.params.mapID, owner))
          .then(function(map) {
              return map.removeNode(desiredNodeId);
          })
          .then(function(result) {
              return result.defaultPopulate();
          })
          .done(function(jsonResult) {
              res.json({
                  map: jsonResult
              });
          }, defaultErrorHandler.bind(this, res));
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
              .then(checkAccess.bind(this, req.params.mapID, owner))
              .then(function(map) {
                return Node
                    .findById(nodeID1) //two ids we are looking for
                    .exec().then(function(node) {
                        return node.makeDependencyTo(nodeID2);
                    }).then(function(){
                        return map.defaultPopulate();
                    });
              })
              .done(function(jsonResult) {
                  res.json({
                      map: jsonResult
                  });
              }, defaultErrorHandler.bind(this, res));
      });

  module.router.put(
    '/workspace/:workspaceID/map/:mapID/node/:nodeID1/outgoingDependency/:nodeID2',
    authGuardian.authenticationRequired,
    function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var mapID = req.params.mapID;
      var nodeID1 = new ObjectId(req.params.nodeID1);
      var nodeID2 = new ObjectId(req.params.nodeID2);
      var parentMap = new ObjectId(mapID);
      var type = req.body.type; // none, constraint, flow
      var label = req.body.label;
      var description = req.body.description;

      WardleyMap.findOne({
          _id: mapID,
          archived: false,
          workspace: workspaceID,
          nodes: nodeID1 // maybe, one day, check the second node, too
        })
        .exec()
        .then(checkAccess.bind(this, req.params.mapID, owner))
        .then(function(map) {
          return Node
            .findById(nodeID1) //two ids we are looking for
            .exec().then(function(node) {
              return node.updateDependencyTo(nodeID2, {type:type, label:label, description:description});
            }).then(function(tr){
                return map.defaultPopulate();
            });
        })
        .done(function(jsonResult) {
          res.json({
            map: jsonResult
          });
        }, defaultErrorHandler.bind(this, res));
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
              .then(checkAccess.bind(this, req.params.mapID, owner))
              .then(function(map) {
                  return Node
                    .findById(nodeID1) //two ids we are looking for
                    .exec().then(function(node) {
                      return node.removeDependencyTo(nodeID2);
                    }).then(function(tr){
                        return map.defaultPopulate();
                    });
              })
              .done(function(jsonResult) {
                  res.json({
                      map: jsonResult
                  });
              }, defaultErrorHandler.bind(this, res));
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
                  .then(checkAccess.bind(this, req.params.mapID, owner))
                  .then(function(map) {
                      return Node
                        .findById(nodeID1)
                        .exec().then(function(node) {
                            return node.makeAction(actionPos);
                        }).then(function(){
                          return map.defaultPopulate();
                        });
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
                      });
                  }, defaultErrorHandler.bind(this, res));
          });

          module.router.put(
            '/workspace/:workspaceId/map/:mapId/node/:nodeId/submap/:refId',
            authGuardian.authenticationRequired,
            function(req, res) {
              var owner = getUserIdFromReq(req);
              var workspaceId = req.params.workspaceId;
              var mapId = req.params.mapId;
              var nodeId = new ObjectId(req.params.nodeId);
              var refId = new ObjectId(req.params.refId);

              WardleyMap.findOne({
                  _id: mapId,
                  archived: false,
                  workspace: workspaceId,
                  nodes: nodeId
                })
                .exec()
                .then(checkAccess.bind(this, req.params.mapID, owner))
                .then(function(map) {
                  return Node
                    .findById(nodeId)
                    .exec().then(function(node) {
                      return node.turnIntoSubmap(refId);
                    }).then(function(){
                      return map.defaultPopulate();
                    });
                })
                .done(function(jsonResult) {
                  res.json({
                    map: jsonResult
                  });
                }, defaultErrorHandler.bind(this, res));
            });

            module.router.put(
              '/workspace/:workspaceId/map/:mapId/node/:nodeId/submap/',
              authGuardian.authenticationRequired,
              function(req, res) {
                var owner = getUserIdFromReq(req);
                var workspaceId = new ObjectId(req.params.workspaceId);
                var mapId = new ObjectId(req.params.mapId);
                var nodeId = new ObjectId(req.params.nodeId);
                WardleyMap.findOne({
                    _id: mapId,
                    archived: false,
                    workspace: workspaceId,
                    nodes: nodeId
                  })
                  .exec()
                  .then(checkAccess.bind(this, req.params.mapID, owner))
                  .then(function(map) {
                    return Node
                      .findById(nodeId)
                      .exec().then(function(node) {
                        return node.turnIntoSubmap();
                      }).then(function(){
                        return map.defaultPopulate();
                      });
                  })
                  .done(function(jsonResult) {
                    res.json({
                      map: jsonResult
                    });
                  }, defaultErrorHandler.bind(this, res));
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
                  .then(checkAccess.bind(this, req.params.mapID, owner))
                  .then(function(map) {
                      return Node
                          .findById(nodeID1)
                          .exec().then(function(node) {
                              return node.updateAction(seq, actionBody);
                          }).then(function(){
                            return map.defaultPopulate();
                          });
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
                      });
                  }, defaultErrorHandler.bind(this, res));
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
                  .then(checkAccess.bind(this, req.params.mapID, owner))
                  .then(function(map) {
                      return Node
                          .findById(nodeID1)
                          .exec().then(function(node) {
                              return node.deleteAction(seq);
                          }).then(function(){
                            return map.defaultPopulate();
                          });
                  })
                  .done(function(jsonResult) {
                      res.json({
                          map: jsonResult
                      });
                  }, defaultErrorHandler.bind(this, res));
          });


  module.router.get(
      '/workspace/:workspaceID/components/:variantId/unprocessed',
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
              result.findUnprocessedNodes(req.params.variantId)
                  .done(function(maps) {
                      res.json({
                          maps: maps
                      });
                  }, function(e) {
                      return res.status(500).json(e);
                  });
          });
      });


  module.router.get(
      '/workspace/:workspaceID/components/:variantId/processed',
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
                  return workspace.findProcessedNodes(req.params.variantId);
              })
              .done(function(wk) {
                  res.json({
                      workspace: wk
                  });
              },
              function(e) {
                capabilityLogger.error('responding...', e);
                res.status(500).json(e);
              });
      });


  module.router.post(
      '/workspace/:workspaceID/variant/:variantId/capabilitycategory/:categoryID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
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
                  return workspace.createNewCapabilityAndAliasForNode(variantId, categoryID, nodeID);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
                  track(owner,'assign_node',{
                    'id' : nodeID
                  }, {
                    'variantId' : variantId,
                    'categoryID' : categoryID
                  });
              }, function(e) {
                  capabilityLogger.error('responding with error', e);
                  res.status(500).json(e);
              });
      });

      module.router.delete(
        '/workspace/:workspaceID/variant/:variantId/capabilitycategory/:categoryID',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
          var categoryID = new ObjectId(req.params.categoryID);
          capabilityLogger.trace(workspaceID, categoryID);
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
              return workspace.deleteCategory(variantId, categoryID);
            })
            .done(function(wk) {
              capabilityLogger.trace('responding ...', wk);
              res.json({
                workspace: wk
              });
            }, function(e) {
              capabilityLogger.error('responding with error', e);
              res.status(500).json(e);
            });
        });

      module.router.post(
        '/workspace/:workspaceID/variant/:variantId/capabilitycategory/',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
          var name = req.body.name;
          capabilityLogger.trace(workspaceID, name);
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
              return workspace.createCategory(variantId, name);
            })
            .done(function(wk) {
              capabilityLogger.trace('responding ...', wk);
              res.json({
                workspace: wk
              });
              track(owner,'create_category',{
                'variantId' : variantId,
                'workspaceID' : workspaceID
              }, {
                name:name
              });
            },function(e) {
              capabilityLogger.error('responding with error', e);
              res.status(500).json(e);
            });
        });

      module.router.put(
        '/workspace/:workspaceID/variant/:variantId/capabilitycategory/:categoryID',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
          var categoryID = new ObjectId(req.params.categoryID);
          var name = req.body.name;
          capabilityLogger.trace(workspaceID, categoryID, name);
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
              return workspace.editCategory(variantId, categoryID, name);
            })
            .done(function(wk) {
              capabilityLogger.trace('responding ...', wk);
              res.json({
                workspace: wk
              });
            }, function(e) {
              capabilityLogger.error('responding with error', e);
              res.status(500).json(e);
            });
        });

  module.router.put(
      '/workspace/:workspaceID/variant/:variantId/capability/:capabilityID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
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
                  return workspace.createNewAliasForNodeInACapability(variantId, capabilityID, nodeID);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
              }, function(e) {
                  capabilityLogger.error('responding...', e);
                  res.status(500).json(e);
              });
      });

      module.router.post(
        '/workspace/:workspaceID/variant/:variantId/capability/:capabilityID/marketreference/',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = new ObjectId(req.params.variantId);
          var capabilityID = new ObjectId(req.params.capabilityID);
          var name = req.body.name;
          var description = req.body.description;
          var evolution = req.body.evolution;
          capabilityLogger.trace(workspaceID, variantId, capabilityID, name, description, evolution);
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
              return workspace.createNewMarketReferenceInCapability(variantId, capabilityID, name, description, evolution);
            })
            .done(function(wk) {
              capabilityLogger.trace('responding ...', wk);
              res.json({
                workspace: wk
              });
              track(owner,'createmarketreference',{
                'variantId' : variantId,
                'capabilityID' : capabilityID
              }, {
                name:name,
                evolution:evolution
              });
            }, function(e) {
              capabilityLogger.error('responding...', e);
              res.status(500).json(e);
            });
        });

      module.router.delete(
        '/workspace/:workspaceID/variant/:variantId/capability/:capabilityID/marketreference/:marketReferenceId',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
          var capabilityID = new ObjectId(req.params.capabilityID);
          var marketReferenceId = new ObjectId(req.params.marketReferenceId);
          capabilityLogger.trace(workspaceID, capabilityID, marketReferenceId);
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
              return workspace.deleteMarketReferenceInCapability(variantId, capabilityID, marketReferenceId);
            })
            .done(function(wk) {
              capabilityLogger.trace('responding ...', wk);
              res.json({
                workspace: wk
              });
            }, function(e) {
              capabilityLogger.error('responding...', e);
              res.status(500).json(e);
            });
        });

        module.router.put(
          '/workspace/:workspaceID/variant/:variantId/capability/:capabilityID/marketreference/:marketReferenceId',
          authGuardian.authenticationRequired,
          function(req, res) {
            var owner = getUserIdFromReq(req);
            var workspaceID = req.params.workspaceID;
            let variantId = req.params.variantId;
            var capabilityID = new ObjectId(req.params.capabilityID);
            var marketReferenceId = new ObjectId(req.params.marketReferenceId);
            var name = req.body.name;
            var description = req.body.description;
            var evolution = req.body.evolution;
            capabilityLogger.trace(workspaceID, capabilityID, marketReferenceId, name, description, evolution);
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
                return workspace.updateMarketReferenceInCapability(variantId, capabilityID, marketReferenceId, name, description, evolution);
              })
              .done(function(wk) {
                capabilityLogger.trace('responding ...', wk);
                res.json({
                  workspace: wk
                });
              }, function(e) {
                capabilityLogger.error('responding...', e);
                res.status(500).json(e);
              });
          });

  module.router.put(
      '/workspace/:workspaceID/variant/:variantId/alias/:aliasID/node/:nodeID',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          let variantId = req.params.variantId;
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
                  return workspace.addNodeToAlias(variantId, aliasID, nodeID);
              })
              .done(function(wk) {
                  capabilityLogger.trace('responding ...', wk);
                  res.json({
                      workspace: wk
                  });
              }, function(e) {
                capabilityLogger.error('responding...', e);
                res.status(500).json(e);
              });
      });

  module.router.get(
    '/workspace/:workspaceID/variant/:variantId/node/:nodeID/usage',
    authGuardian.authenticationRequired,
    function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = req.params.workspaceID;
      var variantId = new ObjectId(req.params.variantId);
      var nodeID = new ObjectId(req.params.nodeID);
      Workspace
          .findOne({
              _id: workspaceID,
              owner: owner,
              archived: false
          }) // this is not the best security check as we do not check relation between workspace & cap & node
          .exec()
        .then(function(workspace){
          return workspace.getNodeUsageInfo(variantId, nodeID);
        })
        .done(function(capability){
            res.json({capability: capability});
        }, function(e) {
          capabilityLogger.error('responding...', e);
          res.status(500).json(e);
        });
  });


  module.router.delete(
    '/workspace/:workspaceID/variant/:variantId/capability/:capabilityID',
    authGuardian.authenticationRequired,
    function(req, res) {
        var owner = getUserIdFromReq(req);
        var workspaceID = req.params.workspaceID;
        let variantId = req.params.variantId;
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
                return workspace.removeCapability(variantId, capabilityID);
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
                        path: 'capabilityCategories.capabilities.aliases.nodes',
                        model: 'Node',
                    });
                return wkPromise;
            })
            .done(function(wk) {
                capabilityLogger.trace('responding ...');
                res.json({
                    workspace: wk
                });
            }, function(e) {
              capabilityLogger.error('responding...', e);
              res.status(500).json(e);
            });
    });

  return module;
};
