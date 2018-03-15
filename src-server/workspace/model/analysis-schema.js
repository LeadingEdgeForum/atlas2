/* Copyright 2018  Krzysztof Daniel.
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
var _ = require('underscore');
var q = require('q');
let getId = require('../../util/util.js').getId;
var SchemaDate = Schema.Types.Date;
var analysis = {};

var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;

module.exports = function(conn) {

    if (analysis[conn.name]) {
        return analysis[conn.name];
    }
    /**
     * see capability-category-schema for explanations.
     */

    var AnalysisSchema = new Schema({
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true
        },
        schemaVersion : {
          type: Schema.Types.Number,
          default : 5
        }
    }, {
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    });

    AnalysisSchema.virtual('nodes', {
      ref : 'Node',
      localField : '_id',
      foreignField : 'analysis'
    });




    analysis[conn.name] = conn.model('Analysis', AnalysisSchema);
    return analysis[conn.name];
};
