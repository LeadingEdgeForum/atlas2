/* Copyright 2017  Krzysztof Daniel.
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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;

/**
 * Workspace, referred also as an organization, is a group of maps that all
 * refer to the same subject, for example to the company. Many people can work
 * on maps within a workspace, and they all have identical access rights.
 */
var workspace = {};


var defaultCapabilityCategories = [
  { name:'Portfolio', capabilities : []},
  { name:'Customer Service', capabilities : []},
  { name:'Administrative', capabilities : []},
  { name:'Quality', capabilities : []},
  { name:'Operational', capabilities : []},
  { name:'Sales and Marketing', capabilities : []},
  { name:'Research', capabilities : []},
  { name:'Finances', capabilities : []}
];

function migrator(doc, fn){
  if (!doc.schemaVersion) {
    doc.schemaVersion = 1;
    doc.timeline = [{
      name: 'Now',
      description: 'Happening right now',
      current : true,
      maps: doc._doc.maps,
      capabilityCategories : doc._doc.capabilityCategories
    }];
    delete doc._doc.maps;
    delete doc._doc.capabilityCategories;
  }
  fn();
}

module.exports = function(conn) {

    if (workspace[conn]) {
        return workspace[conn];
    }

    var workspaceSchema = new Schema({
        name : String,
        purpose : String,
        description : String,
        owner : [ {
            type : String
        } ],
        archived : Boolean,
        timeline : [ {
            name: String,
            description : String,
            current : Boolean,
            maps: [{
              type: Schema.Types.ObjectId,
              ref: 'WardleyMap'
            }],
            next : [{
              type: Schema.Types.ObjectId
            }],
            previous : {
              type: Schema.Types.ObjectId
            },
            capabilityCategories : [ {
              name : String,
              next : [{
                type: Schema.Types.ObjectId
              }],
              previous : {
                type: Schema.Types.ObjectId
              },
              capabilities : [ {
                aliases: [{
                  nodes: [{
                      type: Schema.Types.ObjectId,
                      ref: 'Node'
                  }],
                  next : [{
                    type: Schema.Types.ObjectId
                  }],
                  previous : {
                    type: Schema.Types.ObjectId
                  }
                }],
                marketreferences : [ {
                  name : String,
                  description : String,
                  evolution : Number,
                  next : [{
                    type: Schema.Types.ObjectId
                  }],
                  previous : {
                    type: Schema.Types.ObjectId
                  }
                }],
                next : [{
                  type: Schema.Types.ObjectId
                }],
                previous : {
                  type: Schema.Types.ObjectId
                }
              } ]
            } ]
          }
        ],
        schemaVersion : Number
    });

    // always update the schema to the latest possible version
    workspaceSchema.post('init', migrator);

    workspaceSchema.virtual('nowId').get(function(){
      for(var i = 0; i < this.timeline.length; i++){
        if(this.timeline[i].current){
          return this.timeline[i]._id;
        }
      }
    });

    workspaceSchema.statics.initWorkspace = function(name, description, purpose, owner) {
        if (!name) {
            name = "Unnamed";
        }
        if (!description) {
            description = "I am too lazy to fill this field even when I know it causes organizational mess";
        }
        if (!purpose) {
            purpose = "Just playing around.";
        }
        var Workspace = require('./workspace-schema')(conn);
        var wkspc = new Workspace({
            name: name,
            description: description,
            purpose: purpose,
            owner: [owner],
            archived: false,
            timeline : [{
              name : 'Now',
              description : 'Representation of current reality',
              current : true,
              maps : [],
              capabilityCategories : defaultCapabilityCategories
            }],
            schemaVersion : 1
        });
        return wkspc.save();
    };

    workspaceSchema.methods.insertMapIdAt = function(mapId, timesliceId) {
        var WardleyMap = require('./map-schema')(conn);
        var Workspace = require('./workspace-schema')(conn);
        if(!timesliceId){
          timesliceId = this.nowId;
        }
        for(var i = 0; i < this.timeline.length; i++){
          if(this.timeline[i]._id.equals(timesliceId)){
            this.timeline[i].maps.push(mapId);
            return this.save();
          }
        }
        throw new Error('Specified timeslice ' + timesliceId + ' is not present in workspace ' + this._id);
    };

    /*TODO:
     1. create a map
      a. if specified where - add it there and all future states
      b. if not specified where, add it to latest and all future states
     2. create a timeslice (part of the timeline)
      a. if specified parent timeslice, add it after
      b. copy all maps from the previous time splice
      c. ensure they are interconnected
     3. delete a map
      a. if there is just one timeslice, delete the map
      b. if there is more than one timeslice, delete the map from the last one
      c. if the map belongs to the past, do not delete it
     4. delete timeslice (should it be possible at all)?
    */
    workspaceSchema.methods.createAMap = function(params, timesliceId) {
      var WardleyMap = require('./map-schema')(conn);
      var Workspace = require('./workspace-schema')(conn);

      if (!params.user) {
        params.user = "your competitor";
      }
      if (!params.purpose) {
        params.purpose = "be busy with nothing";
      }
      var newId = new ObjectId();
      console.log('nn' + newId, newId.value, newId.oid);
      return this.insertMapIdAt(newId, timesliceId)
        .then(function(workspace) {
          return new WardleyMap({
            user: params.user,
            purpose: params.purpose,
            workspace: workspace._id,
            archived: false,
            timesliceId : timesliceId ? new ObjectId(timesliceId) : workspace.nowId,
            responsiblePerson: params.responsiblePerson,
            _id: newId
          }).save();
        });
    };

    workspaceSchema.methods.findUnprocessedNodes = function(timesliceId){
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);

      if(!timesliceId){
        timesliceId = this.nowId;
      }

      return WardleyMap
          .find({ // find all undeleted maps within workspace and timeslice
              archived: false,
              workspace: this._id,
              timesliceId : timesliceId
          })
          .select('user purpose name')
          .then(function(maps) {
              var loadPromises = [];
              maps.forEach(function(cv, i, a) {
                  loadPromises.push(Node
                      .find({
                          parentMap: cv,
                          processedForDuplication: false
                      })
                      .then(function(nodes) {
                          a[i].nodes = nodes;
                          return a[i];
                      }));
              });
              return q.all(loadPromises)
                  .then(function(results) {
                      var finalResults = [];
                      return results.filter(function(map) {
                          return map.nodes && map.nodes.length > 0;
                      });
                  });
          });
    };

    workspaceSchema.methods.getTimeSlice = function(timesliceId){
      if(!timesliceId){
        timesliceId = this.nowId;
      }
      for(var i = 0; i < this.timeline.length; i++){
        if(this.timeline[i]._id.equals(timesliceId)){
          return  this.timeline[i];
        }
      }
      return null;
    };

    workspaceSchema.methods.findProcessedNodes = function(timesliceId) {
        var _this = this;

        var timeSlice = this.getTimeSlice(timesliceId);

        //this is a temporary mechanism that should be removed when the database is properly migrated
        if (!timeSlice.capabilityCategories[0].name) { // rough check, no name -> needs migration
            var Node = require('./node-schema')(conn);
            return Node.update({
                workspace: _this.id
            }, {
                processedForDuplication: true
            }, {
                safe: true
            }).exec().then(function() {
                timeSlice.capabilityCategories = defaultCapabilityCategories;
                return _this.save();
            });
        } else {
            return this
                .populate({
                    path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                    model: 'Node',
                }).execPopulate();
        }
    };

    workspaceSchema.methods.createNewCapabilityAndAliasForNode = function(timesliceId, categoryID, nodeID) {
        var Node = require('./node-schema')(conn);

        var promises = [];
        var capabilityCategory = null;
        var timeSlice = this.getTimeSlice(timesliceId);

        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            if (categoryID.equals(timeSlice.capabilityCategories[i]._id)) {
                capabilityCategory = timeSlice.capabilityCategories[i];
            }
        }
        capabilityCategory.capabilities.push({
            aliases: [{
                nodes: [nodeID]
            }]
        });
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
        });
    };

    workspaceSchema.methods.editCategory = function(timesliceId, capabilityCategoryID, name){
      var timeSlice = this.getTimeSlice(timesliceId);

      for (var i = timeSlice.capabilityCategories.length - 1; i > -1 ; i--) {
          if (capabilityCategoryID.equals(timeSlice.capabilityCategories[i]._id)) {
              timeSlice.capabilityCategories[i].name = name;
              break;
          }
      }
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.createCategory = function(timesliceId, name){
      var timeSlice = this.getTimeSlice(timesliceId);

      timeSlice.capabilityCategories.push({ name:name, capabilities : []});
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.deleteCategory = function(timesliceId, capabilityCategoryID){
      var timeSlice = this.getTimeSlice(timesliceId);

      var Node = require('./node-schema')(conn);
        var promises = [];
        var capabilityCategoryToRemove = null;
        for (var i = timeSlice.capabilityCategories.length - 1; i > -1 ; i--) {
            if (capabilityCategoryID.equals(timeSlice.capabilityCategories[i]._id)) {
                capabilityCategoryToRemove = timeSlice.capabilityCategories.splice(i,1)[0];
                promises.push(this.save());
                break;
            }
        }
        if(capabilityCategoryToRemove.capabilities){
          for (var j = 0; j < capabilityCategoryToRemove.capabilities.length; j++){
            var capability = capabilityCategoryToRemove.capabilities[j];
            if(capability.aliases){
              for(var k = 0; k < capability.aliases.length; k++){
                var alias = capability.aliases[k];
                if(alias.nodes){
                  for(var l = 0; l < alias.nodes.length; l++){

                    var node = alias.nodes[l];
                    promises.push(Node.findOneAndUpdate({
                        _id: node
                    }, {
                        $set: {
                            processedForDuplication: false
                        }
                    }).exec());
                  }
                }
              }
            }
          }
        }

        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });

    };

    workspaceSchema.methods.createNewAliasForNodeInACapability = function(timesliceId, capabilityID, nodeID) {
        var timeSlice = this.getTimeSlice(timesliceId);

        var Node = require('./node-schema')(conn);

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                }
            }
        }
        capability.aliases.push({
            nodes: [nodeID]
        });
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.createNewMarketReferenceInCapability = function(timesliceId, capabilityID, name, description, evolution) {
      var timeSlice = this.getTimeSlice(timesliceId);

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < this.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                }
            }
        }
        capability.marketreferences.push({
          name: name,
          description: description,
          evolution: evolution
        });
        promises.push(this.save());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.deleteMarketReferenceInCapability = function(timesliceId, capabilityID, marketReferenceId) {
      var timeSlice = this.getTimeSlice(timesliceId);

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                    for(var k = capability.marketreferences.length - 1; k >=0; k--){
                      if(capability.marketreferences[k]._id.equals(marketReferenceId)){
                        capability.marketreferences.splice(k,1);
                      }
                    }
                }
            }
        }

        promises.push(this.save());

        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.updateMarketReferenceInCapability = function(timesliceId, capabilityID, marketReferenceId, name, description, evolution) {
      var timeSlice = this.getTimeSlice(timesliceId);

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                    for(var k = capability.marketreferences.length - 1; k >=0; k--){
                      if(capability.marketreferences[k]._id.equals(marketReferenceId)){
                        capability.marketreferences[k].name = name;
                        capability.marketreferences[k].description = description;
                        capability.marketreferences[k].evolution = evolution;
                      }
                    }
                }
            }
        }

        promises.push(this.save());

        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.addNodeToAlias = function(timesliceId,aliasID, nodeID) {
        var timeSlice = this.getTimeSlice(timesliceId);

        var Node = require('./node-schema')(conn);

        var promises = [];
        var alias = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
          for(var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++){
            for(var k = 0; k < timeSlice.capabilityCategories[i].capabilities[j].aliases.length; k++){
              if (aliasID.equals(timeSlice.capabilityCategories[i].capabilities[j].aliases[k]._id)) {
                  alias = timeSlice.capabilityCategories[i].capabilities[j].aliases[k];
              }
            }
          }
        }
        alias.nodes.push(nodeID);
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node'
            }).execPopulate();
        });
    };

    workspaceSchema.methods.getNodeUsageInfo = function(timesliceId, nodeID) {
        var timeSlice = this.getTimeSlice(timesliceId);
        var _this = this;
        return this.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
                populate: {
                    model: 'WardleyMap',
                    path: 'parentMap'
                }
            })
            .execPopulate()
            .then(function(workspace) {
                var capability = null;
                for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
                    for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                        for (var k = 0; k < timeSlice.capabilityCategories[i].capabilities[j].aliases.length; k++) {
                            for (var l = 0; l < timeSlice.capabilityCategories[i].capabilities[j].aliases[k].nodes.length; l++) {
                                if (nodeID.equals(timeSlice.capabilityCategories[i].capabilities[j].aliases[k].nodes[l]._id)) {
                                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                                }
                            }
                        }
                    }
                }
                return capability;
            });
          };

      workspaceSchema.methods.removeNodeUsageInfo = function(node) {
          var WardleyMap = require('./map-schema')(conn);
          var workspace = this;
          var dependencyToRemove = node._id;

          return WardleyMap.findById(node.parentMap._id || node.parentMap).exec()
            .then(function(parentMap){
              var timeSliceId = parentMap.timesliceId;
              var timeSlice = workspace.getTimeSlice(timeSliceId);

              for (var capabilityCategoriesCounter = timeSlice.capabilityCategories.length - 1; capabilityCategoriesCounter >= 0; capabilityCategoriesCounter--) {
                  var capabilityCategory = timeSlice.capabilityCategories[capabilityCategoriesCounter];
                  for (var capabilitiesCounter = capabilityCategory.capabilities.length - 1; capabilitiesCounter >= 0; capabilitiesCounter--) {
                      var capability = capabilityCategory.capabilities[capabilitiesCounter];
                      for (var aliasCounter = capability.aliases.length - 1; aliasCounter >= 0; aliasCounter--) {
                          var alias = capability.aliases[aliasCounter];
                          for (var nodeCounter = alias.nodes.length - 1; nodeCounter >= 0; nodeCounter--) {
                              var node = alias.nodes[nodeCounter];
                              if (node._id === dependencyToRemove) {
                                  alias.nodes.splice(nodeCounter, 1);
                                  break;
                              }
                          }
                          if (alias.nodes.length === 0) {
                              capability.aliases.splice(aliasCounter, 1);
                          }
                      }
                      if (capability.aliases.length === 0) {
                          capabilityCategory.capabilities.splice(capabilitiesCounter, 1);
                      }
                  }
              }
              return workspace.save();
            });

    };

    workspaceSchema.methods.removeCapability = function(timesliceId, capabilityID) {
      var Node = require('./node-schema')(conn);
      var timeSlice = this.getTimeSlice(timesliceId);

      var promises = [];
      var capability = null;
      for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
          for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
              if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                  capability = timeSlice.capabilityCategories[i].capabilities[j];
                  timeSlice.capabilityCategories[i].capabilities.splice(j, 1);
                  break;
              }
          }
      }
      promises.push(this.save());
      for (var k = 0; k < capability.aliases.length; k++) {
          for (var l = 0; l < capability.aliases[k].nodes.length; l++) {
              promises.push(Node.findOne({
                  _id: capability.aliases[k].nodes[l]
              }).exec().then(function(node){
                node.processedForDuplication = false;
                return node.save();
              }));
          }
      }
      return q.all(promises);

  };


    workspaceSchema.methods.cloneTimeslice = function(sourceTimeSliceId) {
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);


      if (!sourceTimeSliceId) {
        throw new Error('source not specified');
      }

      return this.populate('timeline.maps timeline.maps.nodes').execPopulate()
        .then(function(popWorkspace) {
          var promisesToSave = [];
          var sourceTimeSlice = popWorkspace.getTimeSlice(sourceTimeSliceId);

          // prepare a new timeslice
          var newTimeSlice = {
            _id: new ObjectId(),
            name: sourceTimeSlice.name,
            description: sourceTimeSlice.description,
            current: false,
            next: [],
            previous: [sourceTimeSlice._id],
            maps: [],
            capabilityCategories: []
          };
          sourceTimeSlice.next.push(newTimeSlice._id);




          var submapMappings = {};
          var nodeMappings = {};

          sourceTimeSlice.maps.forEach(function(oldMap) {
            var newId = new ObjectId();
            var newMap = new WardleyMap({
              _id: newId,
              user: oldMap.user,
              purpose: oldMap.purpose,
              name: oldMap.name,
              isSubmap: oldMap.isSubmap,
              archived: oldMap.archived,
              workspace: oldMap.workspace,
              next: [],
              previous: oldMap._id,
              timesliceId: newTimeSlice._id,
              responsiblePerson: oldMap.responsiblePerson,
              schemaVersion: oldMap.schemaVersion,
              comments: [],
              nodes: []
            });
            newTimeSlice.maps.push(newMap);
            oldMap.next.push(newMap._id);

            if (oldMap.isSubmap) {
              submapMappings[oldMap._id] = newMap._id;
            }
            // transfer comments
            for (var i = 0; i < oldMap.comments.length; i++) {
              newMap.comments.push({
                x: oldMap.comments[i].x,
                y: oldMap.comments[i].y,
                text: oldMap.comments[i].text,
              });
            }
            // transfer nodes
            for (var j = 0; j < oldMap.nodes.length; j++) {
              var newNodeId = new ObjectId();
              var oldNode = oldMap.nodes[j];
              var newNode = new Node({
                workspace: oldNode.workspace,
                parentMap: newMap._id,
                name: oldNode.name,
                x: oldNode.x,
                y: oldNode.y,
                type: oldNode.type,
                constraint: oldNode.constraint,
                previous: oldNode._id,
                next: [],
                inboundDependencies: oldNode.inboundDependencies,
                outboundDependencies: oldNode.outboundDependencies,
                dependencyData: {
                  inbound: oldNode.dependencyData.inbound,
                  outbound: oldNode.dependencyData.outbound
                },
                action: [],
                submapID: oldNode.submapID,
                responsiblePerson: oldNode.responsiblePerson,
                inertia: oldNode.inertia,
                description: oldNode.description,
                processedForDuplication: oldNode.processedForDuplication
              });
              //transfer what needs to be transferred
              for (var k = 0; k < oldNode.action.length; k++) {
                newNode.action.push({
                  x: oldNode.action[k].x,
                  y: oldNode.action[k].y,
                  shortSummary: oldNode.action[k].shortSummary,
                  description: oldNode.action[k].description
                });
              }
              // add to the parent map
              newMap.nodes.push(newNode);

              // record mapping
              nodeMappings[oldNode._id] = newNodeId;
            }
          });

          // update dependencies and submaps
          newTimeSlice.maps.forEach(function(map) {
            map.nodes.forEach(function(node) {
              if (node.isSubmap) {
                node.submapID = submapMappings[node.submapID];
              }
              if (node.inboundDependencies) {
                for (var ni = 0; ni < node.inboundDependencies.length; ni++) {
                  // replace the dependency

                  var oldDep = node.inboundDependencies[ni];
                  node.inboundDependencies[ni] = nodeMappings[oldDep];

                  //replace the dependencyData

                  node.dependencyData.inbound[nodeMappings[oldDep]] = node.dependencyData.inbound[oldDep];
                  delete node.dependencyData.inbound[oldDep];
                }
              }
              if (node.outboundDependencies) {
                for (var no = 0; no < node.outboundDependencies.length; no++) {
                  // replace the dependency

                  var oldDep = node.outboundDependencies[no];
                  node.outboundDependencies[no] = nodeMappings[oldDep];

                  //replace the dependencyData

                  node.dependencyData.outbound[nodeMappings[oldDep]] = node.dependencyData.outbound[oldDep];
                  delete node.dependencyData.outbound[oldDep];
                }
              }
            });
          });

          // finally, transfer duplication data
          sourceTimeSlice.capabilityCategories.forEach(function(oldCapabilityCategory) {
            var newCapabilityCategory = {
              name: oldCapabilityCategory.name,
              next: [],
              previous: oldCapabilityCategory._id,
              capabilities: [],
              marketreferences: []
            };

            oldCapabilityCategory.capabilities.forEach(function(oldCapability) {
              var newCapability = {
                aliases: [],
                next: [],
                previous: oldCapability._id
              };
              oldCapability.aliases.forEach(function(newCapability, oldAlias) {
                var newAlias = {
                  nodes: [],
                  next: [],
                  previous: oldAlias._id
                };
                for (var z = 0; z < oldAlias.nodes.length; z++) {
                  newAlias.push(nodeMappings[oldAlias.nodes[z]._id]);
                }
                newCapability.aliases.push(newAlias);
              }.bind(newCapability));
              newCapabilityCategory.capabilities.push(newCapability);
            });
            if (oldCapabilityCategory.marketreferences) {
              oldCapabilityCategory.marketreferences.forEach(function(oldMarketReference) {
                newCapabilityCategory.marketreferences.push({
                  name: oldMarketReference.name,
                  description: oldMarketReference.description,
                  evolution: oldMarketReference.evolution,
                  next: [],
                  previous: oldMarketReference._id
                });
              });
            }

            newTimeSlice.capabilityCategories.push(newCapabilityCategory);
          });


          sourceTimeSlice.maps.forEach(function(map){
            promisesToSave.push(map.save());
            map.nodes.forEach(function(node){
              promisesToSave.push(node.save());
            });
          });
          newTimeSlice.maps.forEach(function(map){
            promisesToSave.push(map.save());
            map.nodes.forEach(function(node){
              console.log('node', node);
              promisesToSave.push(node.save());
            });
          });

          popWorkspace.timeline.push(newTimeSlice);
          return q.allSettled(promisesToSave).then(function(r){
            return popWorkspace.save();
          });
        });
    };

    workspace[conn] = conn.model('Workspace', workspaceSchema);
    return workspace[conn];
};
module.exports.migrator = migrator;
