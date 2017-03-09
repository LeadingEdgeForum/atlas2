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
var modelLogger = require('./../../log').getLogger('AliasSchema');
var _ = require('underscore');



var wardleyMap = null;

module.exports = function(conn){

    if(wardleyMap){
        return wardleyMap;
    }
    /**
     * see capability-category-schema for explanations.
     */

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
        }],
        comments : [{
            x : Schema.Types.Number,
            y : Schema.Types.Number,
            text : Schema.Types.String
        }],
        responsiblePerson : Schema.Types.String
    });

    _MapSchema.methods.makeComment = function(data, callback /**err, map*/ ) {
        this.comments.push(data);
        this.save(callback);
    };

    _MapSchema.methods.updateComment = function(seq, dataPos, callback /**err, map*/ ) {
        for(var i = 0; i < this.comments.length; i++){
          if('' + this.comments[i]._id === seq){
            if(dataPos.x && dataPos.y){
              this.comments[i].set('x',dataPos.x);
              this.comments[i].set('y',dataPos.y);
            }
            if(dataPos.text){
              this.comments[i].set('text',dataPos.text);
            }
          }
        }
        this.save(callback);
    };

    _MapSchema.methods.deleteComment = function(seq, callback /**err, node*/ ) {
        for(var i = 0; i < this.comments.length; i++){
          if('' + this.comments[i]._id === seq){
            this.comments.splice(i,1);
            break;
          }
        }
        this.markModified('comments');
        this.save(callback);
    };

    _MapSchema.methods.verifyAccess = function(user, callback_granted, callback_denied) {
        var Workspace = require('./workspace-schema')(conn);
        var mapID = this._id;
        Workspace.findOne({
            owner: user,
            maps: mapID
        }).exec(function(err, result) {
            if(err){
                return callback_denied(err);
            }
            if(!result){
                return callback_denied();
            }
            return callback_granted();
        });
    };

    _MapSchema.methods.newBody = function(body, callback_granted, callback_denied) {
      _.extend(this, body);
      _.extend(this.archived, false);

      this.save(function(err2, result2) {
        if (err2) {
          return callback_denied(err2);
        }
        return callback_granted(result2);
      });
    };

    _MapSchema.methods.addNode = function(name, x, y, type, workspace, parentMap, description, inertia, responsiblePerson, callback_success, callback_error) {
        var wardleyMapObject = this;
        var Node = require('./node-schema')(conn);
        var newNode = new Node({
            name: name,
            x: x,
            y: y,
            type: type,
            workspace: workspace,
            parentMap: parentMap,
            description : description,
            inertia : inertia,
            responsiblePerson : responsiblePerson
        });
        newNode.save(function(errNewNode, resultNewNode){
          if(errNewNode){
            return callback_error(errNewNode);
          }
          wardleyMapObject.nodes.push(resultNewNode._id);
          wardleyMapObject.save(function(errModifiedMap, resultModifiedMap){
            if(errModifiedMap){
              return callback_error(errModifiedMap);
            }
            var WardleyMap = require('./map-schema')(conn);
            WardleyMap.populate(
              resultModifiedMap,
              {path:'nodes', model: 'Node'},
              function(popError, popResult){
                if(popError){
                  return callback_error(popError);
                }
                callback_success(popResult);
              });
            });
        });
    };

    _MapSchema.methods.changeNode = function(name, x, y, type,desiredNodeId, description, inertia, responsiblePerson, callback_success, callback_error) {
        var wardleyMapObject = this;
        var Node = require('./node-schema')(conn);
        Node.findOne({_id:desiredNodeId}).exec(function(err, node){
          if (err) {
            return callback_error(err);
          }
          if (!node) {
            return callback_error();
          }

          if (name) {
            node.name = name;
          }
          if (x) {
            node.x = x;
          }
          if (y) {
            node.y = y;
          }
          if (type) {
            node.type = type;
          }
          if(description){
            node.description = description;
          }
          if(inertia){
            node.inertia = inertia;
          }
          if(responsiblePerson){
            node.responsiblePerson = responsiblePerson;
          }
          node.save(function(errNewNode, resultNewNode){
            if(errNewNode){
              return callback_error(errNewNode);
            }
            var WardleyMap = require('./map-schema')(conn);
            WardleyMap.populate(
              wardleyMapObject,
              {path:'nodes', model: 'Node'},
              function(popError, popResult){
                if(popError){
                  return callback_error(popError);
                }
                callback_success(popResult);
              });
          });

        });
    };

    _MapSchema.methods.formJSON = function(cb_success, cb_error) {
        var WardleyMap = require('./map-schema')(conn);
        WardleyMap
            .findOne({
                _id: this._id
            })
            .populate('nodes')
            .exec(function(err, mapresult) {
                if (err) {
                    return cb_error(err);
                }
                cb_success({
                    map: mapresult.toObject()
                });
            });
    };

    wardleyMap = conn.model('WardleyMap', _MapSchema);
    return wardleyMap;
};
