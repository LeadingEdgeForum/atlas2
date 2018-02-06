//#!/bin/env node
/* Copyright 2016,2018 Krzysztof Daniel.

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
var getUserIdFromReq = require('./../util/util').getUserIdFromReq;
var AccessError = require('./../util/util').AccessError;
var checkAccess = require('./../util/util').checkAccess;
var getId = require('./../util/util').getId;
var workspaceHistoryEntryToString = require('./model/changelogNameCalculator').workspaceHistoryEntryToString;

var q = require('q');
q.longStackSupport = true;

var _async = require('async');

var log4js = require('log4js');

var track = require('../tracker-helper');



module.exports = function(authGuardian, mongooseConnection) {
  var WardleyMap = require('./model/map-schema')(mongooseConnection);
  var Workspace = require('./model/workspace-schema')(mongooseConnection);
  var Node = require('./model/node-schema')(mongooseConnection);
  var History = require('./model/history-schema')(mongooseConnection);
  var Analysis = require('./model/analysis-schema')(mongooseConnection);

  var module = {};

  module.router = require('express').Router();

  module.setSocket = function(socket) {
    module.socket = socket;
    if(!socket){
      console.error('Socket.IO not initialised properly, server will not be able to notify clients about changes');
    }
  }.bind(module);

  module.emitSocketChange = function(type, id){
    if (!module.socket) {
      console.warn('socket for changes not set, change ', type, id, ' will not be emmited');
      return;
    }
    let _id = '' + id;
    let msg = {
      type: 'change',
      id: _id
    };
    module.socket.emit(type, msg);
  }.bind(module);

  module.emitWorkspaceChange = function(workspaceId) {
    module.emitSocketChange('workspace', workspaceId);
  }.bind(module);

  module.emitMapChange = function(mapId) {
    module.emitSocketChange('map', mapId);
  }.bind(module);


  var defaultErrorHandler = function(res, err){
      if(err){
        console.log(err);
          if(err instanceof AccessError){
            return res.status(err.status).send(err.message);
          }
          workspaceLogger.error(err);
          return res.status(500).send(err.message);
      }
      res.status(500).send("No more details available");
  };

  /*****************************************************************************
      Workspace API
  *****************************************************************************/


    module.router.get('/workspaces/', authGuardian.authenticationRequired, function(req, res) {
        Workspace.find({
            owner: getUserIdFromReq(req),
            status: 'EXISTING'
        })
        .populate({
          path: 'maps',
          match: {status:'EXISTING'}
        })
        .exec()
        .done(function(results){
          var responseObject = {
              workspaces: []
          };
          results.forEach(workspace => responseObject.workspaces.push({
              workspace: workspace
          }));
          res.json(responseObject);
        }, defaultErrorHandler.bind(this, res));
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
              //TODO: find a way to notify others about the new workspace that has been created. Other clients may need to fetch it.
          }, function(e){
              workspaceLogger.error(e);
              return res.status(500).send(e);
          });
    });

    module.router.get('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
        Workspace
            .findOne({
                owner: getUserIdFromReq(req),
                _id: req.params.workspaceID,
                status: 'EXISTING'
            })
            .populate({
              path: 'maps',
              match: {status:'EXISTING'}
            })
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

    module.router.get('/workspace/:workspaceID/history', authGuardian.authenticationRequired, function(req, res) {
        Workspace
            .findOne({
                owner: getUserIdFromReq(req),
                _id: req.params.workspaceID,
                status: 'EXISTING'
            })
            .exec()
            .then(function(workspace){
              return History.find({workspace : getId(req.params.workspaceID)}).sort('-date').limit(20).exec();
            })
            .then(function(searchResult){
              let result = [];
              for(let i = 0; i < searchResult.length; i++){
                result.push(workspaceHistoryEntryToString(searchResult[i]));
              }
              return result;
            })
            .done(function(result){
              res.json({history:result});
            }, defaultErrorHandler.bind(this, res));
    });


    module.router.put('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
      let user = getUserIdFromReq(req);
      Workspace.findOne({
        owner: user,
        _id: req.params.workspaceID,
        status: 'EXISTING'
      }).exec()
      .then(function(workspace){
        return workspace.update(user, req.body.name, req.body.description, req.body.purpose);
      })
      .then(function(workspace){
        return workspace.populate({
                  path: 'maps',
                  match: {status:'EXISTING'}
                }).execPopulate();
      })
      .done(function(updatedWorkspace){
        res.json({
          workspace: updatedWorkspace.toObject()
        });
      }, defaultErrorHandler.bind(this, res));
    });

    module.router.delete('/workspace/:workspaceID', authGuardian.authenticationRequired, function(req, res) {
      Workspace.findOne({
          owner: getUserIdFromReq(req),
          _id: req.params.workspaceID,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace) {
          return workspace.delete(getUserIdFromReq(req));
        })
        .done(function(result) {
          res.json({
            workspace: null
          });
          track(getUserIdFromReq(req), 'delete_workspace', {
            'id': req.params.workspaceID,
          });
        }, defaultErrorHandler.bind(this, res));
    });

  /*****************************************************************************
        Map API
  *****************************************************************************/

  module.router.get('/map/:mapID/name', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap
          .findOne({
              _id: req.params.mapID
          })
          .select('name')
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

  module.router.get('/map/:mapID', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      WardleyMap.findOne({
              _id: req.params.mapID
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
      .then(function(result) {
        return result.defaultPopulate();
      })
      .done(function(map) {
        let json = map.exportJSON();
        res.type('json').json(json);
        track(owner, 'export_map', {
          'id': map._id,
          'name': map.name
        });
      }, defaultErrorHandler.bind(this, res));
  });

  module.router.put('/workspace/:workspaceId/map/:mapId', authGuardian.authenticationRequired, function(req, res) {
    let owner = getUserIdFromReq(req);
    let workspaceId = getId(req.params.workspaceId);
    let mapId = getId(req.params.mapId);
    Workspace
      .findOne({
        owner: owner,
        _id: req.params.workspaceId,
        status: 'EXISTING'
      }).exec().then(function(irrelevantWorkspace) {
        if (!irrelevantWorkspace) {
          res.status(404).json('workspace not found');
          return;
        }
        return WardleyMap
          .findOne({_id:mapId, workspace : workspaceId})
          .exec()
          .then(function(map) {
            return map.update(owner, req.body.map);
          })
          .then(function(result) {
            return result.defaultPopulate();
          })
          .done(function(json) {
            res.json({
              map: json
            });
          }, defaultErrorHandler.bind(this, res));
      });
  });

  module.router.delete('/workspace/:workspaceId/map/:mapId', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      let mapId = getId(req.params.mapId);
      Workspace
        .findOne({
          owner: owner,
          _id: req.params.workspaceId,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace) {
          return workspace.deleteAMap(mapId, owner);
        }).done(function(workspace) {
          res.json({
            workspace: workspace
          });
          track(owner, 'delete_map', {
            'id': req.params.mapID,
          });
        }, defaultErrorHandler.bind(this, res));
  });


    module.router.post('/workspace/:workspaceId/map', authGuardian.authenticationRequired, function(req, res) {
      let owner = getUserIdFromReq(req);
      let workspaceId = getId(req.params.workspaceId);
      Workspace
        .findOne({
          owner: owner,
          _id: req.params.workspaceId,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace) {
          return workspace.createAMap({
            actor : owner,
            name: req.body.name,
            responsiblePerson: req.body.responsiblePerson,
          });
        }).done(function(result) {
          res.json({
            map: result
          });
          track(owner, 'create_map', {
            'id': result._id,
            'name': req.body.name
          }, req.body);
        }, defaultErrorHandler.bind(this, res));
    });

    module.router.post('/map/json', authGuardian.authenticationRequired, function(req, res) {
      var editor = getUserIdFromReq(req);
      let incomingMap = req.body.map;
      if(!incomingMap.elements || !incomingMap.title){
        return res.status(400).send();
      }
      Workspace
          .findOne({
              _id: new ObjectId(req.body.workspaceID),
              owner: editor
          })
          .exec()
          .then(function(workspace){
            return workspace.importJSON(incomingMap);
          })
          .done(function(result) {
              res.json({
                  map: result
              });
              if(result){
                track(editor,'import_map',{
                  'id' : result._id,
                  'name' : req.body.name
                }, req.body);
              }
          }, defaultErrorHandler.bind(this, res));
    });


      module.router.put('/workspace/:workspaceId/editor/:email', authGuardian.authenticationRequired, function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceId = req.params.workspaceId;
          var email = req.params.email;


          Workspace
              .findOne({
                  owner: getUserIdFromReq(req),
                  _id: workspaceId,
                  status: 'EXISTING'
              }).then(function(workspace){
                return workspace.addEditor(owner, email);
              }).then(function(workspace){
                return workspace.populate({
                          path: 'maps',
                          match: {status:'EXISTING'}
                        }).execPopulate();
              }).done(function(workspace){
                res.json({
                    workspace: workspace
                });
                var helper = require('../sendgrid-helper');
                helper.sendInvitation({
                    owner: owner,
                    editor: email,
                    workspaceID: workspaceId,
                    name: workspace.name,
                    purpose: workspace.purpose,
                    description: workspace.description
                });
                track(owner,'share_workspace',{
                  'editor' : email,
                  'workspace_id' : workspaceId
                });
              }, defaultErrorHandler.bind(this, res));
      });


      module.router.delete('/workspace/:workspaceID/editor/:email', authGuardian.authenticationRequired, function(req, res) {
        var owner = getUserIdFromReq(req);
        var workspaceId = getId(req.params.workspaceID);
        var email = req.params.email;


        Workspace
            .findOne({
                owner: getUserIdFromReq(req),
                _id: workspaceId,
                status: 'EXISTING'
            }).then(function(workspace){
              return workspace.removeEditor(owner, email);
            }).then(function(workspace){
              return workspace.populate({
                        path: 'maps',
                        match: {status:'EXISTING'}
                      }).execPopulate();
            }).done(function(workspace){
              res.json({
                  workspace: workspace
              });
              track(owner,'unshare_workspace',{
                'editor' : email,
                'workspace_id' : workspaceId
              });
            }, defaultErrorHandler.bind(this, res));
    });


  /*****************************************************************************
        Other API
  *****************************************************************************/

  module.router.get('/map/:mapID/node/:nodeID/name', authGuardian.authenticationRequired, function(req, res) {
      var owner = getUserIdFromReq(req);
      let nodeID = getId(req.params.nodeID);
      WardleyMap
          .findOne({
              _id: req.params.mapID
          })
          .select('name')
          .exec()
          .then(checkAccess.bind(this,req.params.mapID,owner))
          .then(function(){
            return Node.findById(nodeID).exec();
          })
          .done(function(result) {
            res.json({
              node: {
                _id: result._id,
                name: result.name
              }
            });
          }, defaultErrorHandler.bind(this, res));
  });

  /*
  * This method is used by the new node dialog and edit node dialog.
  * It fetches submaps that can be then attached to a node.
  */
  module.router.get('/workspace/:workspaceId/map/:mapId/submaps', authGuardian.authenticationRequired, function(req, res) {
      let owner = getUserIdFromReq(req);
      let workspaceId = req.params.workspceId;
      let currentMapId = req.params.mapId;

      Workspace
        .findOne({
          owner: owner,
          _id: workspaceId,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace){
          return workspace.getAvailableSubmaps(currentMapId);
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
    res.json([]);
    // WardleyMap.findOne({
    //         _id: req.params.submapID,
    //         archived: false
    //     })
    //     .exec()
    //     .then(checkAccess.bind(this, req.params.mapID, owner))
    //     .then(function(result) {
    //         return result.getSubmapUsage();
    //     })
    //     .done(function(listOfMaps) {
    //         res.json(listOfMaps);
    //     }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/workspace/:workspaceID/submapImpact', authGuardian.authenticationRequired, function(req, res) {
      let listOfNodesToSubmap = req.query.nodes ? req.query.nodes : [];

      let owner = getUserIdFromReq(req);

      Workspace
        .findOne({
          owner: owner,
          _id: req.params.workspaceID,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace){
          return workspace.assessSubmapImpact(listOfNodesToSubmap);
        }).done(function(impact) {
            res.json({
                impact: impact
            });
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceID/submap', authGuardian.authenticationRequired, function(req, res) {
      let listOfNodesToSubmap = req.body.nodes ? req.body.nodes : [];
      let name = req.body.name;
      let responsiblePerson = req.body.responsiblePerson;
      let mapId = req.body.mapId;
      let workspaceId = req.params.workspaceID;

      let owner = getUserIdFromReq(req);

      Workspace
        .findOne({
          owner: owner,
          _id: workspaceId,
          status: 'EXISTING'
        }).exec()
        .then(function(workspace){
          return workspace.formASubmap(mapId, name, responsiblePerson, listOfNodesToSubmap);
        }).done(function(result) {
            res.json({});
            track(owner,'submap_formed',{
              'id' : req.params.mapID,
            }, {
              'components' : listOfNodesToSubmap.length,
            });
            module.emitWorkspaceChange(workspaceId);
            for(let i = 0; i < result.length; i++){
            	module.emitMapChange(result[i]);
            }
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceID/map/:mapID/node', authGuardian.authenticationRequired, function(req, res) {
      var actor = getUserIdFromReq(req);
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
      var parentMap = getId(mapID);

      WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
              _id: mapID,
              workspace: workspaceID
          }).exec()
          .then(checkAccess.bind(this, req.params.mapID, actor))
          .then(function(map) {
              return map.addNode(actor, name, /* evolution */ x, /*visibility*/y, type, getId(workspaceID), description, inertia, responsiblePerson, constraint);
          })
          .then(function(map){
              return map.defaultPopulate();
          })
          .done(function(map) {
              res.json({
                  map: map
              });
              track(actor,'create_node',{
                'map_id' : req.params.mapID,
              }, req.body);
          }, defaultErrorHandler.bind(this, res));
  });


  module.router.post('/workspace/:workspaceID/map/:mapID/node/:nodeID/reference', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
    var workspaceId = getId(req.params.workspaceID);
    var mapId = getId(req.params.mapID);
    var nodeId = getId(req.params.nodeID);
    let y = req.body.y;

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
        _id: mapId,
        workspace: workspaceId
      }).exec()
      .then(checkAccess.bind(this, req.params.mapID, actor))
      .then(function(map) {
        return map.referenceNode(actor, nodeId, /*visibility*/ y, null);
      })
      .done(function(map) {
        res.json({
          map: map
        });
        track(actor, 'reference_node', {
          'map_id': req.params.mapID,
          'node_id': nodeId,
        }, req.body);
      }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceID/map/:mapID/node/:nodeID/duplicate', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
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
    var parentMap = getId(mapID);
    let duplicatedNode = getId(req.params.nodeID);

    WardleyMap.findOne({ //this is check that the person logged in can actually write to workspace
            _id: mapID,
            workspace: workspaceID
        }).exec()
        .then(checkAccess.bind(this, req.params.mapID, actor))
        .then(function(map) {
            return map.duplicateNode(actor, duplicatedNode, name, /* evolution */ x, /*visibility*/y, type, getId(workspaceID), description, inertia, responsiblePerson, constraint);
        })
        .then(function(map){
            return map.defaultPopulate();
        })
        .done(function(map) {
            res.json({
                map: map
            });
            track(actor,'duplicate_node',{
              'map_id' : req.params.mapID,
            }, req.body);
        }, defaultErrorHandler.bind(this, res));
  });

  module.router.get('/workspace/:workspaceID/warnings', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var analysisID = req.params.analysisID;

    Workspace.findOne({
      _id : workspaceID,
      owner : actor
    }).exec()
    .then(function(workspace){
      return workspace.getWarnings();
    })
    .done(function(warnings){
        res.json({
          warnings : warnings
        });
    }, defaultErrorHandler.bind(this, res));
  });


  module.router.get('/workspace/:workspaceID/analysis/:analysisID', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
    var workspaceID = req.params.workspaceID;
    var analysisID = req.params.analysisID;

    Workspace.findOne({
      _id : workspaceID,
      owner : actor
    }).exec()
    .then(function(workspace){
      return Analysis.findOne({
        _id : analysisID,
        workspace : getId(workspace)
      }).populate('nodes').exec();
    })
    .done(function(analysis){
        res.json({
          analysis : analysis
        });
    }, defaultErrorHandler.bind(this, res));
  });

  module.router.post('/workspace/:workspaceId/map/:mapId/submap/:submapId/reference', authGuardian.authenticationRequired, function(req, res) {
    var owner = getUserIdFromReq(req);
    var workspaceId = getId(req.params.workspaceId);
    var mapId = getId(req.params.mapId);
    var submapId = getId(req.params.submapId);
    let y = req.body.y;
    let evolution = req.body.x;

    Workspace.findOne({
        owner: getUserIdFromReq(req),
        _id: req.params.workspaceId
      }).exec()
      .then(function(workspace) {
        //TODO: calculate evolution
        return workspace.referenceASubmapReference(mapId, submapId, evolution, /*visibility*/ y);
      })
      .then(function(map) {
        return WardleyMap.findById(mapId);
      })
      .then(function(map) {
        return map.defaultPopulate();
      })
      .done(function(map) {
        res.json({
          map: map
        });
        track(owner, 'reference_submap', {
          'map_id': req.params.mapID,
          'submap_id': submapId,
        }, req.body);
      }, defaultErrorHandler.bind(this, res));

    });

  // module.router.post('/workspace/:workspaceID/map/:mapID/comment', authGuardian.authenticationRequired, function(req, res) {
  //     var owner = getUserIdFromReq(req);
  //     var workspaceID = req.params.workspaceID;
  //     var mapID = req.params.mapID;
  //     var x = req.body.x;
  //     var y = req.body.y;
  //     var text = req.body.text;
  //
  //     WardleyMap.findOne({
  //             _id: mapID,
  //             archived: false,
  //             workspace: workspaceID
  //         }).exec()
  //         .then(checkAccess.bind(this, req.params.mapID, owner))
  //         .then(function(map) {
  //             return map.makeComment({
  //                 x: x,
  //                 y: y,
  //                 text: text
  //             });
  //         })
  //         .then(function(map) {
  //             return map.defaultPopulate();
  //         })
  //         .done(function(jsonResult) {
  //             res.json({
  //                 map: jsonResult
  //             });
  //             track(owner,'create_comment',{
  //               'map_id' : req.params.mapID,
  //             }, req.body);
  //         }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.put('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
  //     var owner = getUserIdFromReq(req);
  //     var workspaceID = req.params.workspaceID;
  //     var mapID = req.params.mapID;
  //     var x = req.body.x;
  //     var y = req.body.y;
  //     var width = req.body.width;
  //     var text = req.body.text;
  //     var commentID = req.params.commentID;
  //
  //     WardleyMap.findOne({
  //             _id: mapID,
  //             archived: false,
  //             workspace: workspaceID
  //         }).exec()
  //         .then(checkAccess.bind(this, req.params.mapID, owner))
  //         .then(function(map) {
  //             return map.updateComment(commentID, {
  //                 x: x,
  //                 y: y,
  //                 text: text,
  //                 width : width
  //             });
  //         })
  //         .then(function(map) {
  //             return map.defaultPopulate();
  //         })
  //         .done(function(jsonResult) {
  //             res.json({
  //                 map: jsonResult
  //             });
  //         }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.delete('/workspace/:workspaceID/map/:mapID/comment/:commentID', authGuardian.authenticationRequired, function(req, res) {
  //   var owner = getUserIdFromReq(req);
  //   var workspaceID = req.params.workspaceID;
  //   var mapID = req.params.mapID;
  //   var commentID = req.params.commentID;
  //
  //   WardleyMap.findOne({
  //           _id: mapID,
  //           archived: false,
  //           workspace: workspaceID
  //       }).exec()
  //       .then(checkAccess.bind(this, req.params.mapID, owner))
  //       .then(function(map) {
  //           return map.deleteComment(commentID);
  //       })
  //       .then(function(map) {
  //           return map.defaultPopulate();
  //       })
  //       .done(function(jsonResult) {
  //           res.json({
  //               map: jsonResult
  //           });
  //       }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.delete('/workspace/:workspaceID/map/:mapID/user/:userID/dep/:nodeID', authGuardian.authenticationRequired, function(req, res) {
  //   var owner = getUserIdFromReq(req);
  //   var workspaceID = req.params.workspaceID;
  //   var mapID = req.params.mapID;
  //   var userID = req.params.userID;
  //   var nodeID = req.params.nodeID;
  //
  //   WardleyMap.findOne({
  //           _id: mapID,
  //           archived: false,
  //           workspace: workspaceID
  //       }).exec()
  //       .then(checkAccess.bind(this, req.params.mapID, owner))
  //       .then(function(map) {
  //           return map.deleteUserDepTo(userID, nodeID);
  //       })
  //       .then(function(map) {
  //           return map.defaultPopulate();
  //       })
  //       .done(function(jsonResult) {
  //           res.json({
  //               map: jsonResult
  //           });
  //       }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.post('/workspace/:workspaceID/map/:mapID/user/:userID/dep/:nodeID', authGuardian.authenticationRequired, function(req, res) {
  //   var owner = getUserIdFromReq(req);
  //   var workspaceID = req.params.workspaceID;
  //   var mapID = req.params.mapID;
  //   var userID = req.params.userID;
  //   var nodeID = req.params.nodeID;
  //
  //   WardleyMap.findOne({
  //           _id: mapID,
  //           archived: false,
  //           workspace: workspaceID
  //       }).exec()
  //       .then(checkAccess.bind(this, req.params.mapID, owner))
  //       .then(function(map) {
  //           return map.makeUserDepTo(userID, nodeID);
  //       })
  //       .then(function(map) {
  //           return map.defaultPopulate();
  //       })
  //       .done(function(jsonResult) {
  //           res.json({
  //               map: jsonResult
  //           });
  //       }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.post('/workspace/:workspaceID/map/:mapID/user', authGuardian.authenticationRequired, function(req, res) {
  //     var owner = getUserIdFromReq(req);
  //     var workspaceID = req.params.workspaceID;
  //     var mapID = req.params.mapID;
  //     var x = req.body.x;
  //     var y = req.body.y;
  //     var name = req.body.name;
  //     var description = req.body.description;
  //
  //     WardleyMap.findOne({
  //             _id: mapID,
  //             archived: false,
  //             workspace: workspaceID
  //         }).exec()
  //         .then(checkAccess.bind(this, req.params.mapID, owner))
  //         .then(function(map) {
  //             return map.addUser({
  //                 x: x,
  //                 y: y,
  //                 name: name,
  //                 description: description
  //             });
  //         })
  //         .then(function(map) {
  //             return map.defaultPopulate();
  //         })
  //         .done(function(jsonResult) {
  //             res.json({
  //                 map: jsonResult
  //             });
  //             track(owner,'create_user',{
  //               'map_id' : req.params.mapID,
  //             }, req.body);
  //         }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.put('/workspace/:workspaceID/map/:mapID/user/:userID', authGuardian.authenticationRequired, function(req, res) {
  //     var owner = getUserIdFromReq(req);
  //     var workspaceID = req.params.workspaceID;
  //     var mapID = req.params.mapID;
  //     var x = req.body.x;
  //     var y = req.body.y;
  //     var width = req.body.width;
  //     var name = req.body.name;
  //     var description = req.body.description;
  //     var userID = req.params.userID;
  //
  //     WardleyMap.findOne({
  //             _id: mapID,
  //             archived: false,
  //             workspace: workspaceID
  //         }).exec()
  //         .then(checkAccess.bind(this, req.params.mapID, owner))
  //         .then(function(map) {
  //             return map.updateUser(userID, {
  //                 x: x,
  //                 y: y,
  //                 name: name,
  //                 description: description,
  //                 width : width
  //             });
  //         })
  //         .then(function(map) {
  //             return map.defaultPopulate();
  //         })
  //         .done(function(jsonResult) {
  //             res.json({
  //                 map: jsonResult
  //             });
  //         }, defaultErrorHandler.bind(this, res));
  // });

  // module.router.delete('/workspace/:workspaceID/map/:mapID/user/:userID', authGuardian.authenticationRequired, function(req, res) {
  //   var owner = getUserIdFromReq(req);
  //   var workspaceID = req.params.workspaceID;
  //   var mapID = req.params.mapID;
  //   var userID = req.params.userID;
  //
  //   WardleyMap.findOne({
  //           _id: mapID,
  //           archived: false,
  //           workspace: workspaceID
  //       }).exec()
  //       .then(checkAccess.bind(this, req.params.mapID, owner))
  //       .then(function(map) {
  //           return map.deleteUser(userID);
  //       })
  //       .then(function(map) {
  //           return map.defaultPopulate();
  //       })
  //       .done(function(jsonResult) {
  //           res.json({
  //               map: jsonResult
  //           });
  //       }, defaultErrorHandler.bind(this, res));
  // });

  module.router.put('/workspace/:workspaceID/map/:mapID/node/:nodeID', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
    var workspaceId = getId(req.params.workspaceID);
    var mapId = getId(req.params.mapID);
    var name = req.body.name;
    var x = req.body.x;
    var y = req.body.y;
    var width = req.body.width;
    var type = req.body.type;
    var desiredNodeId = getId(req.params.nodeID);
    var description = req.body.description;
    var inertia = req.body.inertia;
    var constraint = req.body.constraint;
    var responsiblePerson = req.body.responsiblePerson;

    Workspace.findOne({ //confirm we have access to everything what is important
      _id: workspaceId,
      owner: actor
    }).exec().then(function(workspace) {
      if (!workspace) {
        res.status(404).json('workspace not found');
        return;
      }
      return WardleyMap
        .findOne({_id: mapId, workspace : workspaceId})
        .exec()
        .then(function(map) {
          return map.changeNode(actor,workspaceId, name, x, y, width, type, desiredNodeId, description, inertia, responsiblePerson, constraint);
        })
        .done(function(jsonResult) {
          res.json({
            map: jsonResult
          });
        }, defaultErrorHandler.bind(this, res));
    });
  });

  module.router.delete('/workspace/:workspaceId/map/:mapId/node/:nodeId', authGuardian.authenticationRequired, function(req, res) {
    var actor = getUserIdFromReq(req);
    var workspaceId = getId(req.params.workspaceId);
    var mapId = getId(req.params.mapId);
    var desiredNodeId = getId(req.params.nodeId);

    Workspace.findOne({ //confirm we have access to everything what is important
      _id: workspaceId,
      owner: actor
    }).exec().then(function(workspace) {
      if (!workspace) {
        res.status(404).json('workspace not found');
        return;
      }
      return WardleyMap
        .findOne({_id: mapId, workspace : workspaceId})
        .exec()
        .then(function(map) {
          return map.removeNode(actor, desiredNodeId);
        })
        .done(function(jsonResult) {
          res.json({
            map: jsonResult
          });
        }, defaultErrorHandler.bind(this, res));
    });
  });

  module.router.post(
      '/workspace/:workspaceID/map/:mapID/node/:nodeID1/dependency/:nodeID2',
      authGuardian.authenticationRequired,
      function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceID = req.params.workspaceID;
          var mapID = getId(req.params.mapID);
          var nodeID1 = getId(req.params.nodeID1);
          var nodeID2 = getId(req.params.nodeID2);
          var parentMap = getId(mapID);

          Workspace.findOne({
            _id : workspaceID,
            owner: owner
          }).exec().then(function(workspace){
              if(!workspace){
                res.status(404).json('workspace not found');
                return;
              }
              return Node
                  .findById(nodeID1)
                  .exec().then(function(node) {
                      return node.makeDependencyTo(mapID, nodeID2);
                  }).then(function(){
                      return WardleyMap.findById(mapID).exec().then(function(map){
                        return map.defaultPopulate();
                      });
                  });
          }).done(function(jsonResult) {
          res.json({
            map: jsonResult
          });
        }, defaultErrorHandler.bind(this, res));

      });

  module.router.put(
    '/workspace/:workspaceID/map/:mapID/node/:nodeID1/dependency/:nodeID2',
    authGuardian.authenticationRequired,
    function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = getId(req.params.workspaceID);
      var mapID = getId(req.params.mapID);
      var nodeID1 = getId(req.params.nodeID1);
      var nodeID2 = getId(req.params.nodeID2);
      var parentMap = getId(mapID);
      var connectionType = req.body.connectionType; // none, constraint, flow
      var label = req.body.label;
      var description = req.body.description;

      Workspace.findOne({
        _id: workspaceID,
        owner: owner
      }).exec().then(function(workspace) {
        if (!workspace) {
          res.status(404).json('workspace not found');
          return;
        }
        return Node
          .findById(nodeID1)
          .exec().then(function(node) {
            return node.updateDependencyTo(nodeID2, {
              connectionType: connectionType,
              label: label,
              description: description
            });
          }).then(function() {
            return WardleyMap.findById(mapID).exec().then(function(map) {
              return map.defaultPopulate();
            });
          });
      }).done(function(jsonResult) {
        res.json({
          map: jsonResult
        });
      }, defaultErrorHandler.bind(this, res));
    });

  module.router.delete(
    '/workspace/:workspaceID/map/:mapID/node/:nodeID1/dependency/:nodeID2',
    authGuardian.authenticationRequired,
    function(req, res) {
      var owner = getUserIdFromReq(req);
      var workspaceID = getId(req.params.workspaceID);
      var mapID = getId(req.params.mapID);
      var nodeID1 = getId(req.params.nodeID1);
      var nodeID2 = getId(req.params.nodeID2);
      var parentMap = getId(mapID);

      Workspace.findOne({
        _id: workspaceID,
        owner: owner
      }).exec().then(function(workspace) {
        if (!workspace) {
          res.status(404).json('workspace not found');
          return;
        }
        return Node
          .findById(nodeID1)
          .exec().then(function(node) {
            return node.removeDependencyTo(mapID, nodeID2, false);
          }).then(function() {
            return WardleyMap.findById(mapID).exec().then(function(map) {
              return map.defaultPopulate();
            });
          });
      }).done(function(jsonResult) {
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
        '/workspace/:workspaceId/map/:mapId/node/:nodeId/submap/',
        authGuardian.authenticationRequired,
        function(req, res) {
          var owner = getUserIdFromReq(req);
          var workspaceId = getId(req.params.workspaceId);
          var mapId = getId(req.params.mapId);
          var nodeId = getId(req.params.nodeId);
          Workspace.findOne({
              _id: workspaceId,
              owner: owner
            }).exec()
            .then(function(workspace) {
              if(!workspace){
                //TODO: better ending
                return;
              }
              // 0. find a node
              return Node.findById(nodeId).exec().then(function(node){
                // 1. create a submap
                return workspace.createAMap({
                  name: node.name,
                  responsiblePerson : node.responsiblePerson
                }, true).then(function(map){
                    // 2. update the node
                    node.type = "SUBMAP";
                    node.submapID = getId(map);
                    return node.save();
                });
              });
            })
            .then(function() {
              return WardleyMap.findById(mapId);
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
            '/workspace/:workspaceID/map/:mapId/suggestions/:text',
            authGuardian.authenticationRequired,
            function(req, res) {
              var owner = getUserIdFromReq(req);
              var workspaceID = req.params.workspaceID;
              var mapId = new ObjectId(req.params.mapId);
              var suggestionText = req.params.text;
              Workspace
                .findOne({
                  _id: workspaceID,
                  owner: owner,
                  status: 'EXISTING'
                })
                .exec()
                .then(function(workspace) {
                  if (!workspace) {
                    res.status(404).json("workspace not found");
                    return null;
                  }
                  return workspace.findSuggestions(mapId, suggestionText);
                })
                .done(function(suggestions) {
                  if(!suggestions.submaps){
                    suggestions.submaps = [];
                  }
                  if(!suggestions.nodes){
                    suggestions.nodes = [];
                  }
                  res.json({
                    suggestions: suggestions
                  });
                }, function(e) {
                  capabilityLogger.error('responding...', e);
                  res.status(500).json(e);
                });
            });

  return module;
};
