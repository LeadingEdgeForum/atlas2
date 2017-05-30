//#!/bin/env node
/* Copyright 2017 Leading Edge Forum

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
var ObjectId = mongoose.Types.ObjectId;
var modelLogger = require('./../../log').getLogger('NodeSchema');
var q = require('q');

var node = {};
/**
 * see capability-category-schema for explanations.
 */

var ensureDepedencyData = function(node){
  if(!node.dependencyData){
    node.dependencyData = {
      inbound : {},
      outbound : {}
    };
    return;
  }
  if(!node.dependencyData.inbound){
    node.dependencyData.inbound = {};
  }
  if(!node.dependencyData.outbound){
    node.dependencyData.outbound = {};
  }
};

module.exports = function(conn){
    if(node[conn]){
        return node[conn];
    }

    var NodeSchema = new Schema({
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace'
        },
        parentMap: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        },
        name: Schema.Types.String,
        x: Schema.Types.Number,
        y: Schema.Types.Number,
        type: Schema.Types.String,
        constraint: Schema.Types.Number, // 0 - none, 10 - constraint, 20 - barrier
        inboundDependencies: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
        outboundDependencies: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
        dependencyData : {
          inbound : Schema.Types.Mixed, // _id : {} pairs
          outbound: Schema.Types.Mixed
        },
        action: [{
            x : Schema.Types.Number,
            y : Schema.Types.Number,
            shortSummary : Schema.Types.String,
            description : Schema.Types.String
        }],
        submapID: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        },
        responsiblePerson : Schema.Types.String,
        inertia : Schema.Types.Number,
        description : Schema.Types.String,
        /**holds a reference to a submap if there is one (type must be set to SUBMAP)*/
        processedForDuplication: {
            default: false,
            type: Schema.Types.Boolean
        }
    });

    NodeSchema.methods.turnIntoSubmap = function(refId) {
      this.type = 'SUBMAP';
      var _this = this;
      if (refId) {
        this.submapID = refId;
        return this.save();
      } else {
        return this.populate('workspace').execPopulate()
          .then(function(node) {
            //create structures
            var WardleyMap = require('./map-schema')(conn);
            var submapID = new ObjectId();
            var submap = new WardleyMap({
              _id: submapID,
              name: _this.name,
              isSubmap: true,
              workspace: _this.workspace,
              archived: false,
              responsiblePerson: _this.responsiblePerson
            });
            return submap.save().then(function(submap) {
              _this.workspace.maps.push(submap);
              return _this.workspace.save().then(function(workspace) {
                node.submapID = submapID;
                return node.save();
              });
            });
          });
      }
    };

    NodeSchema.methods.makeDependencyTo = function(_targetId) {
        var targetId = new ObjectId(_targetId);
        var promises = [];
        //abort if the connection is already there...
        for (var j = 0; j < this.outboundDependencies.length; j++) {
            if (targetId.equals(this.outboundDependencies[j])) {
                return null;
            }
        }
        // otherwise, check who is on the top
        var _this = this;
        var Node = require('./node-schema')(conn);
        return Node.findOne({
                _id: targetId,
                workspace: this.workspace
            }).exec()
            .then(function(counterPartyNode) {
                if (!counterPartyNode) { // no other node, exit
                    throw new Error('target node does not exists');
                }
                if (_this.y > counterPartyNode.y) {
                    _this.inboundDependencies.push(targetId);
                    counterPartyNode.outboundDependencies.push(_this._id);
                } else {
                    _this.outboundDependencies.push(targetId);
                    counterPartyNode.inboundDependencies.push(_this._id);
                }
                promises.push(_this.save());
                promises.push(counterPartyNode.save());
                return q.all(promises);
            });
    };

    NodeSchema.methods.updateDependencyTo = function(_targetId, data) {
        var targetId = new ObjectId(_targetId);
        var promises = [];

        // otherwise, check who is on the top
        var _this = this;
        ensureDepedencyData(_this);
        if(!_this.dependencyData.outbound['' +_targetId]){
          _this.dependencyData.outbound['' +_targetId] = {};
        }
        _this.dependencyData.outbound['' +_targetId].label = data.label;
        _this.dependencyData.outbound['' +_targetId].description = data.description;
        _this.dependencyData.outbound['' +_targetId].type = data.type;
        _this.markModified('dependencyData');

        var Node = require('./node-schema')(conn);
        return Node.findOne({
                _id: targetId,
                workspace: this.workspace
            }).exec()
            .then(function(counterPartyNode) {
                if (!counterPartyNode) { // no other node, exit
                    throw new Error('target node does not exists');
                }
                ensureDepedencyData(counterPartyNode, _this._id);
                if(!counterPartyNode.dependencyData.inbound['' + _this._id]){
                  counterPartyNode.dependencyData.inbound['' + _this._id] = {};
                }
                try {
                  counterPartyNode.dependencyData.inbound['' + _this._id].label = data.label;
                  counterPartyNode.dependencyData.inbound['' + _this._id].description = data.description;
                  counterPartyNode.dependencyData.inbound['' + _this._id].type = data.type;
                  counterPartyNode.markModified('dependencyData');
                } catch (e) {
                  console.log(e);
                }
                promises.push(_this.save());
                promises.push(counterPartyNode.save());
                return q.allSettled(promises);
            });
    };

    NodeSchema.methods.makeAction = function(dataPos) {
        var relativeX = dataPos.x - this.x;
        var relativeY = dataPos.y - this.y;
        this.action.push({
          x : relativeX,
          y : relativeY
        });
        return this.save();
    };

    NodeSchema.methods.updateAction = function(seq, actionBody) {
        if (actionBody.x && actionBody.y) {
            var relativeX = actionBody.x - this.x;
            var relativeY = actionBody.y - this.y;

            for (var i = 0; i < this.action.length; i++) {
                if ('' + this.action[i]._id === seq) {
                    this.action[i].set('x', relativeX);
                    this.action[i].set('y', relativeY);
                }
            }
        }
        if (actionBody.shortSummary || actionBody.description) {
            for (var j = 0; j < this.action.length; j++) {
                if ('' + this.action[j]._id === seq) {
                    this.action[j].set('shortSummary', actionBody.shortSummary);
                    this.action[j].set('description', actionBody.description);
                }
            }
        }
        return this.save();
    };

    NodeSchema.methods.deleteAction = function(seq) {

        for(var i = 0; i < this.action.length; i++){
          if('' + this.action[i]._id === seq){
            this.action.splice(i,1);
            break;
          }
        }
        this.markModified('action');

        return this.save();
    };

    NodeSchema.methods.removeDependencyTo = function(_targetId) {
        var targetId = new ObjectId(_targetId);
        var promises = [];
        var _this = this;
        this.outboundDependencies.pull(targetId);
        if(this.dependencyData && this.dependencyData.outbound){
            this.dependencyData.outbound[''+_targetId] = {};
        }
        this.markModified('dependencyData');
        promises.push(this.save());
        var Node = require('./node-schema')(conn);
        promises.push(Node.update({
            _id: targetId,
            workspace: this.workspace
        }, {
            $pull: {
                inboundDependencies: this._id
            }
        }, {
            safe: true
        }).then(function(updateResult){
          return Node.findOne({
                  _id: targetId,
                  workspace: _this.workspace
              }).exec().then(function(node){
                if(node.dependencyData && node.dependencyData.inbound){
                  delete node.dependencyData.inbound['' + _this._id ];
                  node.markModified('dependencyData');
                }
                return node.save();
              });
        }));
        return q.allSettled(promises);
    };

    NodeSchema.pre('remove', function(next) {
        modelLogger.trace('pre remove on node', this._id);
        var Node = require('./node-schema')(conn);
        var _this = this;
        var promises = [];
        var dependencyToRemove = this._id;
        var workspaceID = this.workspace;
        for (var i = 0; i < this.inboundDependencies.length; i++) {
            promises.push(
              Node.findOne({
                _id: this.inboundDependencies[i]
              }).exec()
              .then(function(node) {
                node.outboundDependencies.pull(dependencyToRemove);
                if (node.dependencyData && node.dependencyData.outbound) {
                  delete node.dependencyData.outbound['' + dependencyToRemove];
                  node.markModified('dependencyData');
                }
                return node.save();
              })
            );
        }
        for (var j = 0; j < this.outboundDependencies.length; j++) {
          promises.push(
            Node.findOne({
              _id: this.outboundDependencies[j]
            }).exec()
            .then(function(node) {
              node.outboundDependencies.pull(dependencyToRemove);
              if (node.dependencyData && node.dependencyData.inbound) {
                delete node.dependencyData.inbound['' + dependencyToRemove];
                node.markModified('dependencyData');
              }
              return node.save();
            })
          );
        }
        var WardleyMap = require('./map-schema')(conn);
        promises.push(WardleyMap.update({
            _id: this.parentMap
        }, {
            $pull: {
                nodes: this._id
            }
        }, {
            safe: true
        }));


        q.all(promises)
            .then(function(results) {
                var Workspace = require('./workspace-schema')(conn);
                Workspace.findById(workspaceID).exec(function(err, wkspc) {
                    for (var capabilityCategoriesCounter = wkspc.capabilityCategories.length - 1; capabilityCategoriesCounter >= 0; capabilityCategoriesCounter--) {
                        var capabilityCategory = wkspc.capabilityCategories[capabilityCategoriesCounter];
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
                    wkspc.save(next);
                });
                return true;
            }, function(err) {
                modelLogger.error(err);
                next(err);
            });
    });

    node[conn] = conn.model('Node', NodeSchema);

    return node[conn];

};
