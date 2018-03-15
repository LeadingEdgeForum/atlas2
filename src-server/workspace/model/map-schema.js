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
        users : [{
            x: Schema.Types.Number,
            y: Schema.Types.Number,
            name : Schema.Types.String,
            description : Schema.Types.String,
            width : Schema.Types.Number,
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
        }],
        responsiblePerson: Schema.Types.String,
        status : {
          type: String,
          enum: ['EXISTING', 'DELETED'],
          default: 'EXISTING',
          required: true
        },
        schemaVersion : {
          type: Schema.Types.Number,
          default : 2
        }
    }, {
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    });
    var History = require('./history-schema')(conn);

    _MapSchema.virtual('nodes', {
      ref : 'Node',
      localField : '_id',
      foreignField : 'parentMap'
    });


    _MapSchema.methods.makeComment = function(data) {
        this.comments.push(data);
        return this.save();
    };

    _MapSchema.methods.defaultPopulate = function() {
      return this
        .populate("workspace")
        .populate({
          path: 'nodes',
          match: {
            status: 'EXISTING'
          }
        })
        .execPopulate();
    };

    // _MapSchema.methods.updateComment = function(id, dataPos) {
    //     for (var i = 0; i < this.comments.length; i++) {
    //         if ('' + this.comments[i]._id === id) {
    //             if (dataPos.x && dataPos.y) {
    //                 this.comments[i].set('x', dataPos.x);
    //                 this.comments[i].set('y', dataPos.y);
    //             }
    //             if (dataPos.text) {
    //                 this.comments[i].set('text', dataPos.text);
    //             }
    //             if (dataPos.width && Number.isInteger(Number.parseInt(dataPos.width))){
    //               this.comments[i].set('width', dataPos.width);
    //             }
    //         }
    //     }
    //     return this.save();
    // };
    //
    // _MapSchema.methods.deleteComment = function(seq) {
    //     for (var i = 0; i < this.comments.length; i++) {
    //         if ('' + this.comments[i]._id === seq) {
    //             this.comments.splice(i, 1);
    //             break;
    //         }
    //     }
    //     this.markModified('comments');
    //     return this.save();
    // };
    //
    // _MapSchema.methods.addUser = function(data) {
    //     this.users.push(data);
    //     return this.save();
    // };
    //
    // _MapSchema.methods.updateUser = function(id, dataPos) {
    //     for (var i = 0; i < this.users.length; i++) {
    //         if ('' + this.users[i]._id === id) {
    //             if (dataPos.x && dataPos.y) {
    //                 this.users[i].set('x', dataPos.x);
    //                 this.users[i].set('y', dataPos.y);
    //             }
    //             if (dataPos.name) {
    //                 this.users[i].set('name', dataPos.name);
    //             }
    //             if (dataPos.description) {
    //                 this.users[i].set('description', dataPos.description);
    //             }
    //             if (dataPos.width && Number.isInteger(Number.parseInt(dataPos.width))){
    //               this.users[i].set('width', dataPos.width);
    //             }
    //         }
    //     }
    //     return this.save();
    // };
    //
    // _MapSchema.methods.deleteUser = function(seq) {
    //     for (var i = 0; i < this.users.length; i++) {
    //         if ('' + this.users[i]._id === seq) {
    //             this.users.splice(i, 1);
    //             break;
    //         }
    //     }
    //     this.markModified('users');
    //     return this.save();
    // };
    //
    // _MapSchema.methods.makeUserDepTo = function(user, node) {
    //   if (!user || !node) {
    //     throw new Error('unspecified attributes');
    //   }
    //   for (let i = 0; i < this.users.length; i++) {
    //     if ('' + this.users[i]._id === user) {
    //       let selectedUser = this.users[i];
    //       let found = false;
    //       for (let j = 0; j < selectedUser.associatedNeeds.length; j++) {
    //         if ('' + selectedUser.associatedNeeds[j] === node) {
    //           found = true;
    //           break;
    //         }
    //       }
    //       if (!found) {
    //         selectedUser.associatedNeeds.push(new ObjectId(node));
    //       }
    //       break;
    //     }
    //   }
    //   this.markModified('users');
    //   return this.save();
    // };
    //
    // _MapSchema.methods.deleteUserDepTo = function(user, node) {
    //   if (!user || !node) {
    //     throw new Error('unspecified attributes');
    //   }
    //   for (let i = 0; i < this.users.length; i++) {
    //     if ('' + this.users[i]._id === user) {
    //       let selectedUser = this.users[i];
    //       for (let j = 0; j < selectedUser.associatedNeeds.length; j++) {
    //         if ('' + selectedUser.associatedNeeds[j] === node) {
    //           selectedUser.associatedNeeds.splice(j,1);
    //           break;
    //         }
    //       }
    //       break;
    //     }
    //   }
    //   this.markModified('users');
    //   return this.save();
    // };

    _MapSchema.methods.verifyAccess = function(user) {
        var Workspace = require('./workspace-schema')(conn);
        var WardleyMap = require('./map-schema')(conn);
        var mapID = this._id;
        var _this = this;
        return Workspace.findOne({
            owner: user,
        }).exec().then(function(workspace) {
            return WardleyMap.findOne({
                _id: mapID,
                workspace: getId(workspace)
              }).exec()
              .then(function(map) {
                if (workspace) {
                    return _this; // if we found workspace, then we have access to the map
                } else {
                  return null;
                }
              });
        });
    };



    _MapSchema.methods.update = function(user, body) {
      //TODO: be a little bit more careful when isSubmap is switched to false.
      // what about nodes referencing this one?
      let entries = [];
      let name = body.name;
      if(name){
        this.name = name;
        entries.push(['name', 'SET', name, null]);
      }
      let responsiblePerson = body.responsiblePerson;
      if(responsiblePerson){
        this.responsiblePerson = responsiblePerson;
        entries.push(['responsiblePerson', 'SET', responsiblePerson, null]);
      }
      let isSubmap = body.isSubmap;
      if(isSubmap){
        this.isSubmap = isSubmap;
        entries.push(['isSubmap', 'SET', isSubmap, null]);
      }
      if(entries.length > 0){
        History.log(getId(this.workspace), user, [getId(this)], null, entries);
      }
      return this.save();
    };

    _MapSchema.methods.addNode = function(actor, name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint) {
      let _this = this;
      return _this.__addNode(actor, name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint, null).then(function() {
        return _this.populate({
                  path: 'nodes',
                  match: {status:'EXISTING'}
                }).execPopulate();
      });
    };

    _MapSchema.methods.duplicateNode = function(actor, duplicatedNodeId, name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint) {
      const Node = require('./node-schema')(conn);
      const Workspace = require('./workspace-schema')(conn);
      const Analysis = require('./analysis-schema')(conn);

      let _this = this;
      return Node.findById(duplicatedNodeId).exec()
        .then(function(duplicatedNode) {
          if (duplicatedNode.analysis) {
            return duplicatedNode.analysis;
          }
          return new Analysis({
            workspace: duplicatedNode.workspace
          }).save().then(function(analysis){
            duplicatedNode.analysis = analysis;
            return duplicatedNode.save().then(function(){
              return analysis;
            });
          });
        })
        .then(function(analysis) {
          console.log(analysis);
          return _this.__addNode(actor, name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint, null, getId(analysis)).then(function() {
            return _this.populate({
              path: 'nodes',
              match: {
                status: 'EXISTING'
              }
            }).execPopulate();
          });
        });
    };

    _MapSchema.methods.__addNode = function(actor, name, evolution, visibility, type, workspaceId, description, inertia, responsiblePerson, constraint, submap, analysis) {
        const Node = require('./node-schema')(conn);
        const Workspace = require('./workspace-schema')(conn);

        const _this = this;

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
                constraint : constraint,
                submapID : submap,
                status: 'EXISTING',
                analysis:analysis
            })
            .save()
            .then(function(node) {
              History.log(getId(_this.workspace), actor, [getId(_this)], [node._id], [
                ['nodes', 'ADD', getId(_this), null],
                ['node.name', 'SET', node.name, null]
              ]);
              return node;
            });
    };

    _MapSchema.methods.referenceNode = function(actor, nodeId, visibility, dependencies) {
      const Node = require('./node-schema')(conn);
      const Workspace = require('./workspace-schema')(conn);
      const WardleyMap = require('./map-schema')(conn);

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
        }, {
            safe: true,
            new: true
          }).exec()
        .then(function(node) {
          History.log(getId(node.workspace), actor, [getId(_this)], [node._id, nodeId], [
            ['node.dependencies', 'ADD', getId(nodeId), null],
          ]);
          return WardleyMap.findById(getId(_this)).populate({
            path: 'nodes',
            match: {
              status: 'EXISTING'
            }
          }).exec();
        });
    };

    _MapSchema.methods.changeNode = function(actor, workspaceId, name, evolution, visibility, width, type, desiredNodeId, description, inertia, responsiblePerson, constraint) {
      var _this = this;
      var Node = require('./node-schema')(conn);
      const WardleyMap = require('./map-schema')(conn);
      let changes = [];

      desiredNodeId = getId(desiredNodeId);
      let query = {
        _id: desiredNodeId,
        workspace: workspaceId
      };
      let updateOrder = {
        $set: {

        }
      };
      let select = {};

      if (name) {
        updateOrder.$set.name = name;
        changes.push(['node.name', 'SET', name, null]);
      }
      if (evolution) {
        updateOrder.$set.evolution = evolution;
        changes.push(['node.evolution', 'SET', evolution, null]);
      }
      if (width) {
        updateOrder.$set.width = width;
        changes.push(['node.width', 'SET', width, null]);
      }
      if (type) {
        updateOrder.$set.type = type;
        changes.push(['node.type', 'SET', type, null]);
      }
      if (description) {
        updateOrder.$set.description = description;
        changes.push(['node.description', 'SET', description, null]);
      }
      if (inertia) {
        updateOrder.$set.inertia = inertia;
        changes.push(['node.inertia', 'SET', inertia, null]);
      }
      if (responsiblePerson) {
        updateOrder.$set.responsiblePerson = responsiblePerson;
        changes.push(['node.responsiblePerson', 'SET', responsiblePerson, null]);
      }
      if (constraint) {
        updateOrder.$set.constraint = constraint;
        changes.push(['node.constraint', 'SET', constraint, null]);
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
        changes.push(['node.visibility', 'SET', visibility, null]);
      }

      return Node.findOneAndUpdate(query,
        updateOrder,
        select
      ).exec().then(function() {
        if (changes.length > 0) {
          History.log(workspaceId, actor, [getId(_this)], [desiredNodeId], changes);
        }
        return WardleyMap.findById(getId(_this)).populate({
          path: 'nodes',
          match: {
            status: 'EXISTING'
          }
        }).exec();
      });
      };

    /**
     * Removes the node from the current map. If it was a last reference,
     * it removes the node from the workspace.
     */
    _MapSchema.methods.removeNode = function(actor, nodeId) {
      var _this = this;
      nodeId = getId(nodeId);
      let mapId = getId(_this);
      const Workspace = require('./workspace-schema')(conn);
      const Node = require('./node-schema')(conn);


      // // first, clean up users depending on a removed node (within map only)
      // for (let i = 0; i < this.users.length; i++) {
      //   let selectedUser = this.users[i];
      //   for (let j = selectedUser.associatedNeeds.length - 1; j >= 0; j--) {
      //     if ('' + selectedUser.associatedNeeds[j] === '' + nodeId) {
      //       selectedUser.associatedNeeds.splice(j, 1);
      //       this.markModified('users');
      //     }
      //   }
      // }

      // fourthly, node prev & next TODO: think about how it should be handled

      // thirdly, handle other nodes depending on this one (if there are any)
      return Node.update({
          parentMap: mapId,
          workspace : _this.workspace,
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
        // and handle this node depending on others
        .then(function() {
          return Node.findById(nodeId).exec()
            .then(function(node) {
              for (let i = node.dependencies.length - 1; i >= 0; i--) {
                for (let j = node.dependencies[i].visibleOn.length; j >= 0; j--) {
                  if (mapId.equals(node.dependencies[i].visibleOn[j])) {
                    node.dependencies[i].visibleOn.splice(j, 1);
                    break;
                  }
                }
                if (node.dependencies[i].visibleOn.length === 0) {
                  //remove dependency that is nowhere visible
                  node.dependencies.splice(i, 1);
                  break;
                }
              }
              return node.save();
            });
        })
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
            'nodes': nodeId
          }, {
            $pull: {
              'nodes': nodeId
            }
          }, {
            safe: true,
            new: true //return modified doc
          }).exec();
        }).then(function(modifiedWorkspace) {
          //save the map
          History.log(getId(_this.workspace), actor, [getId(_this)], [nodeId], [
            ['map.nodes', 'REMOVE', getId(nodeId), null],
          ]);
          return _this.save().then(function(map){
            return map.populate({
              path: 'nodes',
              match: {
                status: 'EXISTING'
              }
            }).execPopulate();
          });
        });
    };


    _MapSchema.methods.exportJSON = function(){
      return mapExport(this);
    };

    wardleyMap[conn.name] = conn.model('WardleyMap', _MapSchema);
    return wardleyMap[conn.name];
};
