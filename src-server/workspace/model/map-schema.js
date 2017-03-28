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
var modelLogger = require('./../../log').getLogger('MapSchema');
var _ = require('underscore');
var q = require('q');


var wardleyMap = {};

module.exports = function(conn){

    if(wardleyMap[conn]){
        return wardleyMap[conn];
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

    _MapSchema.methods.makeComment = function(data) {
        this.comments.push(data);
        return this.save();
    };

    _MapSchema.methods.updateComment = function(seq, dataPos) {
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
        return this.save();
    };

    _MapSchema.methods.deleteComment = function(seq) {
        for(var i = 0; i < this.comments.length; i++){
          if('' + this.comments[i]._id === seq){
            this.comments.splice(i,1);
            break;
          }
        }
        this.markModified('comments');
        return this.save();
    };

    _MapSchema.methods.verifyAccess = function(user) {
        var Workspace = require('./workspace-schema')(conn);
        var mapID = this._id;
        var _this = this;
        return Workspace.findOne({
            owner: user,
            maps: mapID
        }).exec().then(function(workspace){
          if(workspace){
            return _this; // if we found workspace, then we have access to the map
          }
          throw new Error('User ' + user + ' has no access to map' + mapID);
        });
    };

    _MapSchema.methods.newBody = function(body) {
      _.extend(this, body);
      _.extend(this.archived, false);

      return this.save();
    };

    _MapSchema.methods.addNode = function(name, x, y, type, workspace, description, inertia, responsiblePerson) {
        var Node = require('./node-schema')(conn);

        var _this = this;

        return new Node({
            name: name,
            x: x,
            y: y,
            type: type,
            workspace: workspace,
            parentMap: _this._id,
            description : description,
            inertia : inertia,
            responsiblePerson : responsiblePerson,
        }).save()
        .then(function(node){
          _this.nodes.push(node._id);
          return _this.save();
        })
        .then(function(savedWardleyMap){
          return savedWardleyMap.populate({path:'nodes', model: 'Node'}).execPopulate();
        });
    };

    _MapSchema.methods.changeNode = function(name, x, y, type, desiredNodeId, description, inertia, responsiblePerson) {
        var _this = this;
        var Node = require('./node-schema')(conn);
        return Node.findOne({
                _id: desiredNodeId
            }).exec()
            .then(function(node) {
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
                if (description) {
                    node.description = description;
                }
                if (inertia) {
                    node.inertia = inertia;
                }
                if (responsiblePerson) {
                    node.responsiblePerson = responsiblePerson;
                }
                return q.allSettled([node.save(), _this.populate({
                    path: 'nodes',
                    model: 'Node'
                }).execPopulate()]);
            });
    };


    _MapSchema.methods.removeNode = function(nodeID) {
        var _this = this;
        var Node = require('./node-schema')(conn);
        return Node.findOne({
                _id: nodeID
            }).exec()
            .then(function(node) {
                return q.allSettled([node.remove(), _this.populate({
                    path: 'nodes',
                    model: 'Node'
                }).execPopulate()]);
            });
    };

    _MapSchema.methods.formJSON = function() {
        var WardleyMap = require('./map-schema')(conn);
        return WardleyMap
            .findOne({
                _id: this._id
            })
            .populate('nodes')
            .exec();
    };

    _MapSchema.pre('save', function(next) {
        modelLogger.trace('pre save on', this._id, this.archived, this.isSubmap);
        var beingArchived = this.archived;
        if (!beingArchived) {
            modelLogger.trace('not being archived', this._id, this.isSubmap);
            // not being removed, so we are not processing anything any further
            return next();
        }
        var promises = [];
        var Node = require('./node-schema')(conn);
        // remove all nodes (we may have components pointing out to other submaps)
        for (var i = 0; i < this.nodes.length; i++) {
            modelLogger.trace('removing node', this.nodes[i]);
            promises.push(Node.findOneAndRemove({
                _id: new ObjectId(this.nodes[i])
            }).exec());
        }
        // if we are not a submap, then it is the end
        if (!this.isSubmap) {
            return next();
        }
        // otherwise it is necessary to find every Node that uses this map and delete it.
        Node.find({
            submapID: new ObjectId(this._id),
            type: 'SUBMAP'
        }).exec(function(err, results) {
            for (var j = 0; j < results.length; j++) {
                modelLogger.trace('removing submap node', results[j]._id, results[j].name);
                promises.push(results[j].remove());
            }
            q.all(promises)
                .then(function(results) {
                    next();
                }, function(err) {
                    modelLogger.error(err);
                    next(err);
                });
        });
    });
    wardleyMap[conn] = conn.model('WardleyMap', _MapSchema);
    return wardleyMap[conn];
};
