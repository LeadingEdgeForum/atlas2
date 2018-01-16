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
var q = require('q');
var ObjectId = mongoose.Types.ObjectId;
var String = Schema.Types.String;
var Boolean = Schema.Types.Boolean;
var Number = Schema.Types.Number;
var deduplicationLogger = require('./../../log').getLogger('deduplication');
var variantLogger = require('./../../log').getLogger('variants');
let mapImport = require('./map-import-export').mapImport;
let getId = require('../../util/util.js').getId;

/**
 * Workspace, referred also as an organization, is a group of maps that all
 * refer to the same subject, for example to the company. Many people can work
 * on maps within a workspace, and they all have identical access rights.
 */
var workspace = {};


var defaultCapabilityCategories = [
  { name:'Portfolio', capabilities : []},
  { name:'Customer Service', capabilities : []},
  { name:'Administrative', capabilities : []},
  { name:'Quality', capabilities : []},
  { name:'Operational', capabilities : []},
  { name:'Sales and Marketing', capabilities : []},
  { name:'Research', capabilities : []},
  { name:'Finances', capabilities : []}
];

function migrator(doc, fn){
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
  fn();
}

module.exports = function(conn) {

    if (workspace[conn.name]) {
        return workspace[conn.name];
    }

    var workspaceSchema = new Schema({
        name : String,
        purpose : String,
        description : String,
        owner : [ {
            type : String
        } ],
        archived : Boolean,
        timeline : [ {
            name: String,
            description : String,
            current : Boolean,
            maps: [{
              type: Schema.Types.ObjectId,
              ref: 'WardleyMap'
            }],
            nodes : [{
                type: Schema.Types.ObjectId,
                ref: 'Node'
            }],
            next : [{
              type: Schema.Types.ObjectId
            }],
            previous : {
              type: Schema.Types.ObjectId
            },
            capabilityCategories : [ {
              name : String,
              next : [{
                type: Schema.Types.ObjectId
              }],
              previous : {
                type: Schema.Types.ObjectId
              },
              capabilities : [ {
                aliases: [{
                  nodes: [{
                      type: Schema.Types.ObjectId,
                      ref: 'Node'
                  }],
                  next : [{
                    type: Schema.Types.ObjectId
                  }],
                  previous : {
                    type: Schema.Types.ObjectId
                  }
                }],
                marketreferences : [ {
                  name : String,
                  description : String,
                  evolution : Number,
                  next : [{
                    type: Schema.Types.ObjectId
                  }],
                  previous : {
                    type: Schema.Types.ObjectId
                  }
                }],
                next : [{
                  type: Schema.Types.ObjectId
                }],
                previous : {
                  type: Schema.Types.ObjectId
                }
              } ]
            } ]
          }
        ],
        schemaVersion : {
          type: Number,
          default : 3
        }
    });

    // always update the schema to the latest possible version
    workspaceSchema.post('init', migrator);

    workspaceSchema.virtual('nowId').get(function(){
      for(var i = 0; i < this.timeline.length; i++){
        if(this.timeline[i].current){
          return this.timeline[i]._id;
        }
      }
    });

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
            owner: [owner],
            archived: false,
            timeline : [{
              name : 'Now',
              description : 'Representation of current reality',
              current : true,
              maps : [],
              nodes : [],
              capabilityCategories : defaultCapabilityCategories
            }],
        });
        return wkspc.save();
    };

    workspaceSchema.methods.insertMapIdAt = function(mapId, timesliceId) {
        var WardleyMap = require('./map-schema')(conn);
        var Workspace = require('./workspace-schema')(conn);
        if(!timesliceId){
          timesliceId = this.nowId;
        }
        for(var i = 0; i < this.timeline.length; i++){
          if(this.timeline[i]._id.equals(timesliceId)){
            if(this.timeline[i].maps.indexOf(mapId) === -1){
              this.timeline[i].maps.push(mapId);
            }
            return this.save();
          }
        }
        throw new Error('Specified timeslice ' + timesliceId + ' is not present in workspace ' + this._id);
    };


    workspaceSchema.methods.createAMap = function(params, timesliceId) {
      var WardleyMap = require('./map-schema')(conn);
      var Workspace = require('./workspace-schema')(conn);

      if (!params.name) {
        params.user = "I am too lazy to set the map title. I prefer getting lost.";
      }
      var newId = new ObjectId();
      return this.insertMapIdAt(newId, timesliceId)
        .then(function(workspace) {
          return new WardleyMap({
            name: params.name,
            workspace: workspace._id,
            archived: false,
            timesliceId : timesliceId ? new ObjectId(timesliceId) : workspace.nowId,
            responsiblePerson: params.responsiblePerson,
            _id: newId,
          }).save();
        });
    };

    workspaceSchema.methods.deleteAMap = function(mapId) {
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
              'timeline.nodes' : {
                $in: listOfNodesToRemove
              }
            }, {
              $pull: {
                'timeline.$.nodes': {
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
              'timeline.maps': mapId
          }, {
            $pull: {
              'timeline.$.maps': mapId
            }
          }, {
            safe:true,
            multi:true,
            new : true
          }).exec();
        });
    };

    workspaceSchema.methods.findUnprocessedNodes = function(timesliceId){
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);

      if(!timesliceId){
        timesliceId = this.nowId;
      }

      return WardleyMap
          .find({ // find all undeleted maps within workspace and timeslice
              archived: false,
              workspace: this._id,
              timesliceId : timesliceId
          })
          .select('name isSubmap')
          .then(function(maps) {
              deduplicationLogger.debug('found maps' + maps);
              var loadPromises = [];
              maps.forEach(function(cv, i, a) {
                  loadPromises.push(Node
                      .find({
                          parentMap: cv,
                          processedForDuplication: false
                      })
                      .then(function(nodes) {
                          a[i].nodes = nodes;
                          return a[i];
                      }));
              });
              return q.all(loadPromises)
                  .then(function(results) {
                      var finalResults = [];
                      return results.filter(function(map) {
                          let hasNodes = map.nodes && map.nodes.length > 0;
                          deduplicationLogger.debug('map ' + map._id + ' has nodes ' + hasNodes);
                          return hasNodes;
                      });
                  });
          });
    };

    workspaceSchema.methods.getTimeSlice = function(timesliceId){
      if(!timesliceId){
        timesliceId = this.nowId;
      }
      timesliceId = new ObjectId(timesliceId);
      for(var i = 0; i < this.timeline.length; i++){
        if(this.timeline[i]._id.equals(timesliceId)){
          return  this.timeline[i];
        }
      }
      return null;
    };

    workspaceSchema.methods.findProcessedNodes = function(timesliceId) {
        deduplicationLogger.trace('looking for processed node for workspace ' + this._id + ' variant ' + timesliceId);
        var _this = this;

        var timeSlice = this.getTimeSlice(timesliceId);

        deduplicationLogger.trace('variant ' + timesliceId + ' found ' + timeSlice);

        if(!timeSlice) {
          return null;
        }

        //this is a temporary mechanism that should be removed when the database is properly migrated
        if (!timeSlice.capabilityCategories[0].name) { // rough check, no name -> needs migration
            var Node = require('./node-schema')(conn);
            return Node.update({
                workspace: _this.id
            }, {
                processedForDuplication: true
            }, {
                safe: true
            }).exec().then(function() {
                timeSlice.capabilityCategories = defaultCapabilityCategories;
                return _this.save();
            });
        } else {
            return this
                .populate({
                    path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                    model: 'Node',
                }).execPopulate();
        }
    };

    workspaceSchema.methods.createNewCapabilityAndAliasForNode = function(timesliceId, categoryID, nodeID) {
        var Node = require('./node-schema')(conn);

        var promises = [];
        var capabilityCategory = null;
        var timeSlice = this.getTimeSlice(timesliceId);

        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            if (categoryID.equals(timeSlice.capabilityCategories[i]._id)) {
                capabilityCategory = timeSlice.capabilityCategories[i];
            }
        }
        capabilityCategory.capabilities.push({
            aliases: [{
                nodes: [nodeID]
            }]
        });
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
        });
    };

    workspaceSchema.methods.editCategory = function(timesliceId, capabilityCategoryID, name){
      if(!timesliceId){
        return null;
      }
      var timeSlice = this.getTimeSlice(timesliceId);

      for (var i = timeSlice.capabilityCategories.length - 1; i > -1 ; i--) {
          if (capabilityCategoryID.equals(timeSlice.capabilityCategories[i]._id)) {
              timeSlice.capabilityCategories[i].name = name;
              break;
          }
      }
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.createCategory = function(timesliceId, name){
      if(!timesliceId){
        return null;
      }
      var timeSlice = this.getTimeSlice(timesliceId);

      timeSlice.capabilityCategories.push({ name:name, capabilities : []});
      var promises = [this.save()];
      return q.allSettled(promises).then(function(res) {
          return res[0].value.populate({
              path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
              model: 'Node',
          }).execPopulate();
      });
    };

    workspaceSchema.methods.deleteCategory = function(timesliceId, capabilityCategoryID){
      if(!timesliceId){
        return null;
      }
      let timeSlice = this.getTimeSlice(timesliceId);

      if(!timeSlice) {
        return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      }

      let promises = [];

      let capabilityCategoryToRemove = null;
      let capabilitiesToRemove = [];
      let aliasesToRemove = [];
      var referencesToRemove = [];

      var Node = require('./node-schema')(conn);

      for (let i = timeSlice.capabilityCategories.length - 1; i > -1; i--) {
        if (capabilityCategoryID.equals(timeSlice.capabilityCategories[i]._id)) {
          capabilityCategoryToRemove = timeSlice.capabilityCategories.splice(i, 1)[0];
          break;
        }
      }

      if (capabilityCategoryToRemove && capabilityCategoryToRemove.capabilities) {

        for (let i = 0; i < capabilityCategoryToRemove.capabilities.length; i++) {

          let capability = capabilityCategoryToRemove.capabilities[i];
          capabilitiesToRemove.push(capability._id);

          if (capability.aliases) {
            for (let j = 0; j < capability.aliases.length; j++) {
              let alias = capability.aliases[j];
              aliasesToRemove.push(alias._id);
              if (alias.nodes) {
                for (let k = 0; k < alias.nodes.length; k++) {
                  let node = alias.nodes[k];
                  promises.push(Node.findOneAndUpdate({
                    _id: node
                  }, {
                    $set: {
                      processedForDuplication: false
                    }
                  }).exec());
                }
              }
            }
          }
          if(capability.marketreferences){
            referencesToRemove = capability.marketreferences;
          }
        }
      }

      let previousTimeSlice = this.getTimeSlice(timeSlice.previous);
      let previousCapabilityCategory;
      if(previousTimeSlice){
        for(let i =0; i < previousTimeSlice.capabilityCategories.length; i++){
            let candidate = previousTimeSlice.capabilityCategories[i];
            let position = candidate.next.indexOf(capabilityCategoryToRemove._id);
            if(position >= 0){
              previousCapabilityCategory = candidate;
              previousCapabilityCategory.next.splice(position,1);
            }
        }
      }

      if(previousCapabilityCategory && previousCapabilityCategory.capabilities){
        for(let i =0; i < previousCapabilityCategory.capabilities.length; i++){
            let capabilityCandidate = previousCapabilityCategory.capabilities[i];

            for(let k = 0; k < capabilitiesToRemove.length; k++){
              let nextPos = capabilityCandidate.next.indexOf(capabilitiesToRemove[k]);

              if(nextPos >= 0){
                capabilityCandidate.next.splice(nextPos, 1);
                for(let l = 0; l < capabilityCandidate.aliases.length; l++){
                  let aliasCandidate = capabilityCandidate.aliases[l];

                  for(let m = 0; m < aliasesToRemove.length; m++){
                    let aliasPos = aliasCandidate.next.indexOf(aliasesToRemove[m]);
                    if(aliasPos >= 0){
                      aliasCandidate.next.splice(aliasPos,1);
                    }
                  }
                }

                for(let l = 0; l < capabilityCandidate.marketreferences.length; l++){
                  let referenceCandidate = capabilityCandidate.marketreferences[l];

                  for(let m = 0; m < referencesToRemove.length; m++){
                    let refPos = referenceCandidate.next.indexOf(referencesToRemove[m]._id);
                    if(refPos >= 0){
                      referenceCandidate.next.splice(refPos,1);
                    }
                  }
                }
              }
            }
        }
      }

      for (let z = 0; z < timeSlice.next.length; z++) {
        let affectedTimeSlice = this.getTimeSlice(timeSlice.next[z]);
        let affectedCapabilityCategory;
        if (affectedTimeSlice) {
          for (let i = 0; i < affectedTimeSlice.capabilityCategories.length; i++) {
            let candidate = affectedTimeSlice.capabilityCategories[i];
            if (capabilityCategoryToRemove._id.equals(candidate.previous)) {
              affectedCapabilityCategory = candidate;
              affectedCapabilityCategory.previous = null;
            }
          }
        }

        if(affectedCapabilityCategory && affectedCapabilityCategory.capabilities){
          for(let i =0; i < affectedCapabilityCategory.capabilities.length; i++){
              let capabilityCandidate = affectedCapabilityCategory.capabilities[i];

              for(let k = 0; k < capabilitiesToRemove.length; k++){

                if(capabilitiesToRemove[k].equals(capabilityCandidate.previous)){
                  capabilityCandidate.previous = null;

                  for(let l = 0; l < capabilityCandidate.aliases.length; l++){
                    let aliasCandidate = capabilityCandidate.aliases[l];

                    for(let m = 0; m < aliasesToRemove.length; m++){
                      if(aliasesToRemove[m].equals(aliasCandidate.previous)){
                        aliasCandidate.previous = null;
                      }
                    }
                  }

                  for(let l = 0; l < capabilityCandidate.marketreferences.length; l++){
                    let marketRefCandidate = capabilityCandidate.marketreferences[l];

                    for(let m = 0; m < referencesToRemove.length; m++){
                      if(referencesToRemove[m]._id.equals(marketRefCandidate.previous)){
                        marketRefCandidate.previous = null;
                      }
                    }
                  }
                }
              }
          }
        }
      }


      promises.push(this.save());

      return q.allSettled(promises).then(function(res) {
        return res[res.length-1].value.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      });

    };

    workspaceSchema.methods.createNewAliasForNodeInACapability = function(timesliceId, capabilityID, nodeID) {
        var timeSlice = this.getTimeSlice(timesliceId);

        var Node = require('./node-schema')(conn);

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                }
            }
        }
        capability.aliases.push({
            nodes: [nodeID]
        });
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.createNewMarketReferenceInCapability = function(timesliceId, capabilityID, name, description, evolution) {
      if(!timesliceId){ //noop
        return this.populate({
            path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
            model: 'Node',
        }).execPopulate();
      }
      var timeSlice = this.getTimeSlice(timesliceId);

      if(!timeSlice || !timeSlice._id.equals(timesliceId)){ //noop
        deduplicationLogger.debug('timeslice not found ' + timesliceId + ' ' + capabilityID + ' ' +  name + ' ' +  description + ' ' + evolution);
        return this.populate({
            path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
            model: 'Node',
        }).execPopulate();
      }

        if(isNaN(evolution)){
          evolution = 0.5;
        }

        var promises = [];
        var capability = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
                if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                }
            }
        }
        if(capability){
          capability.marketreferences.push({
            name: name,
            description: description,
            evolution: evolution
          });
        }
        promises.push(this.save());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node',
            }).execPopulate();
        });
    };

    workspaceSchema.methods.deleteMarketReferenceInCapability = function(timesliceId, capabilityID, marketReferenceId) {
      if (!timesliceId) { //noop
        return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      }

      var timeSlice = this.getTimeSlice(timesliceId);

      if (!timeSlice) { //noop
        return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      }

      var promises = [];

      var capability = null;
      var previousMarketReference = null;
      var nextMarketReferences = [];

      for (let i = 0; i < timeSlice.capabilityCategories.length; i++) {
        for (let j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
          if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
            capability = timeSlice.capabilityCategories[i].capabilities[j];
            for (let k = capability.marketreferences.length - 1; k >= 0; k--) {
              if (capability.marketreferences[k]._id.equals(marketReferenceId)) {
                let reference = capability.marketreferences.splice(k, 1);
                previousMarketReference = reference.previous;
                nextMarketReferences = reference.next;
              }
            }
          }
        }
      }

      if(previousMarketReference && timeSlice.previous){
        let previousTimeSlice = this.getTimeSlice(timeSlice.previous);

        for (let i = 0; i < previousTimeSlice.capabilityCategories.length; i++) {
          for (let j = 0; j < previousTimeSlice.capabilityCategories[i].capabilities.length; j++) {
            for(let k = 0; k < previousTimeSlice.capabilityCategories[i].capabilities[j].next.length; k++){
              if (capabilityID.equals(previousTimeSlice.capabilityCategories[i].capabilities[j].next[k])) {
                let affectedCapability = previousTimeSlice.capabilityCategories[i].capabilities[j];
                for (let l = affectedCapability.marketreferences.length - 1; l >= 0; l--) {
                  if (affectedCapability.marketreferences[k]._id.equals(previousMarketReference)) {
                    let index = affectedCapability.marketreferences[k].next.indexOf(marketReferenceId);
                    affectedCapability.marketreferences.next.splice(index, 1);
                  }
                }
                break;
              }
            }
          }
        }

      }

      if(capability && timeSlice.next && timeSlice.next.length > 0){
        for(let z = 0; z < timeSlice.next.length; z++){
          let nextTimeSlice = this.getTimeSlice(timeSlice.next[z]);

          for (let i = 0; i < nextTimeSlice.capabilityCategories.length; i++) {
            for (let j = 0; j < nextTimeSlice.capabilityCategories[i].capabilities.length; j++) {
              if (capabilityID.equals(nextTimeSlice.capabilityCategories[i].capabilities[j].previous)) {
                let affectedCapability = nextTimeSlice.capabilityCategories[i].capabilities[j];

                for (let l = affectedCapability.marketreferences.length - 1; l >= 0; l--) {
                  let potentiallyAffectedMarketRefernce = affectedCapability.marketreferences[l];
                  if (potentiallyAffectedMarketRefernce.previous.equals(previousMarketReference)) {
                    potentiallyAffectedMarketRefernce.previous = null;
                  }
                }
              }
            }
          }
        }
      }

      promises.push(this.save());

      return q.allSettled(promises).then(function(res) {
        return res[0].value.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      });
    };

    workspaceSchema.methods.updateMarketReferenceInCapability = function(timesliceId, capabilityID, marketReferenceId, name, description, evolution) {
      if (!timesliceId) { //noop
        return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      }
      var timeSlice = this.getTimeSlice(timesliceId);
      if (!timeSlice) { //noop
        return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      }
      var promises = [];
      var capability = null;
      for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
        for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
          if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
            capability = timeSlice.capabilityCategories[i].capabilities[j];
            for (var k = capability.marketreferences.length - 1; k >= 0; k--) {
              if (capability.marketreferences[k]._id.equals(marketReferenceId)) {
                capability.marketreferences[k].name = name;
                capability.marketreferences[k].description = description;
                capability.marketreferences[k].evolution = evolution;
              }
            }
          }
        }
      }

      promises.push(this.save());

      return q.allSettled(promises).then(function(res) {
        return res[0].value.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
        }).execPopulate();
      });
    };

    workspaceSchema.methods.addNodeToAlias = function(timesliceId,aliasID, nodeID) {
        var timeSlice = this.getTimeSlice(timesliceId);

        var Node = require('./node-schema')(conn);

        var promises = [];
        var alias = null;
        for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
          for(var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++){
            for(var k = 0; k < timeSlice.capabilityCategories[i].capabilities[j].aliases.length; k++){
              if (aliasID.equals(timeSlice.capabilityCategories[i].capabilities[j].aliases[k]._id)) {
                  alias = timeSlice.capabilityCategories[i].capabilities[j].aliases[k];
              }
            }
          }
        }
        alias.nodes.push(nodeID);
        promises.push(this.save());
        promises.push(Node.update({
            _id: nodeID
        }, {
            processedForDuplication: true
        }, {
            safe: true
        }).exec());
        return q.allSettled(promises).then(function(res) {
            return res[0].value.populate({
                path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
                model: 'Node'
            }).execPopulate();
        });
    };

    workspaceSchema.methods.getNodeUsageInfo = function(timesliceId, nodeID) {
      if(!timesliceId){
        return null;
      }
      var timeSlice = this.getTimeSlice(timesliceId);
      if(!timeSlice){
        return null;
      }
      var _this = this;
      return this.populate({
          path: 'timeline.capabilityCategories.capabilities.aliases.nodes',
          model: 'Node',
          populate: {
            model: 'WardleyMap',
            path: 'parentMap'
          }
        })
        .execPopulate()
        .then(function(workspace) {
          var capability = null;
          for (var i = 0; i < timeSlice.capabilityCategories.length; i++) {
            for (var j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
              for (var k = 0; k < timeSlice.capabilityCategories[i].capabilities[j].aliases.length; k++) {
                for (var l = 0; l < timeSlice.capabilityCategories[i].capabilities[j].aliases[k].nodes.length; l++) {
                  if (nodeID.equals(timeSlice.capabilityCategories[i].capabilities[j].aliases[k].nodes[l]._id)) {
                    capability = timeSlice.capabilityCategories[i].capabilities[j];
                  }
                }
              }
            }
          }
          return capability;
        });
    };

      workspaceSchema.methods.removeNodeUsageInfo = function(node) {
        var WardleyMap = require('./map-schema')(conn);
        var workspace = this;
        var dependencyToRemove = node._id;

        return WardleyMap.findById(node.parentMap._id || node.parentMap).exec()
          .then(function(parentMap) {
            let timeSliceId = parentMap.timesliceId;
            let timeSlice = workspace.getTimeSlice(timeSliceId);

            let aliasBeingRemoved = null;
            let capabilityBeingRemoved = null;

            for (let capabilityCategoriesCounter = timeSlice.capabilityCategories.length - 1; capabilityCategoriesCounter >= 0; capabilityCategoriesCounter--) {
              let capabilityCategory = timeSlice.capabilityCategories[capabilityCategoriesCounter];
              for (let capabilitiesCounter = capabilityCategory.capabilities.length - 1; capabilitiesCounter >= 0; capabilitiesCounter--) {
                let capability = capabilityCategory.capabilities[capabilitiesCounter];
                for (let aliasCounter = capability.aliases.length - 1; aliasCounter >= 0; aliasCounter--) {
                  let alias = capability.aliases[aliasCounter];
                  for (let nodeCounter = alias.nodes.length - 1; nodeCounter >= 0; nodeCounter--) {
                    let node = alias.nodes[nodeCounter];
                    if (node._id === dependencyToRemove) {
                      alias.nodes.splice(nodeCounter, 1);
                      break;
                    }
                  }
                  if (alias.nodes.length === 0) {
                    aliasBeingRemoved = capability.aliases.splice(aliasCounter, 1);
                  }
                }
                if (capability.aliases.length === 0) {
                  capabilityBeingRemoved = capabilityCategory.capabilities.splice(capabilitiesCounter, 1);
                }
              }
            }
            if (aliasBeingRemoved) {

              let previousTimeSlice = workspace.getTimeSlice(timeSlice.previous);

              if (previousTimeSlice) {

                for (let capabilityCategoriesCounter = previousTimeSlice.capabilityCategories.length - 1; capabilityCategoriesCounter >= 0; capabilityCategoriesCounter--) {
                  let capabilityCategory = previousTimeSlice.capabilityCategories[capabilityCategoriesCounter];
                  for (let capabilitiesCounter = capabilityCategory.capabilities.length - 1; capabilitiesCounter >= 0; capabilitiesCounter--) {
                    let capability = capabilityCategory.capabilities[capabilitiesCounter];
                    for (let aliasCounter = capability.aliases.length - 1; aliasCounter >= 0; aliasCounter--) {
                      let alias = capability.aliases[aliasCounter];
                      if (alias.next.indexOf(aliasBeingRemoved._id) !== -1) {
                        alias.next.pull(aliasBeingRemoved._id);
                      }
                    }
                    if (capabilityBeingRemoved && capability.next.indexOf(capabilityBeingRemoved._id) !== -1) {
                      capability.next.pull(capabilityBeingRemoved._id);
                    }
                  }
                }

              }
            }

            for (let i = 0; i < timeSlice.next.length; i++) {
              let nextTimeSlice = workspace.getTimeSlice(timeSlice.previous);

              if (nextTimeSlice) {

                for (let capabilityCategoriesCounter = nextTimeSlice.capabilityCategories.length - 1; capabilityCategoriesCounter >= 0; capabilityCategoriesCounter--) {
                  let capabilityCategory = nextTimeSlice.capabilityCategories[capabilityCategoriesCounter];
                  for (let capabilitiesCounter = capabilityCategory.capabilities.length - 1; capabilitiesCounter >= 0; capabilitiesCounter--) {
                    let capability = capabilityCategory.capabilities[capabilitiesCounter];
                    for (let aliasCounter = capability.aliases.length - 1; aliasCounter >= 0; aliasCounter--) {
                      let alias = capability.aliases[aliasCounter];
                      if (alias.previous.equals(aliasBeingRemoved._id)) {
                        alias.previous = null;
                      }
                    }
                    if (capabilityBeingRemoved && capability.previous.equals(capabilityBeingRemoved._id)) {
                      capability.previous = null;
                    }
                  }
                }

              }

            }



            return workspace.save();
          });

      };

    workspaceSchema.methods.removeCapability = function(timesliceId, capabilityID) {
      var Node = require('./node-schema')(conn);

      if(!timesliceId){
        return null;
      }
      let timeSlice = this.getTimeSlice(timesliceId);
      if(!timeSlice){
        return null;
      }

      let promises = [];

      let removedCapability = null;
      let removedMarketReferences = [];
      let removedAliases = [];

      for (let i = 0; i < timeSlice.capabilityCategories.length; i++) {
        for (let j = 0; j < timeSlice.capabilityCategories[i].capabilities.length; j++) {
          if (capabilityID.equals(timeSlice.capabilityCategories[i].capabilities[j]._id)) {
            removedCapability = timeSlice.capabilityCategories[i].capabilities[j];
            timeSlice.capabilityCategories[i].capabilities.splice(j, 1);
            removedMarketReferences =  removedCapability.marketreferences;
            removedAliases = removedCapability.aliases;
            break;
          }
        }
      }


      promises.push(this.save());

      for (let k = 0; k < removedCapability.aliases.length; k++) {
        for (let l = 0; l < removedCapability.aliases[k].nodes.length; l++) {
          promises.push(Node.findOne({
            _id: removedCapability.aliases[k].nodes[l]
          }).exec().then(function(node) {
            node.processedForDuplication = false;
            return node.save();
          }));
        }
      }

      if(timeSlice.previous){
        let previousTimeSlice = this.getTimeSlice(timeSlice.previous);
        for (let i = 0; i < previousTimeSlice.capabilityCategories.length; i++) {
          for (let j = 0; j < previousTimeSlice.capabilityCategories[i].capabilities.length; j++) {
            let affectedCapability = previousTimeSlice.capabilityCategories[i].capabilities[j];
            let index = affectedCapability.next.indexOf(capabilityID);

            if(index >= 0){ //right capbility
              affectedCapability.next.splice(index,1); // remove reference to future removed version

              for (let k = 0; k < affectedCapability.marketreferences.length; k++) {
                let affectedMarketReference = affectedCapability.marketreferences[k];
                for(let l = 0; l < removedMarketReferences.length; l++){
                  let refIndex = affectedMarketReference.next.indexOf(removedMarketReferences[l]._id);
                  if(refIndex >= 0){
                    affectedMarketReference.next.splice(refIndex,1);
                  }
                }
              }

              for (let k = 0; k < affectedCapability.aliases.length; k++) {
                let affectedAlias = affectedCapability.aliases[k];
                for(let l = 0; l < removedAliases.length; l++){
                  let refIndex = affectedAlias.next.indexOf(removedAliases[l]._id);
                  if(refIndex >= 0){
                    affectedAlias.next.splice(refIndex,1);
                  }
                }
              }
            }
          }
        }
      }

      for(let z = 0; z < timeSlice.next.length; z++){
        let affectedTimeSlice = this.getTimeSlice(timeSlice.next[z]);
        for (let i = 0; i < affectedTimeSlice.capabilityCategories.length; i++) {
          for (let j = 0; j < affectedTimeSlice.capabilityCategories[i].capabilities.length; j++) {
            let affectedCapability = affectedTimeSlice.capabilityCategories[i].capabilities[j];

            if(affectedCapability.previous.equals(capabilityID)){ //right capbility
              affectedCapability.previous = null; // remove reference to future removed version

              for (let k = 0; k < affectedCapability.marketreferences.length; k++) {
                let affectedMarketReference = affectedCapability.marketreferences[k];
                for(let l = 0; l < removedMarketReferences.length; l++){
                  if(removedMarketReferences[l]._id.equals(affectedMarketReference.previous)){
                    affectedMarketReference.previous = null;
                  }
                }
              }

              for (let k = 0; k < affectedCapability.aliases.length; k++) {
                let affectedAlias = affectedCapability.aliases[k];
                for(let l = 0; l < removedAliases.length; l++){
                  if(removedAliases[l]._id.equals(affectedAlias.previous)){
                    affectedAlias.previous = null;
                  }
                }
              }
            }
          }
        }
      }

      return q.all(promises);
    };

    workspaceSchema.methods.populateTimeslices = function(){
      return this.populate({
        path : 'timeline.maps',
        model :'WardleyMap',
        populate : {
          path: 'nodes',
          model: 'Node'
        }
      }).execPopulate();
    };


    workspaceSchema.methods.cloneTimeslice = function(sourceTimeSliceId, name, description) {
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);

      variantLogger.info('cloning variant ' + sourceTimeSliceId + ' in workspace ' + this._id);

      if (!sourceTimeSliceId) {
        throw new Error('source not specified');
      }

      return this.populateTimeslices()
        .then(function(popWorkspace) {

          variantLogger.debug('workspace ' + popWorkspace._id + ' populated');

          var sourceTimeSlice = popWorkspace.getTimeSlice(sourceTimeSliceId);
          if(!sourceTimeSlice && !sourceTimeSlice._id.equals(sourceTimeSliceId)){
            variantLogger.warn('sourceTimeSlice not found');
            return null;
          }

          variantLogger.debug('sourceTimeSlice found ' + sourceTimeSlice._id);

          var mappings = {
            maps: {},
            nodes: {},
            newTimeSliceId: new ObjectId()
          };
          // part one, book future map ids
          for (let i = 0; i < sourceTimeSlice.maps.length; i++) {
            mappings.maps[sourceTimeSlice.maps[i]._id] = new ObjectId();
          }
          variantLogger.debug('map ids mappings ' + JSON.stringify(mappings.maps));
          // part two, book future nodes ids
          for (let i = 0; i < sourceTimeSlice.maps.length; i++) {
            let nodes = sourceTimeSlice.maps[i].nodes;
            for (let j = 0; j < nodes.length; j++) {
              mappings.nodes[nodes[j]._id] = new ObjectId();
            }
          }
          variantLogger.debug('nodes ids mappings ' + JSON.stringify(mappings.nodes));
          // part three, clone nodes
          var nodesToSave = [];
          for (let i = 0; i < sourceTimeSlice.maps.length; i++) {
            let nodes = sourceTimeSlice.maps[i].nodes;
            for (let j = 0; j < nodes.length; j++) {
              let oldNode = nodes[j];
              if(!oldNode._id){
                variantLogger.fatal('node not populated');
                console.error('node not populated');
              }
              var newNode = new Node({
                _id: new ObjectId(mappings.nodes[oldNode._id]),
                workspace: oldNode.workspace,
                parentMap: mappings.maps[sourceTimeSlice.maps[i]._id],
                name: oldNode.name,
                x: oldNode.x,
                y: oldNode.y,
                width: oldNode.width,
                type: oldNode.type,
                constraint: oldNode.constraint,
                previous: oldNode._id,
                next: [],
                inboundDependencies: [],
                outboundDependencies: [],
                dependencyData: {
                  inbound: {},
                  outbound: {}
                },
                action: [],
                submapID: oldNode.submapID,
                responsiblePerson: oldNode.responsiblePerson,
                inertia: oldNode.inertia,
                description: oldNode.description,
                processedForDuplication: oldNode.processedForDuplication
              });
              oldNode.next.push(newNode._id);
              //transfer comments
              for (let k = 0; k < oldNode.action.length; k++) {
                newNode.action.push({
                  x: oldNode.action[k].x,
                  y: oldNode.action[k].y,
                  shortSummary: oldNode.action[k].shortSummary,
                  description: oldNode.action[k].description
                });
              }
              // update dependencies
              if (oldNode.type === "SUBMAP") {
                newNode.submapID = mappings.maps[oldNode.submapID];
              }
              if (oldNode.inboundDependencies) {
                for (let ni = 0; ni < oldNode.inboundDependencies.length; ni++) {
                  // replace the dependency

                  let oldDep = oldNode.inboundDependencies[ni];
                  newNode.inboundDependencies.push(mappings.nodes[oldDep]);

                  //replace the dependencyData
                  if(oldNode.dependencyData.inbound){
                    newNode.dependencyData.inbound[mappings.nodes[oldDep]] = oldNode.dependencyData.inbound[oldDep];
                  }
                }
              }
              if (oldNode.outboundDependencies) {
                for (var no = 0; no < oldNode.outboundDependencies.length; no++) {
                  // replace the dependency

                  let oldDep = oldNode.outboundDependencies[no];
                  newNode.outboundDependencies.push(mappings.nodes[oldDep]);

                  //replace the dependencyData
                  if(oldNode.dependencyData.outbound){
                    newNode.dependencyData.outbound[mappings.nodes[oldDep]] = oldNode.dependencyData.outbound[oldDep];
                  }
                }
              }
              nodesToSave.push(newNode.save());
              nodesToSave.push(oldNode.save());
            }
          }
          variantLogger.debug('nodes copied');
          return q.allSettled(nodesToSave)
            .then(function(savedNodes) {
              variantLogger.debug('nodes saved');
              // part four - clone maps
              var mapsToSave = [];
              for (let i = 0; i < sourceTimeSlice.maps.length; i++) {
                let oldMap = sourceTimeSlice.maps[i];
                let newMap = new WardleyMap({
                  _id: new ObjectId(mappings.maps[oldMap._id]),
                  name: oldMap.name,
                  isSubmap: oldMap.isSubmap,
                  archived: oldMap.archived,
                  workspace: oldMap.workspace,
                  next: [],
                  previous: oldMap._id,
                  timesliceId: mappings.newTimeSliceId,
                  responsiblePerson: oldMap.responsiblePerson,
                  schemaVersion: oldMap.schemaVersion,
                  comments: [],
                  nodes: [],
                  users: []
                });
                variantLogger.debug('setting next ' + newMap._id + ' in ' + oldMap._id);
                // if(oldMap.next.indexOf(newMap._id) >= 0){
                //   variantLogger.warn('already set ' + oldMap.next);
                // } else {
                  oldMap.next.push(newMap._id);
                // }

                // transfer comments
                for (let j = 0; j < oldMap.comments.length; j++) {
                  var newCommentId = new ObjectId();
                  newMap.comments.push({
                    _id: newCommentId,
                    x: oldMap.comments[j].x,
                    y: oldMap.comments[j].y,
                    width: oldMap.comments[j].width,
                    text: oldMap.comments[j].text,
                    next: [],
                    previous : oldMap.comments[j]._id
                  });
                  oldMap.comments[j].next.push(newCommentId);
                }

                // transfer users
                for (let j = 0; j < oldMap.users.length; j++) {
                  let newUserId = new ObjectId();
                  let oldUser = oldMap.users[j];
                  newMap.users.push({
                    _id: newUserId,
                    x: oldUser.x,
                    y: oldUser.y,
                    width: oldUser.width,
                    name: oldUser.name,
                    description: oldUser.description,
                    next: [],
                    previous: oldUser._id
                  });
                  for (let k = 0; k < oldUser.associatedNeeds.length; k++) {
                    newMap.users[j].associatedNeeds.push(mappings.nodes[oldUser.associatedNeeds[k]]);
                  }
                  oldUser.next.push(newUserId);
                }

                // transfer nodes
                for (let j = 0; j < oldMap.nodes.length; j++) {
                  // add to the parent map
                  newMap.nodes.push(new ObjectId(mappings.nodes[oldMap.nodes[j]._id]));
                }

                mapsToSave.push(oldMap.save());
                mapsToSave.push(newMap.save());
              }
              variantLogger.debug('maps copied');
              return q.allSettled(mapsToSave)
                .then(function(savedMaps) {
                  variantLogger.debug('maps saved');
                  // prepare a new timeslice
                  var newTimeSlice = {
                    _id: mappings.newTimeSliceId,
                    name: name || sourceTimeSlice.name,
                    description: description || sourceTimeSlice.description,
                    current: false,
                    next: [],
                    previous: [sourceTimeSlice._id],
                    maps: [],
                    capabilityCategories: []
                  };
                  sourceTimeSlice.next.push(newTimeSlice._id);
                  variantLogger.debug('maps insterted into new timeslice');
                  for (let i = 0; i < sourceTimeSlice.maps.length; i++) {
                    newTimeSlice.maps.push(new ObjectId(mappings.maps[sourceTimeSlice.maps[i]._id]));
                  }

                  variantLogger.trace('    ' + sourceTimeSlice.capabilityCategories.length + ' capability categories to migrate');
                  for (let i = 0; i < sourceTimeSlice.capabilityCategories.length; i++) {
                    let oldCapabilityCategory = sourceTimeSlice.capabilityCategories[i];

                    let newCapabilityCategory = {
                      _id : new ObjectId(),
                      name: oldCapabilityCategory.name,
                      next: [],
                      previous: oldCapabilityCategory._id,
                      capabilities: [],
                      marketreferences: []
                    };
                    oldCapabilityCategory.next.push(newCapabilityCategory._id);
                    variantLogger.trace('    ' + oldCapabilityCategory._id + ' cloned');

                    if (oldCapabilityCategory.capabilities) {
                      variantLogger.trace('    ' + oldCapabilityCategory._id + ' has '+ oldCapabilityCategory.capabilities.length + ' capabilities');
                      for (let j = 0; j < oldCapabilityCategory.capabilities.length; j++) {
                        let oldCapability = oldCapabilityCategory.capabilities[j];
                        var newCapability = {
                          _id: new ObjectId(),
                          aliases: [],
                          marketreferences : [],
                          next: [],
                          previous: oldCapability._id
                        };
                        oldCapability.next.push(newCapability._id);

                        for (let k = 0; k < oldCapability.aliases.length; k++) {
                          variantLogger.trace('        ' + oldCapability._id + ' has '+ oldCapability.aliases.length + ' aliases');
                          let oldAlias = oldCapability.aliases[k];
                          var newAlias = {
                            _id : new ObjectId(),
                            nodes: [],
                            next: [],
                            previous: oldAlias._id
                          };
                          oldAlias.next.push(newAlias._id);
                          variantLogger.trace('           ' + oldAlias._id + ' has '+ oldAlias.nodes.length + ' nodes');
                          for (var z = 0; z < oldAlias.nodes.length; z++) {
                            newAlias.nodes.push(mappings.nodes[oldAlias.nodes[z]]);
                          }
                          newCapability.aliases.push(newAlias);
                        }

                        variantLogger.trace('        ' + oldCapability._id + ' has '+ oldCapability.marketreferences.length + ' market references');
                        for (let k = 0; k < oldCapability.marketreferences.length; k++) {
                          let oldMarketReference = oldCapability.marketreferences[k];
                          variantLogger.trace('            processing old market reference' + oldMarketReference._id);
                          var newMarketReference = {
                            _id : new ObjectId(),
                            name: oldMarketReference.name,
                            description: oldMarketReference.description,
                            evolution : oldMarketReference.evolution,
                            next: [],
                            previous: oldMarketReference._id
                          };
                          oldMarketReference.next.push(newMarketReference._id);
                          variantLogger.trace('            setting new reference');
                          newCapability.marketreferences.push(newMarketReference);
                          variantLogger.trace('            adding to new capability');
                        }
                        variantLogger.trace('        adding capability to category');
                        newCapabilityCategory.capabilities.push(newCapability);
                      }
                    }
                    variantLogger.trace('   adding category to timeslice');
                    newTimeSlice.capabilityCategories.push(newCapabilityCategory);
                  }

                  variantLogger.debug('capabilities  cloned');

                  popWorkspace.timeline.push(newTimeSlice);
                  return popWorkspace.save().then(function(wrkspc){
                    variantLogger.debug('workspace saved');
                    return wrkspc.populateTimeslices();
                  });

                });
            });
        });
    };

    workspaceSchema.methods.importJSON = function(json){
      let Node = require('./node-schema')(conn);
      return mapImport(Node, this, json);
    };


    workspaceSchema.methods.modifyTimeslice = function(sourceTimeSliceId, name, description, current) {
      var WardleyMap = require('./map-schema')(conn);
      var Node = require('./node-schema')(conn);


      if (!sourceTimeSliceId) {
        throw new Error('source not specified');
      }

      var sourceTimeSlice = this.getTimeSlice(sourceTimeSliceId);
      if (name) {
        sourceTimeSlice.name = name;
      }
      if (description) {
        sourceTimeSlice.description = description;
      }
      if (current) {
        for (let i = 0; i < this.timeline.length; i++) {
          var timeSlice = this.timeline[i];
          // current gets true
          timeSlice.current = timeSlice._id.equals(sourceTimeSliceId);
        }
      }
      return this.save().then(function(wrkspc) {
        return wrkspc.populateTimeslices();
      });
    };

    workspaceSchema.methods.findSuggestions = function(sourceTimeSliceId, mapId, suggestionText) {
      let Node = require('./node-schema')(conn);
      return require('./workspace/workspacemethods.js').findSuggestions(this, Node, this.getTimeSlice(sourceTimeSliceId), mapId, suggestionText);
    };





    /* Tried as I might, I was not able to write this using only db queries */
    workspaceSchema.methods.assessSubmapImpact = function(nodeIdsToSubmap) {
      let Node = require('./node-schema')(conn);

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
        let finalAnalysis = result[1].value;
        finalAnalysis.nodesThatDependOnFutureSubmap = result[0].value;
        return finalAnalysis;
      });
    };

//     workspaceSchema.methods.formASubmap = function(timeSliceId, mapId, params, /*array*/nodeIds, /*array*/ commentsIds) {
//         var WardleyMap = require('./map-schema')(conn);
//         var Node = require('./node-schema')(conn);
//         mapId = getId(mapId);
//         const newSubmapName = params.submapName;
//         if(!newSubmapName){
//           throw new Error('Submap name cannot be empty');
//         }
//         const responsiblePerson = params.responsiblePerson;
//         //iterate and check ids
//
//         const _this = this;
//
//         // Operate on all maps at once
//         // Step 1. Form a submap
//         //   - add nodes to it (easy)
//         //   - add included deps (easy) (connection, source and target are on the submap)
//
//         // replace removed nodes with the submap
//         // reestablish dependencies in existing maps (!)
//
//         //create the submap
//         let submap = new WardleyMap({
//             name: newSubmapName,
//             isSubmap: true,
//             workspace: getId(_this),
//             timesliceId: timeSliceId,
//             archived: false,
//             responsiblePerson: params.responsiblePerson,
//             previous : null,
//             next : []
//         });
//
//         return submap.save()
//           .then(function(submap) {
//             return _this.insertMapIdAt(getId(submap)).then(function(workspace) {
//               return submap;
//             });
//           })
//           .then(function(submap){
//             let submapNode = new Node({
//                 name: newSubmapName,
//                 workspace: getId(_this),
//                 parentMap: _this,
//                 type: 'SUBMAP',
//                 submapID: getId(submap),
//                 next : [],
//                 previous : null
//             });
//             return submapNode.save().then(function(savedSubmapNode){
//               return [submap, savedSubmapNode];
//             });
//           })
//           .then(function(/* map and node*/ submapStubs){
//             return Node.find({
//               _id : { $in: nodeIds}
//             }).exec().then(function(arrayOfNodes){
//
//             });
//           });
//
// //subnode formation should be done at the end
//
//
//         var promises = [];
//         promises.push(_this.workspace.insertMapIdAt(submap, _this.timesliceId));
//         _this.nodes.push(submapNode);
//
//         // at this point we have placeholders for the submap and the new node
//         // all properly plugged in  into the workspace and parent map
//
//
//         // move comments
//         // iterate over existing comments, and if on the list to transfer, do the transfer
//         // position is not affected
//         for (var ii = _this.comments.length - 1; ii > -1; ii--) {
//             for (var jj = 0; jj < params.listOfCommentsToSubmap.length; jj++) {
//                 if (params.listOfCommentsToSubmap[jj] === '' + _this.comments[ii]._id) {
//                     submap.comments.push(_this.comments.splice(ii, 1)[0]);
//                 }
//             }
//         }
//
//         // the most wicked part of code
//         // move nodes and fix connections
//         var nodesToSave = [];
//         var transferredNodes = [];
//
//         for (var i = _this.nodes.length - 1; i >= 0; i--) {
//             var index = params.listOfNodesToSubmap.indexOf('' + _this.nodes[i]._id);
//             if (index === -1) { // node not on the list to transfer
//                 var notTransferredNode = _this.nodes[i];
//                 // if a node from the parent map depends on a node just transfered to the submap
//                 // it is necessary to replace that dependency
//                 for (var j = notTransferredNode.outboundDependencies.length - 1; j >= 0; j--) {
//                     if (params.listOfNodesToSubmap.indexOf('' + notTransferredNode.outboundDependencies[j]) > -1) {
//                         notTransferredNode.outboundDependencies.set(j, submapNode);
//                         // transfer the info about the connection
//
//                         notTransferredNode.moveDependencyData(notTransferredNode.outboundDependencies[j], submapNodeID);
//
//                         nodesToSave.push(notTransferredNode);
//                     }
//                 }
//
//                 // if a transferred node depends on non-transfered
//                 // make the submap node depend on non-transfered
//                 for (var jjj = notTransferredNode.inboundDependencies.length - 1; jjj >= 0; jjj--) {
//                     if (params.listOfNodesToSubmap.indexOf('' + notTransferredNode.inboundDependencies[jjj]) > -1) {
//                         notTransferredNode.inboundDependencies.set(jjj, submapNode);
//
//                         // transfer the info about the connection
//                         notTransferredNode.moveDependencyData(notTransferredNode.inboundDependencies[jjj], submapNodeID);
//
//                         nodesToSave.push(notTransferredNode);
//                     }
//                 }
//             } else {
//
//                 var transferredNode = _this.nodes.splice(i, 1)[0];
//                 transferredNode.parentMap = submap._id; // transfer the node
//                 submap.nodes.push(transferredNode);
//                 transferredNodes.push(transferredNode);
//
//                 // if a transfered node depends on a non-transferred node
//                 for (var k = transferredNode.outboundDependencies.length - 1; k >= 0; k--) {
//                     if (params.listOfNodesToSubmap.indexOf('' + transferredNode.outboundDependencies[k]) === -1) {
//                         var dependencyAlreadyEstablished = false;
//                         submapNode.outboundDependencies.push(transferredNode.outboundDependencies[k]); // the submap node will replace the transfered node
//
//                         // transfer the info about the connection, both must be saved later
//                         submapNode.stealDependencyData(transferredNode, transferredNode.outboundDependencies[k]);
//
//                         transferredNode.outboundDependencies.splice(k, 1); // and the node will loose that connection
//                     }
//                 }
//
//                 // if a transfered node is required by non-transfered node
//                 for (var kk = transferredNode.inboundDependencies.length - 1; kk >= 0; kk--) {
//                     if (params.listOfNodesToSubmap.indexOf('' + transferredNode.inboundDependencies[kk]) === -1) {
//                         submapNode.inboundDependencies.push(transferredNode.inboundDependencies[kk]);
//
//                         // steal the info about the connection, both must be saved later
//                         submapNode.stealDependencyData(transferredNode, transferredNode.inboundDependencies[kk]);
//
//                         transferredNode.inboundDependencies.splice(kk, 1);
//                     }
//                 }
//             }
//         }
//
//         // calculate position of the submap node
//         submapNode.x = params.coords ? params.coords.x : calculateMean(transferredNodes, 'x');
//         submapNode.y = params.coords ? params.coords.y : calculateMean(transferredNodes, 'y');
//
//         removeDuplicatesDependencies(nodesToSave);
//
//         var totalNodesToSave = nodesToSave.concat(transferredNodes);
//
//         for (var z = 0; z < totalNodesToSave.length; z++) {
//             promises.push(totalNodesToSave[z].save());
//         }
//
//         removeDuplicatesDependencies([submapNode]);
//         promises.push(submapNode.save());
//         promises.push(submap.save());
//         promises.push(_this.save());
//         return q.allSettled(promises).then(function(results){
//           return results[results.length-1].value;
//         });
//     };

    workspace[conn.name] = conn.model('Workspace', workspaceSchema);
    return workspace[conn.name];
};
module.exports.migrator = migrator;
