//#!/bin/env node
/* Copyright 2017 Krzysztof Daniel

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
var accessLogger = require('./../log').getLogger('access');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;


let AccessError = function(status, message){
  this.status = status;
  this.message = message;
};
AccessError.prototype = Object.create(Error.prototype);
AccessError.prototype.constructor = AccessError;

let getUserIdFromReq = function(req) {
  if (req && req.user && req.user.email) {
    accessLogger.trace('user identified ' + req.user.email);
    return req.user.email;
  }
  //should never happen as indicates lack of authentication
  return null;
};


var checkAccess = function(id, user, map) {
  if (!user) {
    accessLogger.error('user.email not present');
    throw new AccessError(401, 'user.email not present');
  }
  if (!map) {
    accessLogger.warn('map ' + id + ' does not exist');
    throw new AccessError(404, 'map ' + id + ' does not exist');
  }
  return map.verifyAccess(user).then(function(verifiedMap) {
    if (!verifiedMap) {
      accessLogger.warn(user + ' has no access to map ' + id + '.');
      throw new AccessError(403, user + ' has no access to map ' + id + '.');
    }
    return verifiedMap;
  });
};

var getId = function(obj){
  if (!obj) {
    return obj;
  }
  if(obj instanceof ObjectId){
    return obj;
  }
  if(obj._id) {
   return obj._id;
  }
  // last resort, let's try to make it ObjectId
  return new ObjectId(obj);
};

module.exports.AccessError = AccessError;
module.exports.getUserIdFromReq = getUserIdFromReq;
module.exports.checkAccess = checkAccess;
module.exports.getId = getId;
