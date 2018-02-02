/* Copyright 2017, 2018  Krzysztof Daniel.
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
var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;
var deduplicationLogger = require('./../../log').getLogger('deduplication');
var variantLogger = require('./../../log').getLogger('variants');
let mapImport = require('./map-import-export').mapImport;
let getId = require('../../util/util.js').getId;
let formASubmap = require('./workspace/submap-routines').formASubmap;


/**
 * Workspace, referred also as an organization, is a group of maps that all
 * refer to the same subject, for example to the company. Many people can work
 * on maps within a workspace, and they all have identical access rights.
 */
var workspace = {};

function migrator(doc){
  if (!doc.schemaVersion) {
    doc.schemaVersion = 1;
    doc.timeline = [{
      name: 'Now',
      description: 'Happening right now',
      current : true,
      maps: doc._doc.maps,
      capabilityCategories : doc._doc.capabilityCategories
    }];
    delete doc._doc.maps;
    delete doc.maps;
    delete doc._doc.capabilityCategories;
    delete doc.capabilityCategories;
  }
}

module.exports = function(conn) {

    if (workspace[conn.name]) {
        return workspace[conn.name];
    }
    var History = require('./history-schema')(conn);
    var workspaceSchema = new Schema({
        name : String,
        purpose : String,
        description : String,
        owner : [ {
            type : String
        } ],
        status : {
          type: String,
          enum: ['EXISTING', 'DELETED'],
          default: 'EXISTING',
          required: true
        },
        nodes : [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }],
        maps: [{
          type: Schema.Types.ObjectId,
          ref: 'WardleyMap'
        }],
        schemaVersion : {
          required: true,
          type: Number,
          default : 5
        }
    });

    // always update the schema to the latest possible version
    workspaceSchema.post('init', migrator);

    workspaceSchema.statics.initWorkspace = function(name, description, purpose, owner) {
        if (!name) {
            name = "Unnamed";
        }
        if (!description) {
            description = "I am too lazy to fill this field even when I know it causes organizational mess";
        }
        if (!purpose) {
            purpose = "Just playing around.";
        }

        var Workspace = require('./workspace-schema')(conn);
        var wkspc = new Workspace({
          name: name,
          description: description,
          purpose: purpose,
          owner: [owner]
        });
        return wkspc.save().then(function(workspace) {
          History.log(getId(workspace), owner, null, null, [
            ['status', 'SET', 'EXISTING', null],
            ['name', 'SET', name, null],
            ['description', 'SET', description, null],
            ['purpose', 'SET', purpose, null]
          ]);
          return workspace;
        });
    };

    workspaceSchema.methods.update = function(user, name, description, purpose){
      let entries = [];
      if(name){
        this.name = name;
        entries.push(['name', 'SET', name, null]);
      }
      if(description){
        this.description = description;
        entries.push(['description', 'SET', description, null]);
      }
      if(purpose){
        this.purpose = purpose;
        entries.push(['purpose', 'SET', purpose, null]);
      }
      if(entries.length > 0){
        History.log(getId(this), user, null, null, entries);
      }
      return this.save();
    };

    workspaceSchema.methods.delete = function(user) {
      this.status = 'DELETED';
      History.log(getId(this), user, null, null, [
        ['status', 'SET', 'DELETED', null]
      ]);
      return this.save();
    };

    workspaceSchema.methods.addEditor = function(user, editorEmail){
      this.owner.push(editorEmail);
      History.log(getId(this), user, null, null, [
        ['owner', 'ADD', editorEmail, null]
      ]);
      return this.save();
    };

    workspaceSchema.methods.removeEditor = function(user, editorEmail){
      if (user === editorEmail) {
          throw new Error('Cannot delete self');
      }
      this.owner.pull(editorEmail);
      History.log(getId(this), user, null, null, [
        ['owner', 'REMOVE', editorEmail, null]
      ]);
      return this.save();
    };

    workspaceSchema.methods.insertMapId = function(mapId, actor, name) {
        var WardleyMap = require('./map-schema')(conn);
        var Workspace = require('./workspace-schema')(conn);
        this.maps.push(mapId);
        History.log(getId(this), actor, [getId(mapId)], null, [
          ['maps', 'ADD', mapId, null],
          ['map.name', 'SET', name, null]
        ]);
        return this.save();
    };


    workspaceSchema.methods.createAMap = function(params, isSubmap) {
      var WardleyMap = require('./map-schema')(conn);
      var Workspace = require('./workspace-schema')(conn);

      if (!params.name) {
        params.name = "I am too lazy to set the map title. I prefer getting lost.";
      }
      var newId = new ObjectId();
      return this.insertMapId(newId, params.actor, params.name)
        .then(function(workspace) {
          return new WardleyMap({
            name: params.name,
            workspace: workspace._id,
            responsiblePerson: params.responsiblePerson,
            isSubmap : isSubmap || false,
            _id: newId,
          }).save();
        });
    };

    workspaceSchema.methods.deleteAMap = function(mapId, actor) {
      const Node = require('./node-schema')(conn);
      const Workspace = require('./workspace-schema')(conn);
      mapId = getId(mapId);
      let workspaceId = getId(this._id);
      let _this = this;
      // Remove (in a soft way, dereference) nodes belonging to this map
      // this includes
      //  - parentMap
      //  - all dependencies belonging to the map
      //  - remove the map itself
      //  - remove unreferenced nodes
      //  - reload the workspace
      // This is very similar to how the map-schema#removeNode method works,
      // except we are dealing with multiple nodes
      // TODO: one day - make this *one* method


      return Node.update({
        // parentMap: mapId,
        'dependencies.visibleOn': mapId
      }, {
        $pull : {
          'dependencies.$.visibleOn' : ''+mapId
        }
      }, {
        safe: true,
        multi: true
      }).exec()
        /*after a map will have been deleted, NO node can be visible on that map*/
        .then(function(irrelevant){
          return Node.update({
              parentMap: mapId
            }, {
              $pull: {
                parentMap: mapId,
                visibility: {
                  map: mapId
                }
              }
            }, {
              safe: true,
              multi: true
            }).exec();
        })
        .then(function(irrelevant) {
          // console.log('irrelevant', irrelevant);
          // at this point some nodes might not have a parent map, and they should be removed.
          // let's find them
          return Node.find({
            parentMap: {
              $size: 0
            }
          }).exec();
        })
        .then(function(listOfNodesToRemove) {
          // console.log('Nodes without parents', listOfNodesToRemove);
          // nothing to remove, quit
          if (listOfNodesToRemove.length === 0) {
            return;
          }
          // drop them from the workspace
          return Workspace.findOneAndUpdate({
              _id: workspaceId,
              'nodes' : {
                $in: listOfNodesToRemove
              }
            }, {
              $pull: {
                'nodes': {
                  $in: listOfNodesToRemove
                }
              }
            }, {
              safe: true,
              multi: true
            }).exec()
            .then(function(workspace) {
              // console.log('cleaned workspace', workspace, workspace.timeline[0].nodes);
              return Node.remove({
                _id: {
                  $in: listOfNodesToRemove
                }
              }).exec();
            }).then(function(){
              // remove dependencies pointing to  removed nodes
              return Node.update({
                'dependencies.target': {
                  $in: listOfNodesToRemove
                }
              },
              {
                $pull : {
                  'dependencies.$.target' : {
                    $in: listOfNodesToRemove
                  }
                }
              }
            ).exec();
            });
        })
        .then(function(irrelevant) {
          // console.log('nodes removed', irrelevant);
          return Workspace.findOneAndUpdate({
              'maps': mapId
          }, {
            $pull: {
              'maps': mapId
            }
          }, {
            safe:true,
            multi:true,
            new : true
          }).populate('maps').exec().then(function(result){
            History.log(workspaceId, actor, [getId(mapId)], null, [
              ['maps', 'REMOVE', mapId, null]
            ]);
            return result;
          });
        });
    };

    workspaceSchema.methods.importJSON = function(json){
      let Node = require('./node-schema')(conn);
      return mapImport(Node, this, json);
    };

    workspaceSchema.methods.findSuggestions = function(sourceTimeSliceId, mapId, suggestionText) {
      let Node = require('./node-schema')(conn);
      let WardleyMap = require('./map-schema')(conn);
      let suggestionsEngine = require('./workspace/workspacemethods.js');
      return q.allSettled([suggestionsEngine.findNodeSuggestions(this, Node, this.getTimeSlice(sourceTimeSliceId), mapId, suggestionText),
        suggestionsEngine.findSubmapSuggestions(this, WardleyMap, this.getTimeSlice(sourceTimeSliceId), suggestionText)
      ]).then(function(valueArray) {
        return {
          nodes: valueArray[0].value,
          submaps: valueArray[1].value
        };
      });
    };





    /* Tried as I might, I was not able to write this using only db queries */
    workspaceSchema.methods.assessSubmapImpact = function(nodeIdsToSubmap) {
      let Node = require('./node-schema')(conn);
      nodeIdsToSubmap = nodeIdsToSubmap.map(node => getId(node));

      // find out everything that depends on said nodes
      let nodesThatDependOnFutureSubmap = Node.distinct('_id', {
          'dependencies.target': {
            $in: nodeIdsToSubmap
          },
          '_id': {
            $not: {
              $in: nodeIdsToSubmap
            }
          }
        }).exec()
        .then(function(idnodes) {
          // console.log(nodeIdsToSubmap, idnodes);
          return Node.find({
            _id: {
              $in: idnodes
            }
          }).exec();
        });




      let nodesThatFutureSubmapDependsOn = Node.distinct('_id', {
          _id: {
            $in: nodeIdsToSubmap
          }
        }).exec()
        .then(function(idnodes) {
          return Node.find({
            _id: {
              $in: idnodes
            }
          }).exec();
        })
        .then(function(nodes) {
        // console.log(nodes);
        /*
         * Internal dependencies means situation where a node is not a leaf of the submap,
         * but it has an external dependency that will not be covered by a map.
         * In such a case, the dependency will be removed from that node, and added
         * as a submap dependency. This is, however, a massive ingeretion in
         * the structure of nodes, so we have to at least identify this upfront,
         * and show the user.
         */
        let outgoingDanglingDependencies = [];

        /*
         * Leaves dependencies that are naturally transformed into a submap
         * dependencies. This, however, will have impact on maps containing them,
         * especially IF those dependencies are not visible on every map.
         */
        let outgoingDependencies = [];

        let inSubmapDependencies = [];

        for(let i = 0; i < nodes.length; i++){
          let analysedNode = nodes[i];
          // console.log(analysedNode.name);
          let analysedNodeDependencies = analysedNode.dependencies;
          let tempDanglingDep = {
            node : analysedNode,
            deps : []
          };
          let tempDep = {
            node : analysedNode,
            deps : []
          };
          let inSubmapDep = {
            node : analysedNode,
            deps: []
          };


          /* first pass - look for internal dependencies.
           * and store them, they will not be processed anymore,
           * and we will identify nodes with inmap dependencies */
          let hasInternalDependencies = false;
          for(let j = 0; j < analysedNodeDependencies.length; j++){
            let singleDep = analysedNodeDependencies[j];
            // console.log(singleDep);
            if(nodeIdsToSubmap.find(getId(singleDep.target).equals.bind(getId(singleDep.target)))){
              // we have found dependency that will be inside the submap
              hasInternalDependencies = true;
              inSubmapDep.deps.push(singleDep);
            }
          }


          /* second pass - look for dependencies to other nodes,
           * some of those will be from leaves, some will be originating
           * from the middle of the chain */
           for(let j = 0; j < analysedNodeDependencies.length; j++){
             let singleDep = analysedNodeDependencies[j];
             // so, the dependency has to be to outside of submap
             if(!nodeIdsToSubmap.find(getId(singleDep.target).equals.bind(getId(singleDep.target)))){
               if(hasInternalDependencies){
                 // has internal depencies (in submap) and external (out submap)
                 tempDanglingDep.deps.push(singleDep);
               } else {
                 // has only out submap dependencies
                 tempDep.deps.push(singleDep);
               }
             }
           }

           //finally, determine what needs to be shown to the world
           if(tempDep.deps.length > 0){
             outgoingDependencies.push(tempDep);
           }
           if(tempDanglingDep.deps.length > 0){
             outgoingDanglingDependencies.push(tempDanglingDep);
           }
           if(inSubmapDep.deps.length > 0){
             inSubmapDependencies.push(inSubmapDep);
           }
        }
        let finalResponse =  {
          outgoingDependencies : outgoingDependencies,
          outgoingDanglingDependencies : outgoingDanglingDependencies,
          inSubmapDependencies : inSubmapDependencies
        };
        return finalResponse;
      });

      return q.allSettled([nodesThatDependOnFutureSubmap, nodesThatFutureSubmapDependsOn]).then(function(result) {
        // console.log(nodesThatDependOnFutureSubmap);
        let finalAnalysis = result[1].value;
        finalAnalysis.nodesThatDependOnFutureSubmap = result[0].value;
        return finalAnalysis;
      });
    };

    workspaceSchema.methods.formASubmap = function(mapId, name, responsiblePerson, nodeIdsToSubmap) {
      let WardleyMap = require('./map-schema')(conn);
      let Node = require('./node-schema')(conn);
      let Workspace = require('./workspace-schema')(conn);
      let _this = this;
      nodeIdsToSubmap = nodeIdsToSubmap.map(id => getId(id));

      let mainAffectedMap = getId(mapId);

      return this.assessSubmapImpact(nodeIdsToSubmap)
        .then(function(impact) {
          // identify public
          return formASubmap({
            Node: Node,
            Workspace: Workspace,
            WardleyMap: WardleyMap
          }, _this, mapId, name, responsiblePerson, nodeIdsToSubmap, impact);
        });
    };


    workspaceSchema.methods.referenceASubmapReference = function(mapId, submapId, evolution, visibility) {
      let WardleyMap = require('./map-schema')(conn);
      let Node = require('./node-schema')(conn);
      let Workspace = require('./workspace-schema')(conn);
      let _this = this;
      q.longStackSupport = true;

      return Node.findOne({
          submapID: submapId
        }).exec()
        .then(function(node) {
          return WardleyMap.findById(mapId).exec().then(function(wmap) {
            if (node) {
              return wmap.referenceNode(getId(node), visibility, null);
            }
            return WardleyMap.findById(submapId).exec().then(function(submap) {
              console.log(submap.name, evolution, visibility, 'SUBMAP', getId(_this), submap.description, /*inertia*/ 0, submap.responsiblePerson, /*constraint*/ 0, /*submap*/ getId(submapId));
              return wmap.__addNode(submap.name, evolution, visibility, 'SUBMAP', getId(_this), submap.description, /*inertia*/ 0, submap.responsiblePerson, /*constraint*/ 0, /*submap*/ getId(submapId));
            });
          });
        });
    };

    workspace[conn.name] = conn.model('Workspace', workspaceSchema);
    return workspace[conn.name];
};
module.exports.migrator = migrator;
