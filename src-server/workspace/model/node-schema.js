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
var nodeRemovalLogger = require('./../../log').getLogger('NodeRemoval');
var q = require('q');

var node = {};


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

var removeOutgoingDependency = function(promises, nodeId, dependencyToRemove, Node) {
  return Node.findOne({
      _id: nodeId
    }).exec()
    .then(function(node) {
      // trick - outgoing for me is incoming for the other node
      node.inboundDependencies.pull(dependencyToRemove);
      if (node.dependencyData && node.dependencyData.inbound) {
        delete node.dependencyData.inbound['' + dependencyToRemove];
        node.markModified('dependencyData');
      }
      promises.push(node.save());
    });
};

var removeIncomingDependency = function(promises, nodeId, dependencyToRemove, Node) {
  return Node.findOne({
      _id: nodeId
    }).exec()
    .then(function(node) {
      // trick - incoming for me is outcoming for the other node
      node.outboundDependencies.pull(dependencyToRemove);
      if (node.dependencyData && node.dependencyData.outbound) {
        delete node.dependencyData.outbound['' + dependencyToRemove];
        node.markModified('dependencyData');
      }
      promises.push(node.save());
    });
};


var cleanupDependencies = function(promises, node, Node) {
  nodeRemovalLogger.trace('cleaning dependencies for ' + node._id + ' , ' + node.inboundDependencies.length +
    ' incoming, and ' + node.outboundDependencies.length + ' outgoing.');

  var dependencyToRemove = node._id;

  for (let i = 0; i < node.inboundDependencies.length; i++) {
    nodeRemovalLogger.trace('cleaning incoming dependency ' + node.inboundDependencies[i]);
    removeIncomingDependency(promises, node.inboundDependencies[i], dependencyToRemove, Node);
  }

  for (let i = 0; i < node.outboundDependencies.length; i++) {
    nodeRemovalLogger.trace('cleaning outgoing dependency ' + node.outboundDependencies[i]);
    removeOutgoingDependency(promises, node.outboundDependencies[i], dependencyToRemove, Node);
  }

  let previousNode = node.previous;
  let nextNodes = node.next || []; //array

  if(previousNode){
    // there is a previous node, find it
    promises.push(
      Node.findOne({
        _id: node.previous
      }).exec()
      .then(function(node) {
        node.next.pull(dependencyToRemove);
        return node.save();
      }));
  }

  if (nextNodes.length) {
    for (let i = 0; i < nextNodes.length; i++) {
      promises.push(
        Node.findOne({
          _id: nextNodes[i]
        }).exec()
        .then(function(node) {
          node.previous = null;
          return node.save();
        }));
    }
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
        width : Schema.Types.Number, //label width
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
        },
        next : [Schema.Types.ObjectId],
        previous : Schema.Types.ObjectId
    });

    NodeSchema.methods.turnIntoSubmap = function(refId) {
      this.type = 'SUBMAP';
      var _this = this;
      if (refId) {
        // TODO: prevent connection from multiple time slices
        // the map we should link to is specified
        this.submapID = refId;
        return this.save();
      } else {
        // no submap specified, create one
        return this.populate('workspace parentMap').execPopulate()
          .then(function(node) {
            //create structures
            var WardleyMap = require('./map-schema')(conn);
            var submapID = new ObjectId();
            var submap = new WardleyMap({
              _id: submapID,
              name: _this.name,
              isSubmap: true,
              workspace: _this.workspace,
              timesliceId: _this.parentMap.timesliceId,
              archived: false,
              responsiblePerson: _this.responsiblePerson
            });
            return submap.save().then(function(submap) {
              _this.workspace.timeline[_this.workspace.timeline.length - 1].maps.push(submap);
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

    //dependency switch in one node
    NodeSchema.methods.transferDependencyData = function(sourceId, targetId) {
        sourceId = '' + sourceId;
        targetId = '' + targetId;
        if(!this.dependencyData){
          return; // no data, quit happily
        }
        if(this.dependencyData.inbound && this.dependencyData.inbound[sourceId]){
          this.dependencyData.inbound[targetId] = this.dependencyData.inbound[sourceId];
          delete this.dependencyData.inbound[sourceId];
          this.markModified('dependencyData');
        }
        if(this.dependencyData.outbound && this.dependencyData.outbound[sourceId]){
          this.dependencyData.outbound[targetId] = this.dependencyData.outbound[sourceId];
          delete this.dependencyData.outbound[sourceId];
          this.markModified('dependencyData');
        }
    };

    //dependency steal from different node
    NodeSchema.methods.stealDependencyData = function(node, sourceId) {
        var targetId = '' + node._id;
        sourceId = '' + sourceId;

        if(!node || !node.dependencyData){
          return; //nothing to steal, quit
        }
        if(!this.dependencyData){ // no data placeholder, create it
          this.dependencyData = {
            inbound : {},
            outbound : {}
          };
          this.markModified('dependencyData');
        }
        if(!this.dependencyData.inbound){
          this.dependencyData.inbound = {};
          this.markModified('dependencyData');
        }
        if(!this.dependencyData.outbound){
          this.dependencyData.outbound = {};
          this.markModified('dependencyData');
        }
        if(node.dependencyData.inbound && node.dependencyData.inbound[sourceId]){
          this.dependencyData.inbound[targetId] = node.dependencyData.inbound[sourceId];
          delete node.dependencyData.inbound[sourceId];
          this.markModified('dependencyData');
          node.markModified('dependencyData');
        }
        if(node.dependencyData.outbound && node.dependencyData.outbound[sourceId]){
          this.dependencyData.outbound[targetId] = node.dependencyData.outbound[sourceId];
          delete node.dependencyData.outbound[sourceId];
          this.markModified('dependencyData');
          node.markModified('dependencyData');
        }
    };


    NodeSchema.pre('remove', function(next) {
        nodeRemovalLogger.trace('pre remove on node ' + this);

        var Node = require('./node-schema')(conn);
        var _this = this;
        var promises = [];
        var workspaceID = this.workspace;

        cleanupDependencies(promises, _this, Node);

        nodeRemovalLogger.trace('removing node from a map ' + _this._id);

        var WardleyMap = require('./map-schema')(conn);
        promises.push(WardleyMap.update({
            _id: _this.parentMap
        }, {
            $pull: {
                nodes: _this._id
            }
        }, {
            safe: true
        }));

        nodeRemovalLogger.trace('map updated ' + _this.parentMap);


        q.all(promises)
            .then(function(results) {
                var Workspace = require('./workspace-schema')(conn);
                return Workspace.findById(workspaceID).exec()
                .then(function(workspace){
                  nodeRemovalLogger.trace('removing node usage info ' + _this.id);
                  return workspace.removeNodeUsageInfo(_this);
                });
            })
            .then(function(savedWorkspace){
                next();
            }, function(err) {
                nodeRemovalLogger.error(err);
                next(err);
            });
    });

    node[conn] = conn.model('Node', NodeSchema);

    return node[conn];

};
