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

var createCounterPartNodeForCustomerJourney = function(currentMap, position, name, response){
  var result = currentMap; //actually rename would be nice
  var res = response;
  //create counterpart node in a map
  result.nodes.push({
    name:name,
    x:0.1 + 0.9/(result.journey.length + 1),
    y:0.1,
    type:'USERNEED',
    categorized:false,
    category:null,
    referencedNodes:[]});


    result.save(function(err2, result2){
      if (err2) {
        res.send(err2);
        return;
      }
      if(!result2){
        res.status = 500;
        res.end();
        return;
      }
        //otherwise set the reference and then return map
        result2.journey[position].implementingNode = result2.nodes[result2.nodes.length - 1];
        result2.save(function(err3,result3){
          if (err3) {
            res.send(err3);
            return;
          }
          if(!result3){
            res.status = 500;
            res.end();
            return;
          }
          res.json({map: result3});
        });
    });
}

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
      //TODO find also related journey steps
      var query = WardleyMap.find().or([
        {
          'nodes._id' : {$in:referencedNodes}
        }, {
          'journey.$.referencedNode._id ' : {$in:referencedNodes}
        }
      ]);

      query.exec(function(err2, affectedMapsArray) {
        if (err2) {
          callback(err2);
          return;
        }
        affectedMapsArray.map(map => {
          map.nodes.map(node => {
            referencedNodes.map(referencedNode => {
              if ("" + node._id == "" + referencedNode) {
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
}

var deleteNode = function(err, mainAffectedMap, nodeID,  callback) {

  //check that we actually own the map, and if yes
  if (err) {
    callback(err);
  }
  if(!mainAffectedMap){
    callback('map not found');
  }
  if(mainAffectedMap){
    // remove the component from journey if there is any
    for(var k = mainAffectedMap.journey.length - 1; k>=0; k--){
      if(mainAffectedMap.journey[k].implementingNode && (mainAffectedMap.journey[k].implementingNode._id + "" === "" + nodeID)){
        mainAffectedMap.journey.splice(k, 1);
      }
    }
    // remove the component from nodes
    for(var k = mainAffectedMap.nodes.length - 1; k>=0; k--){
      if(mainAffectedMap.nodes[k]._id + "" === "" + nodeID){
        mainAffectedMap.nodes.splice(k, 1);
      }
    }
    //and connections (if any)
    for(var k = mainAffectedMap.connections.length - 1; k>=0; k--){
      if((mainAffectedMap.connections[k].source + "" === "" + nodeID) || (mainAffectedMap.connections[k].target + "" === "" + nodeID)){
        mainAffectedMap.connections.splice(k, 1);
      }
    }
    mainAffectedMap.save(callback);
  }
};




module.exports = function(stormpath) {
  var module = {};

  module.router = require('express').Router();

  module.router.get('/map/:mapID/name', stormpath.authenticationRequired, function(req, res) {
    WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).select('user purpose').exec(function(err, result) {
      res.json({map: {_id : result._id, name:'As ' + result.user + ', I want to ' + result.purpose + '.'}});
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
        //TODO: before save ensure that all customer journey steps have proper names derived from corresponding nodes
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
      console.log('capability cleaned');
      WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, mainAffectedMap) {
        console.log('map reloaded', mainAffectedMap);
        deleteNode(err, mainAffectedMap, req.params.nodeID, function(err, result){
          console.log('node', result);
          if (err) {
            res.status(500).json(err);
          } else {
            res.json({map:result});
          }
          console.log('done');
        });
      })
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

  module.router.put('/map/:mapID/journeystep/:stepID', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var mapID = req.params.mapID;
    var stepID = req.params.stepID;
    var name = req.body.name;
    var interaction = req.body.interaction;
    WardleyMap.findOne({
      _id : mapID,
      owner: owner,
      archived : false
    }, function (err, result){
      if (err) {
        res.send(err);
        return;
      }
      if(!result){
        res.status = 404;
        res.end();
        return;
      }

      //we have a map, find a proper journey step and modify it
      for(var i =0; i < result.journey.length; i++){
        if(stepID === (result.journey[i]._id + "")){
          var getCurrentI = function(i){
            return i;
          }.bind(this, i);
          var oldInteraction = result.journey[i].interaction;
          result.journey[i].name = name;
          result.journey[i].interaction = interaction;

          // interactivity change can and should cause node removal
          if((oldInteraction === true || oldInteraction == 'true') && (interaction === false || interaction === 'false')){
            //true --> false - delete existing node (and connections)
            var _implementingNodeID = result.journey[i].implementingNode._id;
            cleanNodeCapability(true, owner, mapID, _implementingNodeID, function(err2, result2){
              if (err2) {
                res.send(err2);
                return;
              }
              if(!result2){
                res.status = 404;
                res.end();
                return;
              }

              for(var j = 0; j < result2.nodes.length; j++){
                if(''+_implementingNodeID === ''+result2.nodes[j]._id){
                  result2.nodes.splice(j,1);
                  for(var k = result2.connections.length - 1; k >=0 ; k--){
                    if(''+result2.connections[k].source == ''+_implementingNodeID || ''+result2.connections[k].target == ''+_implementingNodeID){
                      result2.connections.splice(k,1);
                    }
                  }
                }
              }

              result2.journey[getCurrentI()].implementingNode = null;
              result2.journey[getCurrentI()].name = name;
              result2.journey[getCurrentI()].interaction = interaction;
              result2.save(function(err3, result3){
                if (err3) {
                  res.send(err3);
                  return;
                }
                if(!result3){
                  res.status = 500;
                  res.end();
                  return;
                };
                res.json({map: result3});
              });
            });
          }

          if(''+oldInteraction === ''+interaction && ''+interaction === 'true'){
            // true --> true -> just update the name of referenced node
            var _implementingNodeID = result.journey[i].implementingNode._id;
            for(var j = 0; j < result.nodes.length; j++){
              if(''+_implementingNodeID === ''+result.nodes[j]._id){
                result.nodes[j].name = name;
              }
            }
            result.save(function(err2, result2){
              if (err2) {
                res.send(err2);
                return;
              }
              if(!result2){
                res.status = 500;
                res.end();
                return;
              };
              res.json({map: result2});
            });
          }

          //false -> false - just save
          if(''+oldInteraction === ''+interaction && ''+interaction === 'false'){
            result.save(function(err2, result2){
              if (err2) {
                res.send(err2);
                return;
              }
              if(!result2){
                res.status = 500;
                res.end();
                return;
              };
              res.json({map: result2});
            });
          }

          //false -> true - create missing node
          if((''+oldInteraction === 'false') && (''+interaction === 'true')){
            createCounterPartNodeForCustomerJourney(result, i, name, res);
          }
        }
      }
      });
  });

  module.router.delete('/map/:mapID/journeystep/:stepID', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var mapID = req.params.mapID;
    var stepID = req.params.stepID;
    WardleyMap.findOne({
      _id : mapID,
      owner: owner,
      archived : false
    }, function (err, result){
      if (err) {
        res.send(err);
        return;
      }
      if(!result){
        res.status = 404;
        res.end();
        return;
      }
      //we have a map, find a proper journey step and delete it
      var stepToDelete = null;
      for(var i =0; i < result.journey.length; i++){
        if(stepID === (result.journey[i]._id + "")){
          stepToDelete = result.journey.splice(i,1)[0]; //this operation is irrelevant if there is implementing node
        }
      }
      if(stepToDelete.implementingNode){
        console.log('implementing node found');
        var _implementingNodeID = stepToDelete.implementingNode._id;
        // clean here
        cleanNodeCapability(true, owner, mapID, _implementingNodeID, function(err3, result3){ //this removes category if present
          console.log('capabilities cleaned');
          WardleyMap.findOne({owner: getStormpathUserIdFromReq(req), _id: req.params.mapID, archived: false}).exec(function(err, mainAffectedMap) {
            console.log('map reloaded');
            deleteNode(err3, mainAffectedMap, _implementingNodeID, function(err2, result2){
              console.log('node deleted', result2);
              if (err2) {
                res.status(500).json(err);
              } else {
                //fully deleted, good to go
                res.json({map:result2});
              }
            });
          });
        });
      } else {
        // the node was removed
        result.save(function(err2, result2){
          if (err2) {
            res.send(err2);
            return;
          }
          if(!result2){
            res.status = 500;
            res.end();
            return;
          };
          res.json({map: result2});
        });
      }
    });
  });

  module.router.post('/map/:mapID/journeystep', stormpath.authenticationRequired, function(req, res) {
    var owner = getStormpathUserIdFromReq(req);
    var mapID = req.params.mapID;
    var step = req.body.step;
    var position = req.body.position;
    var interaction = (req.body.step.interaction === 'true') || (req.body.step.interaction === true);
    WardleyMap.findOne({
      _id : mapID,
      owner: owner,
      archived : false
    }, function (err, result){
      if (err) {
        res.send(err);
        return;
      }
      if(!result){
        res.status = 404;
        res.end();
        return;
      }
      result.journey.splice(position, 0, step);

      if(!interaction){
        result.save(function(err2, result2){
          if (err2) {
            res.send(err2);
            return;
          }
          if(!result2){
            res.status = 500;
            res.end();
            return;
          };
          res.json({map: result2});
        });
      } else {
        createCounterPartNodeForCustomerJourney(result, position, step.name, res);
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

  return module;
};
