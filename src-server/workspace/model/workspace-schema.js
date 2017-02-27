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
var workspace = null;
module.exports = function(conn) {
    if (workspace) {
        return workspace;
    }
    workspace = conn.model('Workspace', new Schema({
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
            type : Schema.Types.ObjectId,
            ref : 'CapabilityCategory'
        } ]
    }));
    return workspace;
};
