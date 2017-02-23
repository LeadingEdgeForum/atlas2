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
var String = Schema.Types.String;
var q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var modelLogger = require('./log').getLogger('User-Model');


module.exports = function(conn) {

    var _UnifiedUserSchema = new Schema({
        type : {
          type: String,
          enum : ['Stormpath','Passport']
        },
        href: String,
        username : String,
        email : String,
        fullName : String
    });

    var UnifiedUser = conn.model('UnifiedUser', _UnifiedUserSchema); //jshint ignore:line

    return {
        UnifiedUser: UnifiedUser
    };
};
