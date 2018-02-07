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
var ObjectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var q = require('q');
let getId = require('../../util/util.js').getId;
var SchemaDate = Schema.Types.Date;
var history = {};

let nowTime = function(){
  return new Date();
};
var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;

module.exports = function(conn) {

    if (history[conn.name]) {
        return history[conn.name];
    }
    /**
     * see capability-category-schema for explanations.
     */

    var _HistoryEntry = new Schema({
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true
        },
        date : {
          type: SchemaDate,
          default: SchemaDate.now,
          required: true
        },
        affectedMaps : [{
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap',
        }],
        affectedNodes : [{
            type: Schema.Types.ObjectId,
            ref: 'Node',
        }],
        actor : String,
        changes : [{
          fieldName : String,
          operationType : {
            type : String,
            enum:['SET', 'ADD', 'REMOVE'],
            default: 'SET',
            // required : true
          },
          newValue : String,
          message : String
        }],
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

    _HistoryEntry.statics.log = function(workspace, actor, affectedMaps, affectedNodes, arrayOfChanges) {
      let HistoryEntry = require('./history-schema')(conn);
      let entry = new HistoryEntry({
        workspace: getId(workspace),
        date: nowTime(),
        actor: actor,
        affectedMaps: affectedMaps,
        affectedNodes: affectedNodes,
        changes: arrayOfChanges.map(entry => {
          return {
            fieldName: entry[0],
            operationType: entry[1],
            newValue: entry[2],
            message: entry[3]
          };
        })
      });
      return entry.save();
    };


    history[conn.name] = conn.model('History', _HistoryEntry);
    return history[conn.name];
};
