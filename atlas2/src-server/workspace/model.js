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
mongoose.connect(MongoDBConnectionURL);

var _WorkspaceSchema = new Schema({
  name: Schema.Types.String,
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
  name: Schema.Types.String,
  x : Schema.Types.Number,
  y : Schema.Types.Number,
  type : Schema.Types.String,
  categorized: Schema.Types.Boolean,
  category: Schema.Types.String
});

/* Connection should have references to nodes. Maybe later */
var _ConnectionSchema = new Schema({
  scope: Schema.Types.String,
  source: Schema.Types.String,
  target: Schema.Types.String,
});

var _MapSchema = new Schema({
  name: Schema.Types.String,
  description: Schema.Types.String,
  owner: Schema.Types.String,
  archived: Schema.Types.Boolean,
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  nodes : [_NodeSchema],
  connections: [_ConnectionSchema]
});



var Workspace = mongoose.model('Workspace', _WorkspaceSchema);
var WardleyMap = mongoose.model('WardleyMap', _MapSchema);

module.exports = {Workspace, WardleyMap};
