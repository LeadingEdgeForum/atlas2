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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var modelLogger = require('./../log').getLogger('Model');



module.exports = function(conn) {

    var _WorkspaceSchema = new Schema({
        name: Schema.Types.String,
        purpose: Schema.Types.String,
        description: Schema.Types.String,
        owner: [{
            type: Schema.Types.String
        }],
        archived: Schema.Types.Boolean,
        maps: [{
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        }],
        capabilityCategories: [{
            type: Schema.Types.ObjectId,
            ref: 'CapabilityCategory'
        }]
    });

    var _CapabilityCategorySchema = new Schema({
        name: Schema.Types.String,
        capabilities: [{
            type: Schema.Types.ObjectId,
            ref: 'Capability'
        }]
    });

    var _CapabilitySchema = new Schema({
        aliases: [{
            type: Schema.Types.ObjectId,
            ref: 'Alias'
        }]
    });

    var _AliasSchema = new Schema({
        nodes: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }]
    });

    var _NodeSchema = new Schema({
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
        submapID: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        },
        /**holds a reference to a submap if there is one (type must be set to SUBMAP)*/
        processedForDuplication: {
            default: false,
            type: Schema.Types.Boolean
        }
    });

    _NodeSchema.methods.makeDependencyTo = function(_targetId, callback /**err, node*/ ) {
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

    _NodeSchema.methods.removeDependencyTo = function(_targetId, callback /**err, node*/ ) {
        var targetId = new ObjectId(_targetId);
        var promises = [];
        this.outboundDependencies.pull(targetId);
        promises.push(this.save());
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

    var _MapSchema = new Schema({
        user: Schema.Types.String,
        purpose: Schema.Types.String,
        name: Schema.Types.String,
        isSubmap: Schema.Types.Boolean,
        archived: Schema.Types.Boolean,
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace'
        },
        nodes: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }]
    });

    _MapSchema.methods.verifyAccess = function(user, callback) {
        var mapID = this._id;
        Workspace.findOne({
            owner: user,
            maps: mapID
        }).exec(function(err, result) {
            callback(err, result !== null);
        });
    };

    _CapabilitySchema.pre('remove', function(next) {
        var promises = [];
        var _id = this._id;
        var aliases = this.aliases.map(n => n); //unmark all nodes processed for duplication
        modelLogger.trace('unprocessing aliases', aliases);
        aliases.forEach(function(a) {
            promises.push(
                Alias.findById(new Object(a))
                .then(function(alias) {
                    alias.nodes.forEach(function(n) {
                        modelLogger.trace('unprocessing node', n);
                        promises.push(Node.update({
                            _id: n
                        }, {
                            $set: {
                                processedForDuplication: false
                            }
                        }, {
                            safe: true
                        }).exec());
                    });
                    return alias;
                }).then(function(alias) {
                    return alias.remove();
                })
            );
        });
        promises.push(CapabilityCategory.update({
            capabilities: _id
        }, {
            $pull: {
                capabilities: _id
            }
        }, {
            safe: true
        }).exec());
        q.all(promises).then(function(results) {
            modelLogger.trace('unprocessing results', results.length);
            next();
        }, function(err) {
            modelLogger.error(err);
            next(err);
        });
    });

    _AliasSchema.pre('remove', function(next) {
        modelLogger.trace('alias pre remove');
        var promises = [];
        var nodes = this.nodes.map(n => new ObjectId(n));
        nodes.forEach(function(n) {
            promises.push(Node.update({
                _id: n
            }, {
                $set: {
                    processedForDuplication: false
                }
            }, {
                safe: true
            }).exec());
        });
        q.all(promises).then(function(results) {
            modelLogger.trace('alias removing results', results);
            next();
        }, function(err) {
            modelLogger.error(err);
            next(err);
        });
    });



    _NodeSchema.pre('remove', function(next) {
        modelLogger.trace('pre remove on node');
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

    var Workspace = conn.model('Workspace', _WorkspaceSchema);
    var WardleyMap = conn.model('WardleyMap', _MapSchema); //jshint ignore:line
    var Node = conn.model('Node', _NodeSchema); //jshint ignore:line
    var CapabilityCategory = conn.model('CapabilityCategory', _CapabilityCategorySchema); //jshint ignore:line
    var Capability = conn.model('Capability', _CapabilitySchema); //jshint ignore:line
    var Alias = conn.model('Alias', _AliasSchema); //jshint ignore:line
    return {
        Workspace: Workspace,
        WardleyMap: WardleyMap, //jshint ignore:line
        Node: Node, //jshint ignore:line
        CapabilityCategory: CapabilityCategory, //jshint ignore:line
        Capability: Capability, //jshint ignore:line
        Alias: Alias //jshint ignore:line
    };
};
