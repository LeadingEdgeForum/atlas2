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

var node = null;
/**
 * see capability-category-schema for explanations.
 */


module.exports = function(conn){
    if(node){
        return node;
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
        inboundDependencies: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
        outboundDependencies: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
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

    NodeSchema.methods.makeDependencyTo = function(_targetId, callback /**err, node*/ ) {
        var targetId = new ObjectId(_targetId);
        var promises = [];
        //abort if the connection is already there...
        for (var j = 0; j < this.outboundDependencies.length; j++) {
            if (targetId.equals(this.outboundDependencies[j])) {
                callback(400, null);
                return;
            }
        }
        this.outboundDependencies.push(targetId);
        promises.push(this.save());
        var Node = require('./node-schema')(conn);
        promises.push(Node.update({
            _id: targetId,
            workspace: this.workspace
        }, {
            $push: {
                inboundDependencies: this._id
            }
        }, {
            safe: true
        }));
        q.all(promises).then(function(results) {
            callback(null, results);
        }, function(err) {
            callback(err, null);
        });
    };

    NodeSchema.methods.makeAction = function(dataPos, callback /**err, node*/ ) {
        var relativeX = dataPos.x - this.x;
        var relativeY = dataPos.y - this.y;
        this.action.push({
          x : relativeX,
          y : relativeY
        });
        this.save(callback);
    };

    NodeSchema.methods.updateAction = function(seq, actionBody, callback /**err, node*/ ) {
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
        this.save(callback);
    };
    NodeSchema.methods.deleteAction = function(seq, callback /**err, node*/ ) {

        for(var i = 0; i < this.action.length; i++){
          if('' + this.action[i]._id === seq){
            this.action.splice(seq,1);
            break;
          }
        }
        this.markModified('action');

        this.save(callback);
    };

    NodeSchema.methods.removeDependencyTo = function(_targetId, callback /**err, node*/ ) {
        var targetId = new ObjectId(_targetId);
        var promises = [];
        this.outboundDependencies.pull(targetId);
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
        }));
        q.all(promises).then(function(results) {
            callback(null, results);
        }, function(err) {
            callback(err, null);
        });
    };

    NodeSchema.pre('remove', function(next) {
        modelLogger.trace('pre remove on node');
        var Node = require('./node-schema')(conn);
        var promises = [];
        var dependencyToRemove = this._id;
        for (var i = 0; i < this.inboundDependencies.length; i++) {
            promises.push(Node.update({
                _id: this.inboundDependencies[i]
            }, {
                $pull: {
                    outboundDependencies: this._id
                }
            }, {
                safe: true
            }));
        }
        for (var j = 0; j < this.outboundDependencies.length; j++) {
            promises.push(Node.update({
                _id: this.outboundDependencies[j]
            }, {
                $pull: {
                    inboundDependencies: this._id
                }
            }, {
                safe: true
            }));
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
        // find and remove from all aliases
        // find and delete empty aliases
        // find and delete empty capabilities -- temporary workarounded by query
        var Alias = require('./alias-schema')(conn);
        promises.push(Alias.update({
            nodes: this._id
        }, {
            $pull: {
                nodes: this._id
            }
        }, {
            safe: true,
            new: true
        }));
        q.all(promises)
            .then(function(results) {
                console.error('implement cascading removal of capabilities');
                return true;
            })
            .then(function(results) {
                next();
            }, function(err) {
                modelLogger.error(err);
                next(err);
            });
    });

    NodeSchema.statics.findSubmapUsagesInWorkspace = function(submapID, workspaceID, success_callback, failure_callback) {
        var Node = require('./node-schema')(conn);
        Node.find({
            type: 'SUBMAP',
            submapID: submapID
        }).select('parentMap').exec(function(e, r) {
            if (e) {
                return failure_callback(e);
            }
            var ids = [];
            r.forEach(item => ids.push(item.parentMap));
            var WardleyMap = require('./map-schema')(conn);
            WardleyMap
                .find({
                    archived: false,
                    _id: {
                        $in: ids
                    },
                    workspace : workspaceID
                })
                .populate('nodes')
                .select('name user purpose _id').exec(function(err, availableMaps) {
                    if (err) {
                        return failure_callback(err);
                    }
                    return success_callback(availableMaps);
                });
        });
    };

    node = conn.model('Node', NodeSchema);

    return node;

};
