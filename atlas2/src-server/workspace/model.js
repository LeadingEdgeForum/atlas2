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
var MongoDBConnectionURL = require('./../mongodb-helper');
var q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var modelLogger = require('./../log').getLogger('Model');
mongoose.connect(MongoDBConnectionURL);

var _WorkspaceSchema = new Schema({
  name: Schema.Types.String,
  purpose: Schema.Types.String,
  description: Schema.Types.String,
  owner: Schema.Types.String,
  archived: Schema.Types.Boolean,
  maps: [
    {
      type: Schema.Types.ObjectId,
      ref: 'WardleyMap'
    }
  ],
  capabilityCategories : [
    {
      name: Schema.Types.String,
      capabilities :[
        {name: Schema.Types.String}
      ]
    }
  ]
});
var _NodeSchema = new Schema({
  workspace : {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  parentMap : {
    type: Schema.Types.ObjectId,
    ref: 'WardleyMap'
  },
  name: Schema.Types.String,
  x : Schema.Types.Number,
  y : Schema.Types.Number,
  type : Schema.Types.String,
  inboundDependencies:  [ {
    type: Schema.Types.ObjectId,
    ref : 'Node'
  }],
  outboundDependencies:  [ {
    type: Schema.Types.ObjectId,
    ref : 'Node'
  }],
  submapID : {
    type: Schema.Types.ObjectId,
    ref : 'WardleyMap'
  } /**holds a reference to a submap if there is one (type must be set to SUBMAP)*/
});

_NodeSchema.methods.makeDependencyTo = function(_targetId, callback/**err, node*/){
  var targetId = new ObjectId(_targetId);
  var promises = [];
  this.outboundDependencies.push(targetId);
  promises.push(this.save());
  promises.push(Node.update({
    _id: targetId,
    workspace : this.workspace
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

_NodeSchema.methods.removeDependencyTo = function(_targetId, callback/**err, node*/){
  var targetId = new ObjectId(_targetId);
  var promises = [];
  this.outboundDependencies.pull(targetId);
  promises.push(this.save());
  promises.push(Node.update({
    _id: targetId,
    workspace : this.workspace
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
  owner: Schema.Types.String,
  isSubmap: Schema.Types.Boolean,
  archived: Schema.Types.Boolean,
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  nodes : [{
      type: Schema.Types.ObjectId,
      ref: 'Node'
  }]
});



var Workspace = mongoose.model('Workspace', _WorkspaceSchema);
var WardleyMap = mongoose.model('WardleyMap', _MapSchema);
var Node = mongoose.model('Node', _NodeSchema);


_NodeSchema.pre('remove', function(next) {
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
  q.all(promises).then(function(results) {
    modelLogger.trace(results);
    next();
  }, function(err) {
    next(err);
  });
});

module.exports = {Workspace, WardleyMap, Node};
