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

mongoose.connect('mongodb://localhost:27017/workspaces');

var _WorkspaceSchema = new Schema({
  name: Schema.Types.String,
  description: Schema.Types.String,
  owner: Schema.Types.String,
  maps: [
    {
      type: Schema.Types.ObjectId,
      ref: 'WMap'
    }
  ]
});

var _MapSchema = new Schema({
  name: Schema.Types.String,
  description: Schema.Types.String,
  owner: Schema.Types.String,
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  }
});

var WorkspaceModel = mongoose.model('Workspace', _WorkspaceSchema);
var WMap = mongoose.model('Workspace', _MapSchema);

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

    WorkspaceModel.find({
      owner: getStormpathUserIdFromReq(req)
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
    var wkspc = new WorkspaceModel({name: name, description: description, owner: owner});
    wkspc.save(function(err, result) {
      if (err) {
        res.json(err);
      }
      res.json(result);
    });
  });

  module.router.get('/workspace/:workspaceID', stormpath.authenticationRequired, function(req, res) {
    console.log({owner: getStormpathUserIdFromReq(req), id: req.params.workspaceID});
    WorkspaceModel.findOne({
      owner: getStormpathUserIdFromReq(req),
      _id: req.params.workspaceID
    }, function(err, result) {
      res.json({workspace: result});
    });
  });

  return module;
};
