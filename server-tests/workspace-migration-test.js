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
/*jslint node:true, mocha:true */
var should = require('should');
var q = require('q');
var mongoose = require('mongoose');
mongoose.Promise = q.Promise;

var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;
var migrator = require('../src-server/workspace/model/workspace-schema').migrator;

var owner = "testy@mactest.test";
var MongoDBConnection = require('../src-server/mongodb-helper');
var mongooseConnection1 = mongoose.createConnection(MongoDBConnection.test_usage.connectionURL);
var mongooseConnection2 = mongoose.createConnection(MongoDBConnection.test_usage.connectionURL);

var oldWorkspaceSchema = new Schema({
  name: Schema.Types.String,
  purpose: Schema.Types.String,
  description: Schema.Types.String,
  owner: [{
    type: Schema.Types.String
  }],
  archived: Schema.Types.Boolean,
  maps: [String],
  capabilityCategories: [{
    name: Schema.Types.String
  }]
});

var version1workspaceSchema = new Schema({
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
        maps: [String],
      }
    ],
    capabilityCategories : [ {
      name : String
    } ],
    schemaVersion : Number
});

version1workspaceSchema.post('init', migrator);

var OldWorkspace = mongooseConnection1.model('Workspace', oldWorkspaceSchema);
var Version1workspace = mongooseConnection2.model('Workspace', version1workspaceSchema);

describe('Workspace Migration Test', function() {

    after(function(done) {
        mongooseConnection1.db.dropDatabase();
        done();
    });

    it("from unversioned to versioned", function(done) {
        var oldWkspc = new OldWorkspace({
          name: 'name',
          description: 'description',
          maps: ['a', 'b']
        });
        oldWkspc
          .save()
          .then(function(oldWkspc){
            var _id = oldWkspc._id;
            return Version1workspace.findById(_id).exec()
            .then(function(v1){
              should(v1.schemaVersion).be.equal(1);
              should(v1.timeline[0].name).be.equal('Now');
              should(v1.timeline[0].maps[0]).be.equal('a');
              should.not.exist(v1.maps);
              return v1.save().then(function(v2){
                should(v2.schemaVersion).be.equal(1);
                should(v2.timeline[0].name).be.equal('Now');
                should(v2.timeline[0].maps[0]).be.equal('a');
                should.not.exist(v2.maps);
              }).done(function(a,b){
                done();
              });
            });
        }).done();
    });
});
