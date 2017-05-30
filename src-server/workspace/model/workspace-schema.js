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

module.exports = function(conn) {
    if (workspace[conn]) {
        return workspace[conn];
    }
    var workspaceSchema = new Schema({
        name : Schema.Types.String,
        purpose : Schema.Types.String,
        description : Schema.Types.String,
        owner : [ {
            type : Schema.Types.String
        } ],
        archived : Schema.Types.Boolean,
        maps : [ {
            type : Schema.Types.ObjectId,
            ref : 'WardleyMap'
        } ],
        capabilityCategories : [ {
          name : Schema.Types.String,
          capabilities : [ {
            aliases: [{
              nodes: [{
                  type: Schema.Types.ObjectId,
                  ref: 'Node'
              }]
            }],
            marketreferences : [ {
              name : Schema.Types.String,
              description : Schema.Types.String,
              evolution : Schema.Types.Number
            }]
          } ]
        } ]
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
            capabilityCategories : defaultCapabilityCategories
        });
        return wkspc.save();
    };

    workspaceSchema.methods.createMap = function(editor, user, purpose, responsiblePerson) {
        var WardleyMap = require('./map-schema')(conn);
        var Workspace = require('./workspace-schema')(conn);

        if (!user) {
            user = "your competitor";
        }
        if (!purpose) {
            purpose = "be busy with nothing";
        }
        var newId = new ObjectId();
        this.maps.push(newId);
        return this.save()
            .then(function(workspace) {
                return new WardleyMap({
                    user: user,
                    purpose: purpose,
                    workspace: workspace._id,
                    archived: false,
                    responsiblePerson: responsiblePerson,
                    _id: newId
                }).save();
            });
    };

    workspaceSchema.methods.findUnprocessedNodes = function(){
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);

      return WardleyMap
          .find({ // find all undeleted maps within workspace
              archived: false,
              workspace: this._id
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

    workspaceSchema.methods.findProcessedNodes = function() {
        console.log(this.capabilityCategories);
        var _this = this;
        //this is a temporary mechanism that should be removed when the database is properly migrated
        if (!this.capabilityCategories[0].name) { // rough check, no name -> needs migration
            var Node = require('./node-schema')(conn);
            return Node.update({
                workspace: _this.id
            }, {
                processedForDuplication: true
            }, {
                safe: true
            }).exec().then(function() {
                _this.capabilityCategories = defaultCapabilityCategories;
                return _this.save();
            });
        } else {
            return this
                .populate({
                    path: 'capabilityCategories.capabilities.aliases.nodes',
                    model: 'Node',
                }).execPopulate();
        }
    };

    workspaceSchema.methods.createNewCapabilityAndAliasForNode = function(categoryID, nodeID) {
        var Node = require('./node-schema')(conn);

        var promises = [];
        var capabilityCategory = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
            if (categoryID.equals(this.capabilityCategories[i]._id)) {
                capabilityCategory = this.capabilityCategories[i];
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
              path: 'capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
        });
    };

    workspaceSchema.methods.editCategory = function(capabilityCategoryID, name){
      for (var i = this.capabilityCategories.length - 1; i > -1 ; i--) {
          if (capabilityCategoryID.equals(this.capabilityCategories[i]._id)) {
              this.capabilityCategories[i].name = name;
              break;
          }
      }
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.createCategory = function(name){
      this.capabilityCategories.push({ name:name, capabilities : []});
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.deleteCategory = function(capabilityCategoryID){
      var Node = require('./node-schema')(conn);
        var promises = [];
        var capabilityCategoryToRemove = null;
        for (var i = this.capabilityCategories.length - 1; i > -1 ; i--) {
            if (capabilityCategoryID.equals(this.capabilityCategories[i]._id)) {
                capabilityCategoryToRemove = this.capabilityCategories.splice(i,1)[0];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });

    };

    workspaceSchema.methods.createNewAliasForNodeInACapability = function(capabilityID, nodeID) {
        var Node = require('./node-schema')(conn);

        var promises = [];
        var capability = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
            for (var j = 0; j < this.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(this.capabilityCategories[i].capabilities[j]._id)) {
                    capability = this.capabilityCategories[i].capabilities[j];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.createNewMarketReferenceInCapability = function(capabilityID, name, description, evolution) {
        var promises = [];
        var capability = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
            for (var j = 0; j < this.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(this.capabilityCategories[i].capabilities[j]._id)) {
                    capability = this.capabilityCategories[i].capabilities[j];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.deleteMarketReferenceInCapability = function(capabilityID, marketReferenceId) {
        var promises = [];
        var capability = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
            for (var j = 0; j < this.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(this.capabilityCategories[i].capabilities[j]._id)) {
                    capability = this.capabilityCategories[i].capabilities[j];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.updateMarketReferenceInCapability = function(capabilityID, marketReferenceId, name, description, evolution) {
        var promises = [];
        var capability = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
            for (var j = 0; j < this.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(this.capabilityCategories[i].capabilities[j]._id)) {
                    capability = this.capabilityCategories[i].capabilities[j];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.addNodeToAlias = function(aliasID, nodeID) {
        var Node = require('./node-schema')(conn);

        var promises = [];
        var alias = null;
        for (var i = 0; i < this.capabilityCategories.length; i++) {
          for(var j = 0; j < this.capabilityCategories[i].capabilities.length; j++){
            for(var k = 0; k < this.capabilityCategories[i].capabilities[j].aliases.length; k++){
              if (aliasID.equals(this.capabilityCategories[i].capabilities[j].aliases[k]._id)) {
                  alias = this.capabilityCategories[i].capabilities[j].aliases[k];
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
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node'
            }).execPopulate();
        });
    };

    workspaceSchema.methods.getNodeUsageInfo = function(nodeID) {
        var _this = this;
        return this.populate({
                path: 'capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
                populate: {
                    model: 'WardleyMap',
                    path: 'parentMap'
                }
            })
            .execPopulate()
            .then(function(workspace) {
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
                return capability;
            });

    };

    workspace[conn] = conn.model('Workspace', workspaceSchema);
    return workspace[conn];
};
