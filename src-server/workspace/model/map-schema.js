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
let mapExport = require('./map-import-export').mapExport;
let getId = require('../../util/util.js').getId;

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
    }
};



module.exports = function(conn) {

    if (wardleyMap[conn.name]) {
        return wardleyMap[conn.name];
    }
    /**
     * see capability-category-schema for explanations.
     */

    var _MapSchema = new Schema({
        name: Schema.Types.String,
        user: Schema.Types.String,//must be held until migration happens
        purpose: Schema.Types.String, //must be held until migration happens
        isSubmap: Schema.Types.Boolean,
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
        users : [{
            x: Schema.Types.Number,
            y: Schema.Types.Number,
            name : Schema.Types.String,
            description : Schema.Types.String,
            width : Schema.Types.Number,
            next : [Schema.Types.ObjectId],
            previous : Schema.Types.ObjectId,
            associatedNeeds : [{
                type: Schema.Types.ObjectId,
                ref: 'Node'
            }]
        }],
        comments: [{
            x: Schema.Types.Number,
            y: Schema.Types.Number,
            text: Schema.Types.String,
            width : Schema.Types.Number,
            next : [Schema.Types.ObjectId],
            previous : Schema.Types.ObjectId,
        }],
        responsiblePerson: Schema.Types.String,
        schemaVersion : {
          type: Schema.Types.Number,
          default : 2
        }
    });


    _MapSchema.methods.makeComment = function(data) {
        this.comments.push(data);
        return this.save();
    };

    _MapSchema.methods.defaultPopulate = function(){
        return this.populate("workspace nodes nodes.previous").execPopulate();
    };

    _MapSchema.methods.updateComment = function(id, dataPos) {
        for (var i = 0; i < this.comments.length; i++) {
            if ('' + this.comments[i]._id === id) {
                if (dataPos.x && dataPos.y) {
                    this.comments[i].set('x', dataPos.x);
                    this.comments[i].set('y', dataPos.y);
                }
                if (dataPos.text) {
                    this.comments[i].set('text', dataPos.text);
                }
                if (dataPos.width && Number.isInteger(Number.parseInt(dataPos.width))){
                  this.comments[i].set('width', dataPos.width);
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

    _MapSchema.methods.addUser = function(data) {
        this.users.push(data);
        return this.save();
    };

    _MapSchema.methods.updateUser = function(id, dataPos) {
        for (var i = 0; i < this.users.length; i++) {
            if ('' + this.users[i]._id === id) {
                if (dataPos.x && dataPos.y) {
                    this.users[i].set('x', dataPos.x);
                    this.users[i].set('y', dataPos.y);
                }
                if (dataPos.name) {
                    this.users[i].set('name', dataPos.name);
                }
                if (dataPos.description) {
                    this.users[i].set('description', dataPos.description);
                }
                if (dataPos.width && Number.isInteger(Number.parseInt(dataPos.width))){
                  this.users[i].set('width', dataPos.width);
                }
            }
        }
        return this.save();
    };

    _MapSchema.methods.deleteUser = function(seq) {
        for (var i = 0; i < this.users.length; i++) {
            if ('' + this.users[i]._id === seq) {
                this.users.splice(i, 1);
                break;
            }
        }
        this.markModified('users');
        return this.save();
    };

    _MapSchema.methods.makeUserDepTo = function(user, node) {
      if (!user || !node) {
        throw new Error('unspecified attributes');
      }
      for (let i = 0; i < this.users.length; i++) {
        if ('' + this.users[i]._id === user) {
          let selectedUser = this.users[i];
          let found = false;
          for (let j = 0; j < selectedUser.associatedNeeds.length; j++) {
            if ('' + selectedUser.associatedNeeds[j] === node) {
              found = true;
              break;
            }
          }
          if (!found) {
            selectedUser.associatedNeeds.push(new ObjectId(node));
          }
          break;
        }
      }
      this.markModified('users');
      return this.save();
    };

    _MapSchema.methods.deleteUserDepTo = function(user, node) {
      if (!user || !node) {
        throw new Error('unspecified attributes');
      }
      for (let i = 0; i < this.users.length; i++) {
        if ('' + this.users[i]._id === user) {
          let selectedUser = this.users[i];
          for (let j = 0; j < selectedUser.associatedNeeds.length; j++) {
            if ('' + selectedUser.associatedNeeds[j] === node) {
              selectedUser.associatedNeeds.splice(j,1);
              break;
            }
          }
          break;
        }
      }
      this.markModified('users');
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
            } else {
              return null;
            }
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
          let usersAdded = [];
          for (let i = 0; i < map.users.length; i++) {
            if (!map.users[i].previous) {
              usersAdded.push({_id : map.users[i]._id});
            }
          }
          let usersRemoved = [];
          if (previousMap) {
            for (let i = 0; i < previousMap.users.length; i++) {
              let candidateUser = previousMap.users[i];
              let foundCounterPart = false; // counter part means that an old map has a user that next is set to a user in a new map.
              // simplest way to check.... go through a list of users in current map and check whether any references back
              for (let j = 0; j < map.users.length; j++) {
                if ('' + candidateUser._id === '' + map.users[j].previous) {
                  foundCounterPart = true;
                  break;
                }
              }
              if (!foundCounterPart) {
                usersRemoved.push(candidateUser); // add full removed user as we want to show where it was);
              }
            }
          }
          return {
            nodesRemoved : removed,
            nodesAdded : added,
            nodesModified : modified,
            usersAdded : usersAdded,
            usersRemoved: usersRemoved
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

    //TODO : refactor this into something changing map explicitly (name, purpose, etc);
    _MapSchema.methods.newBody = function(body) {
        _.extend(this, body);

        return this.save();
    };

    _MapSchema.methods.addNode = function(name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint) {
        const Node = require('./node-schema')(conn);
        const Workspace = require('./workspace-schema')(conn);

        const _this = this;
        const timeSliceId = _this.timesliceId;

        return new Node({
                name: name,
                evolution: evolution,
                visibility: [{
                  value : visibility,
                  map: [_this._id]
                }],
                type: type,
                workspace: workspaceId,
                parentMap: [_this._id],
                description: description,
                inertia: inertia,
                responsiblePerson: responsiblePerson,
                constraint : constraint
            })
            .save()
            .then(function(node) {
              return Workspace
                .findOneAndUpdate({
                  _id: workspaceId,
                  'timeline._id': timeSliceId
                }, {
                  $push: {
                    'timeline.$.nodes': node._id
                  }
                }, {
                  select: {
                    'timeline': {
                      $elemMatch: {
                        _id: timeSliceId
                      }
                    }
                  }
                })
                .exec()
                .then(function(res) {
                  return node;
                });
            })
            .then(function(node) {
                _this.nodes.push(node._id);
                return _this.save();
            });
    };

    _MapSchema.methods.referenceNode = function(nodeId, visibility, dependencies) {
      const Node = require('./node-schema')(conn);
      const Workspace = require('./workspace-schema')(conn);

      const _this = this;
      const timeSliceId = _this.timesliceId;

      nodeId = getId(nodeId);

      return Node.findOneAndUpdate({
          _id: nodeId
        }, {
          $addToSet: {
            visibility: {
              value: visibility,
              map: _this._id
            },
            parentMap: _this._id
          }
        }).exec()
        .then(function(node) {
          _this.nodes.push(node._id);
          return _this.save();
        });
    };

    _MapSchema.methods.changeNode = function(name, evolution, visibility, width, type, desiredNodeId, description, inertia, responsiblePerson, constraint) {
      var _this = this;
      var Node = require('./node-schema')(conn);
      const WardleyMap = require('./map-schema')(conn);

      desiredNodeId = getId(desiredNodeId);
      let query = {
        _id: desiredNodeId
      };
      let updateOrder = {
        $set: {

        }
      };
      let select = {};

      if (name) {
        updateOrder.$set.name = name;
      }
      if (evolution) {
        updateOrder.$set.evolution = evolution;
      }
      if (width) {
        updateOrder.$set.width = width;
      }
      if (type) {
        updateOrder.$set.type = type;
      }
      if (description) {
        updateOrder.$set.description = description;
      }
      if (inertia) {
        updateOrder.$set.inertia = inertia;
      }
      if (responsiblePerson) {
        updateOrder.$set.responsiblePerson = responsiblePerson;
      }
      if (constraint) {
        updateOrder.$set.constraint = constraint;
      }
      if (visibility) {
        /**
         * First of all, we are updating a single entry in the array,
         * so we must do the search for the array object, otherwise the $
         * operator will not work.
         */
        query['visibility.map'] = _this._id;

        /**
         * Now, let's set the value for all visibility parameters. It's a very
         * broad operator, so in the next step we will narrow it down.
         */
        updateOrder.$set['visibility.$.value'] = visibility;
        /**
         * Ensure that only one visibility entry is selected for the change.
         */
        select = {
          select: {
            'visibility': {
              $elemMatch: {
                map: _this._id //visiblity should be changed only for current map
              }
            }
          }
        };
      }

      return Node.findOneAndUpdate(query,
        updateOrder,
        select
      ).exec().then(function(){
        return WardleyMap.findById(_this._id);
      });
    };

    /**
     * Removes the node from the current map. If it was a last reference,
     * it removes the node from the workspace.
     */
    _MapSchema.methods.removeNode = function(nodeId) {
      var _this = this;
      nodeId = getId(nodeId);
      let mapId = getId(_this);
      const Workspace = require('./workspace-schema')(conn);
      const Node = require('./node-schema')(conn);


      // first, clean up users depending on a removed node (within map only)
      for (let i = 0; i < this.users.length; i++) {
        let selectedUser = this.users[i];
        for (let j = selectedUser.associatedNeeds.length - 1; j >= 0; j--) {
          if ('' + selectedUser.associatedNeeds[j] === '' + nodeId) {
            selectedUser.associatedNeeds.splice(j, 1);
            this.markModified('users');
          }
        }
      }

      // secondly, remove the node from the list of nodes of the current map
      for (let i = 0; i < this.nodes.length; i++) {
        if (getId(this.nodes[i]).equals(nodeId)) {
          this.nodes.splice(i, 1);
          break;
        }
      }

      // fourthly, node prev & next TODO: think about how it should be handled

      // thirdly, handle other nodes depending on this one (if there are any)
      return Node.update({
          parentMap: mapId,
          'dependencies.target': nodeId,
          'dependencies.visibleOn': mapId
        }, {
          $pull: {
            dependencies: {
              target: nodeId,
              visibleOn: mapId
            }
          }
        }, {
          safe: true
        }).exec()
        .then(function() {
          //fifthly, remove parent map (node has been removed from it, so reference is no longer mandatory)
          return Node.findOneAndUpdate({
            _id: nodeId
          }, {
            $pull: {
              parentMap: _this._id,
              visibility: {
                map: _this._id
              }
            }
          }, {
            safe: true,
            new: true //return modified doc
          }).exec();
        }).then(function(node) {
          // here, the node has been updated and no longer points to the parent map
          // or the workspace

          // it is, however, necessary, to remove the node if it has no parent map
          // as it is no longer referenced by any of those
          return Node.findOneAndRemove({
            _id: nodeId,
            parentMap: {
              $size: 0
            }
          }).exec();
        }).then(function(removedNode) {
          if (!removedNode) {
            // node has not been removed, meaning something else is using it,
            // so it has to stay in the workspace
            return null;
          }
          //otherwise, remove it from the workspace
          return Workspace.findOneAndUpdate({
            _id: _this.workspace,
            'timeline.nodes': nodeId
          }, {
            $pull: {
              'timeline.$.nodes': nodeId
            }
          }, {
            safe: true,
            new: true //return modified doc
          }).exec();
        }).then(function(modifiedWorkspace) {
          //save the map
          return _this.save();
        });
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
            .select('name _id isSubmap')
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
            responsiblePerson: params.responsiblePerson,
            previous : null,
            next : []
        });

        var submapNodeID = new ObjectId();
        var submapNode = new Node({
            _id: submapNodeID,
            name: params.submapName,
            workspace: _this.workspace,
            parentMap: _this,
            type: 'SUBMAP',
            submapID: submapID,
            next : [],
            previous : null
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

                        notTransferredNode.moveDependencyData(notTransferredNode.outboundDependencies[j], submapNodeID);

                        nodesToSave.push(notTransferredNode);
                    }
                }

                // if a transferred node depends on non-transfered
                // make the submap node depend on non-transfered
                for (var jjj = notTransferredNode.inboundDependencies.length - 1; jjj >= 0; jjj--) {
                    if (params.listOfNodesToSubmap.indexOf('' + notTransferredNode.inboundDependencies[jjj]) > -1) {
                        notTransferredNode.inboundDependencies.set(jjj, submapNode);

                        // transfer the info about the connection
                        notTransferredNode.moveDependencyData(notTransferredNode.inboundDependencies[jjj], submapNodeID);

                        nodesToSave.push(notTransferredNode);
                    }
                }
            } else {

                var transferredNode = _this.nodes.splice(i, 1)[0];
                transferredNode.parentMap = submap._id; // transfer the node
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


    _MapSchema.methods.exportJSON = function(){
      return mapExport(this);
    };

    wardleyMap[conn.name] = conn.model('WardleyMap', _MapSchema);
    return wardleyMap[conn.name];
};
