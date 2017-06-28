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


var calculateMean = function(list, field) {
    // submapLogger.trace('multisave', list, field);
    if (!list || list.length === 0) {
        return 0.5;
    }
    var mean = 0;
    for (var i = 0; i < list.length; i++) {
        mean += list[i][field];
    }
    return mean / list.length;
};

var removeDuplicatesDependenciesFromList = function(dependencies) {
    var mySet = new Set();
    for (var i = 0; i < dependencies.length; i++) {
        mySet.add('' + dependencies[i]);
    }
    for (var j = dependencies.length - 1; j >= 0; j--) {
        if (mySet.has('' + dependencies[j])) {
            mySet.delete('' + dependencies[j]);
        } else {
            dependencies.splice(j, 1);
            j--;
        }
    }
};

var removeDuplicatesDependencies = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        removeDuplicatesDependenciesFromList(nodes[i].outboundDependencies);
        removeDuplicatesDependenciesFromList(nodes[i].inboundDependencies);
    }
};



module.exports = function(conn) {

    if (wardleyMap[conn]) {
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
        next : [Schema.Types.ObjectId],
        previous : Schema.Types.ObjectId,
        timesliceId : Schema.Types.ObjectId,
        nodes: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
        comments: [{
            x: Schema.Types.Number,
            y: Schema.Types.Number,
            text: Schema.Types.String,
            next : [Schema.Types.ObjectId],
            previous : Schema.Types.ObjectId,
        }],
        responsiblePerson: Schema.Types.String,
        schemaVersion : Schema.Types.Number
    });


    _MapSchema.methods.makeComment = function(data) {
        this.comments.push(data);
        return this.save();
    };

    _MapSchema.methods.updateComment = function(seq, dataPos) {
        for (var i = 0; i < this.comments.length; i++) {
            if ('' + this.comments[i]._id === seq) {
                if (dataPos.x && dataPos.y) {
                    this.comments[i].set('x', dataPos.x);
                    this.comments[i].set('y', dataPos.y);
                }
                if (dataPos.text) {
                    this.comments[i].set('text', dataPos.text);
                }
            }
        }
        return this.save();
    };

    _MapSchema.methods.deleteComment = function(seq) {
        for (var i = 0; i < this.comments.length; i++) {
            if ('' + this.comments[i]._id === seq) {
                this.comments.splice(i, 1);
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
            'timeline.maps': mapID
        }).exec().then(function(workspace) {
            if (workspace) {
                return _this; // if we found workspace, then we have access to the map
            }
            throw new Error('User ' + user + ' has no access to map ' + mapID);
        });
    };

    _MapSchema.methods.calculateDiff = function() {
        var Workspace = require('./workspace-schema')(conn);
        var mapID = this._id;
        var _this = this;
        return _this.populate({
            path: 'nodes',
            model: 'Node',
            populate : {
              path: 'previous',
              model: 'Node'
            }
        }).populate({
            path: 'previous',
            model: 'WardleyMap',
            populate : {
                path: 'nodes',
                model: 'Node'
            }
        }).execPopulate()
        .then(function(map){
          let added = [];
          for (let i = 0; i < map.nodes.length; i++) {
            if (!map.nodes[i].previous) {
              added.push({_id : map.nodes[i]._id});
            }
          }
          // console.log('added', added);

          let modified = [];
          let hasCounterpart = {};
          for (let i = 0; i < map.nodes.length; i++) {
            let differs = false;
            let diff = {};
            let currentNode = map.nodes[i];
            let previousNode = currentNode.previous;
            if(!previousNode){
              continue;
            }
            if (currentNode.name !== previousNode.name){
              differs = true;
              diff.name = {
                old : previousNode.name,
                new : currentNode.name
              };
            }
            if (currentNode.type !== previousNode.type){
              differs = true;
              diff.type = {
                old : previousNode.type,
                new : currentNode.type
              };
            }
            if (currentNode.x !== previousNode.x){
              differs = true;
              diff.x = {
                old : previousNode.x,
                new : currentNode.x
              };
            }
            if(differs){
              modified.push({
                  _id : currentNode._id, diff: diff
              });
            }
            hasCounterpart[previousNode._id] = true;
          }

          // console.log('modified', modified);

          let removed = [];
          let previousMap = map.previous;
          // console.log(hasCounterpart);
          if (previousMap) {
            for (let i = 0; i < previousMap.nodes.length; i++) {
              let candidateNode = previousMap.nodes[i];
              if (!hasCounterpart[candidateNode._id]) {
                removed.push(candidateNode); // add full removed node as we want to show where it was);
              }
            }
          }
          // console.log('removed', removed);

          return {
            removed : removed,
            added : added,
            modified : modified
          };
        });
    };


    _MapSchema.methods.getRelevantVariants = function() {
      return this.populate({
          path: 'previous',
          model: 'WardleyMap',
          populate: {
            path: 'next',
            model: 'WardleyMap'
          }
        }).populate({
          path: 'workspace',
          model: 'Workspace'
        }).populate({
            path: 'next',
            model: 'WardleyMap'
        }).execPopulate()
        .then(function(populatedMap) {
          let result = {
              past : null,
              alternatives : [],
              futures : []
          };

          let previousMap = populatedMap.previous;
          let alternativeMaps = [];
          let futureMaps = populatedMap.next;

          if (previousMap) {
            for (let i = 0; i < previousMap.next.length; i++) {
              if (!populatedMap._id.equals(previousMap.next[i]._id)) {
                alternativeMaps.push(previousMap.next[i]);
              }
            }
          }

          for (let i = 0; i < populatedMap.workspace.timeline.length; i++) {
            let timeSlice = populatedMap.workspace.timeline[i];
            // find alternatives maps
            for (let j = 0; j < alternativeMaps.length; j++) {
              if (timeSlice._id.equals(alternativeMaps[j].timesliceId)) {
                result.alternatives.push({
                  name: timeSlice.name,
                  mapId: alternativeMaps[j]._id
                });
              }
            }
            // find future maps
            for (let j = 0; j < futureMaps.length; j++) {
              if (timeSlice._id.equals(futureMaps[j].timesliceId)) {
                result.futures.push({
                  name: timeSlice.name,
                  mapId: futureMaps[j]._id
                });
              }
            }
            // find ancestor
            if (previousMap && timeSlice._id.equals(previousMap.timesliceId)) {
              result.past = {
                name: timeSlice.name,
                mapId: previousMap._id
              };
            }
          }
          return result;
        });
    };

    _MapSchema.methods.newBody = function(body) {
        _.extend(this, body);
        _.extend(this.archived, false);

        return this.save();
    };

    _MapSchema.methods.addNode = function(name, x, y, type, workspace, description, inertia, responsiblePerson, constraint) {
        var Node = require('./node-schema')(conn);

        var _this = this;

        return new Node({
                name: name,
                x: x,
                y: y,
                type: type,
                workspace: workspace,
                parentMap: _this._id,
                description: description,
                inertia: inertia,
                responsiblePerson: responsiblePerson,
                constraint : constraint
            }).save()
            .then(function(node) {
                _this.nodes.push(node._id);
                return _this.save();
            })
            .then(function(savedWardleyMap) {
                return savedWardleyMap.populate({
                    path: 'nodes',
                    model: 'Node',
                    populate : {
                      path: 'previous',
                      model: 'Node'
                    }
                }).execPopulate();
            });
    };

    _MapSchema.methods.changeNode = function(name, x, y, type, desiredNodeId, description, inertia, responsiblePerson, constraint) {
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
                if (constraint !== null && constraint !== undefined) {
                    node.constraint = constraint;
                }
                return q.allSettled([node.save(), _this.populate({
                    path: 'nodes',
                    model: 'Node',
                    populate : {
                      path: 'previous',
                      model: 'Node'
                    }
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
                    model: 'Node',
                    populate : {
                      path: 'previous',
                      model: 'Node'
                    }
                }).execPopulate()]);
            });
    };

    _MapSchema.methods.formJSON = function() {
        var WardleyMap = require('./map-schema')(conn);
        return WardleyMap
            .findOne({
                _id: this._id
            })
            .populate({
                path: 'nodes',
                model: 'Node',
                populate : {
                  path: 'previous',
                  model: 'Node'
                }
            })
            .exec();
    };

    _MapSchema.methods.getAvailableSubmaps = function() {
      var WardleyMap = require('./map-schema')(conn);
      var _this = this;
      return WardleyMap.find({
        workspace: _this.workspace,
        archived: false,
        timesliceId: _this.timesliceId,
        isSubmap: true
      }).exec();
    };

    _MapSchema.methods.getSubmapUsage = function() {
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);
      var _this = this;

      return Node.find({
          type: 'SUBMAP',
          submapID: _this._id
        }).select('parentMap').exec()
        .then(function(listOfNodes) {
          var ids = [];
          listOfNodes.forEach(item => ids.push(item.parentMap));
          return ids;
        })
        .then(function(listOfMapIds) {
          return WardleyMap
            .find({
              archived: false,
              _id: {
                $in: listOfMapIds
              },
              workspace: _this.workspace
            })
            .populate('nodes')
            .select('name user purpose _id')
            .exec();
        });
    };

    _MapSchema.methods.formASubmap = function(params) {
        var WardleyMap = require('./map-schema')(conn);
        var Node = require('./node-schema')(conn);
        var _this = this;

        if(!_this.populated('workspace')){
          throw new Error('this map must have populated workspace before forming a submap');
        }

        //create structures
        var submapID = new ObjectId();
        var submap = new WardleyMap({
            _id: submapID,
            name: params.submapName,
            isSubmap: true,
            workspace: _this.workspace,
            timesliceId: _this.timesliceId,
            archived: false,
            responsiblePerson: params.responsiblePerson
        });

        var submapNodeID = new ObjectId();
        var submapNode = new Node({
            _id: submapNodeID,
            name: params.submapName,
            workspace: _this.workspace,
            parentMap: _this,
            type: 'SUBMAP',
            submapID: submapID
        });

        var promises = [];
        promises.push(_this.workspace.insertMapIdAt(submap, _this.timesliceId));
        _this.nodes.push(submapNode);

        // at this point we have placeholders for the submap and the new node
        // all properly plugged in  into the workspace and parent map


        // move comments
        // iterate over existing comments, and if on the list to transfer, do the transfer
        // position is not affected
        for (var ii = _this.comments.length - 1; ii > -1; ii--) {
            for (var jj = 0; jj < params.listOfCommentsToSubmap.length; jj++) {
                if (params.listOfCommentsToSubmap[jj] === '' + _this.comments[ii]._id) {
                    submap.comments.push(_this.comments.splice(ii, 1)[0]);
                }
            }
        }

        // the most wicked part of code
        // move nodes and fix connections
        var nodesToSave = [];
        var transferredNodes = [];

        for (var i = _this.nodes.length - 1; i >= 0; i--) {
            var index = params.listOfNodesToSubmap.indexOf('' + _this.nodes[i]._id);
            if (index === -1) { // node not on the list to transfer
                var notTransferredNode = _this.nodes[i];
                // if a node from the parent map depends on a node just transfered to the submap
                // it is necessary to replace that dependency
                for (var j = notTransferredNode.outboundDependencies.length - 1; j >= 0; j--) {
                    if (params.listOfNodesToSubmap.indexOf('' + notTransferredNode.outboundDependencies[j]) > -1) {
                        notTransferredNode.outboundDependencies.set(j, submapNode);
                        // transfer the info about the connection

                        notTransferredNode.transferDependencyData(notTransferredNode.outboundDependencies[j], submapNodeID);

                        nodesToSave.push(notTransferredNode);
                    }
                }

                // if a transferred node depends on non-transfered
                // make the submap node depend on non-transfered
                for (var jjj = notTransferredNode.inboundDependencies.length - 1; jjj >= 0; jjj--) {
                    if (params.listOfNodesToSubmap.indexOf('' + notTransferredNode.inboundDependencies[jjj]) > -1) {
                        notTransferredNode.inboundDependencies.set(jjj, submapNode);

                        // transfer the info about the connection
                        notTransferredNode.transferDependencyData(notTransferredNode.inboundDependencies[jjj], submapNodeID);

                        nodesToSave.push(notTransferredNode);
                    }
                }
            } else {

                var transferredNode = _this.nodes.splice(i, 1)[0];
                transferredNode.parentMap = submap; // transfer the node
                submap.nodes.push(transferredNode);
                transferredNodes.push(transferredNode);

                // if a transfered node depends on a non-transferred node
                for (var k = transferredNode.outboundDependencies.length - 1; k >= 0; k--) {
                    if (params.listOfNodesToSubmap.indexOf('' + transferredNode.outboundDependencies[k]) === -1) {
                        var dependencyAlreadyEstablished = false;
                        submapNode.outboundDependencies.push(transferredNode.outboundDependencies[k]); // the submap node will replace the transfered node

                        // transfer the info about the connection, both must be saved later
                        submapNode.stealDependencyData(transferredNode, transferredNode.outboundDependencies[k]);

                        transferredNode.outboundDependencies.splice(k, 1); // and the node will loose that connection
                    }
                }

                // if a transfered node is required by non-transfered node
                for (var kk = transferredNode.inboundDependencies.length - 1; kk >= 0; kk--) {
                    if (params.listOfNodesToSubmap.indexOf('' + transferredNode.inboundDependencies[kk]) === -1) {
                        submapNode.inboundDependencies.push(transferredNode.inboundDependencies[kk]);

                        // steal the info about the connection, both must be saved later
                        submapNode.stealDependencyData(transferredNode, transferredNode.inboundDependencies[kk]);

                        transferredNode.inboundDependencies.splice(kk, 1);
                    }
                }
            }
        }

        // calculate position of the submap node
        submapNode.x = params.coords ? params.coords.x : calculateMean(transferredNodes, 'x');
        submapNode.y = params.coords ? params.coords.y : calculateMean(transferredNodes, 'y');

        removeDuplicatesDependencies(nodesToSave);

        var totalNodesToSave = nodesToSave.concat(transferredNodes);

        for (var z = 0; z < totalNodesToSave.length; z++) {
            promises.push(totalNodesToSave[z].save());
        }

        removeDuplicatesDependencies([submapNode]);
        promises.push(submapNode.save());
        promises.push(submap.save());
        promises.push(_this.save());
        return q.allSettled(promises).then(function(results){
          return results[results.length-1].value;
        });
    };

    /*
    * This method is to clean up the state after removing a map, that is:
    *  - remove nodes belonging to the map
    *  - remove all references if removing a map that is a submap
    * TODO: if map is being saved, ensure the workspace has the timeslice existing
    */
    _MapSchema.pre('save', function(next) {
      modelLogger.trace('pre save on', this._id, this.archived, this.nodes.length);
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
        promises.push(
          Node.findById(this.nodes[i]._id || this.nodes[i]).exec().then(function(node) {
            if(node){
                return node.remove();
            }
          }));
      }

      var WardleyMap = require('./map-schema')(conn);
      var _this = this;
      if (this.previous) {
        promises.push(WardleyMap.findOne({
            _id: _this.previous
          }).exec()
          .then(function(map) {
            map.next.pull(_this._id);
            return map.save();
          }));
      }
      if (this.next && this.next.length > 0) {
        for (let i = 0; i < this.next.length; i++) {
          promises.push(WardleyMap.findOne({
              _id: _this.next[i]
            }).exec()
            .then(function(map) {
              map.previous = null;
              return map.save();
            }));
        }
      }

      // if we are not a submap, then this is the end
      if (!this.isSubmap) {
        return q.allSettled(promises).then(function(r) {
          next();
        });
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
