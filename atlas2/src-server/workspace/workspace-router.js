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
var _ = require('underscore');
var logger = require('./../log');

var getStormpathUserIdFromReq = function(req) {
  if (req && req.user && req.user.href) {
    var href = req.user.href;
    return href.substr(href.lastIndexOf('/') + 1);
  }
  //should never happen as indicates lack of authentication
  console.error('user.href not present');
  return null;
};

module.exports = function(stormpath) {
  var module = {};

  module.router = require('express').Router();

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
    var wkspc = new Workspace({
      name: name,
      description: description,
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
    console.log({owner: getStormpathUserIdFromReq(req), id: req.params.workspaceID});
    Workspace.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.workspaceID, archived: false}).populate('maps').exec(function(err, result) {
      res.json({workspace: result});
    });
  });

  module.router.get('/map/:mapID', stormpath.authenticationRequired, function(req, res) {
    console.log({owner: getStormpathUserIdFromReq(req), id: req.params.mapID});
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, result) {
      console.log(err);
      res.json({map: result});
    });
  });

  module.router.put('/map/:mapID', stormpath.authenticationRequired, function(req, res) {
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, result) {
      // console.log('map found', err, result, req.body.map);
      //check that we actually own the map, and if yes
      if (result) {
        _.extend(result, req.body.map);
        _.extend(result.nodes, req.body.map.nodes);
        _.extend(result.connections, req.body.map.connections);
        _.extend(result.archived, false);
        result.save(function(err2, result2) {
          console.log(err2, result2);
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
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, mainAffectedMap) {
      // console.log('map found', err, result, req.body.map);
      //check that we actually own the map, and if yes
      if (mainAffectedMap) {
        var mainAffectedNode = null;
        for (var i = 0; i < mainAffectedMap.nodes.length; i++) {
          var _node = mainAffectedMap.nodes[i];
          // this compare is intentional as _node.id is object and nodeID is string from URL
          if (_node.id == req.params.nodeID) { //jshint ignore:line
            _node.categorized = false;
            _node.category = null;
            mainAffectedNode = _node;
            break;
          }
        }
        var referencedNodes = [mainAffectedNode._id];
        for (var j = 0; j < mainAffectedNode.referencedNodes.length; j++) {
          referencedNodes.push(mainAffectedNode.referencedNodes[j].nodeID);
        }
        var query = WardleyMap.find().where('nodes._id'). in(referencedNodes);
        WardleyMap.update(query, {
          '$set': {
            'nodes.$.referencedNodes': [],
            'nodes.$.categorized': false,
            'nodes.$.category': null
          }
        }).exec(function(err2, doc) {
          if (err2) {
            res.status(500);
            return;
          }
          res.json(doc);
        });
      }
    });
  });

  // assign node to existing capability
  module.router.put('/workspace/:workspaceID/capabilityCategory/:capabilityCategoryID/capability/:capabilityID', stormpath.authenticationRequired, function(req, res) {
    assignComponentToCapability(res, req.body.mapID, req.body.nodeID, req.params.capabilityID);
  });

  // create new capability and assign node to it
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
        result.save(function(err2, result2) {
          if (err2) {
            res.status(500).json(err2);
          }
          res.json({map: result2});
        });
      }
    });
  });

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

  module.router.post('/map/', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var name = req.body.name;
    if (!name) {
      name = "Anonymous map";
    }
    var description = req.body.description;
    if (!description) {
      description = "I am too lazy to fill this field even when I know it causes organizational mess";
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
      var wm = new WardleyMap({name: name, description: description, owner: owner, workspace: result._id, archived: false});
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

  return module;
};
