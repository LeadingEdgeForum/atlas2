//#!/bin/env node
/* Copyright 2017 Leading Edge Forum

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


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const getId = require('../../util/util.js').getId;

const node = {};



module.exports = function(conn){
    if(node[conn.name]){
        return node[conn.name];
    }

    const NodeSchema = new Schema({
        /*
          EXPERIMENTAL - subject to change without notification.
          this is a special field that stores the ID of an imported map.
          Atlas2 nodes must have globally individual ids, and this will not be
          the case if the map is exported and then imported.
        */
        foreignKey: Schema.Types.String,
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace'
        },
        /*
         * This year, I have understood that nodes do not form a single map.
         * The entire company (workspace) contains nodes (grouped by timeline),
         * and those nodes can be used to form maps. One node can be used many
         * times, that means that a node can have multiple parent maps.
         */
        parentMap: [{
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        }],
        name: Schema.Types.String,
        //evolution
        evolution: Schema.Types.Number,
        // visibility may be different on different maps
        visibility: [{
          value: Schema.Types.Number,
          map: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
          }
        }],
        width : Schema.Types.Number, //label width,
        type: Schema.Types.String,
        constraint: Schema.Types.Number, // 0 - none, 10 - constraint, 20 - barrier
        dependencies: [{
            target : {
              type: Schema.Types.ObjectId,
              ref: 'Node'
            },
            visibleOn : [{
              type: Schema.Types.ObjectId,
              ref: 'WardleyMap'
            }],
            displayData : {
              label : Schema.Types.String,
              description : Schema.Types.String,
              connectionType : Schema.Types.Number
            }
        }],
        submapID: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        },
        responsiblePerson : Schema.Types.String,
        inertia : Schema.Types.Number,
        description : Schema.Types.String,
        status : {
          type: String,
          enum: ['PROPOSED','EXISTING','SCHEDULED_FOR_DELETION','DELETED'],
          default: 'EXISTING',
          required: true
        },
        analysis : {
          type: Schema.Types.ObjectId,
          ref: 'Analysis'
        }
    }, {
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    });

    NodeSchema.virtual('actions', {
      ref : 'Project',
      localField : '_id',
      foreignField : 'affectedNodes'
    });

    NodeSchema.methods.makeDependencyTo = function(_mapId, _targetId) {
      let Node = require('./node-schema')(conn);

      _targetId = getId(_targetId);
      _mapId = getId(_mapId);
      let _this = this;

      return Node
        .findOne({
          _id: _targetId,
          parentMap: _mapId
        })
        .exec().then(function(targetNode) {
          if(!targetNode){
            throw new Error('Dependencies between different maps are not supported');
          }
          let found = false;
          for(let i = 0; i < _this.dependencies.length; i++){
            let currentDependency = _this.dependencies[i];
            if(currentDependency.target.equals(_targetId)){
              // the dependency is already there. There are two possibilities here.
              // 1. It is not visible on current map
              // 2. It is visible, which means we are attempting to duplicate a connection,
              // which we should not do.
              // So, support the first case and break further processing.
              found = true;
              let contains = false;
              for(let j = 0; j < currentDependency.visibleOn.length; j++){
                if(currentDependency.visibleOn[j].equals(_mapId)){
                  contains = true;
                }
              }
              if(!contains){
                currentDependency.visibleOn.push(_mapId);
              }

              break;
            }
          }
          if(!found){
            // the dependency was not found at all, let's create it
            _this.dependencies.push({
              target : _targetId,
              visibleOn : [_mapId],
              displayData : {
                connectionType : 0,
                description : "",
                label : ""
              }
            });
          }
          return _this.save();
        });
    };

    NodeSchema.methods.removeDependencyTo = function(_mapId, _targetId, onAllMaps) {
      _targetId = getId(_targetId);
      _mapId = getId(_mapId);
      let _this = this;

      for (let i = 0; i < _this.dependencies.length; i++) {
        let currentDependency = _this.dependencies[i];
        if (currentDependency.target.equals(_targetId)) {
          if (onAllMaps) {
            _this.dependencies.splice(i, 1);
          } else {
            currentDependency.visibleOn.pull(_mapId);
          }
          break;
        }
      }

      return _this.save();
    };

    NodeSchema.methods.updateDependencyTo = function(_targetId, data) {
        let _this = this;
        _targetId = getId(_targetId);
        for (let i = 0; i < _this.dependencies.length; i++) {
          if (_this.dependencies[i].target.equals(_targetId)) {
            if(data.type || data.label || data.description){
              if(!_this.dependencies[i].displayData){
                _this.dependencies[i].displayData = {
                  connectionType : 0,
                  description : "",
                  label : ""
                };
              }
            }
            if(data.connectionType !== undefined){
              _this.dependencies[i].displayData.connectionType = data.connectionType;
            }
            if(data.label){
              _this.dependencies[i].displayData.label = data.label;
            }
            if(data.description){
              _this.dependencies[i].displayData.description = data.description;
            }
            break;
          }
        }
        return _this.save();
    };

    //dependency switch in one node. New node was introduced in place
    // of existing dependency, so we have to move data
    NodeSchema.methods.moveDependencyData = function(sourceId, targetId) {
        sourceId = '' + sourceId;
        targetId = '' + targetId;
        if(!this.dependencyData){
          return; // no data, quit happily
        }
        if(this.dependencyData.outbound && this.dependencyData.outbound[sourceId]){
          this.dependencyData.outbound[targetId] = this.dependencyData.outbound[sourceId];
          delete this.dependencyData.outbound[sourceId];
          this.markModified('dependencyData');
        }
    };

    //we want to have exact dependencies as another node has.
    NodeSchema.methods.stealDependencyData = function(node, sourceId) {
        var targetId = '' + node._id;
        sourceId = '' + sourceId;

        if(!node || !node.dependencyData){
          return; //nothing to steal, quit
        }
        if(!this.dependencyData){ // no data placeholder, create it
          this.dependencyData = {
            outbound : {}
          };
          this.markModified('dependencyData');
        }
        if(!this.dependencyData.outbound){
          this.dependencyData.outbound = {};
          this.markModified('dependencyData');
        }
        if(node.dependencyData.outbound && node.dependencyData.outbound[sourceId]){
          this.dependencyData.outbound[targetId] = node.dependencyData.outbound[sourceId];
          delete node.dependencyData.outbound[sourceId];
          this.markModified('dependencyData');
          node.markModified('dependencyData');
        }
    };

    NodeSchema.methods.verifyAccess = function(user) {
        const Workspace = require('./workspace-schema')(conn);
        const Node = require('./node-schema')(conn);
        const nodeId = getId(this);
        const _this = this;
        return Workspace.findOne({
            owner: user,
        }).exec().then(function(workspace) {
            return Node.findOne({
                _id: nodeId,
                workspace: getId(workspace)
            }).exec()
                .then(function(node) {
                    if (workspace) {
                        return _this; // if we found workspace, then we have access to the node
                    } else {
                        return null;
                    }
                });
        });
    };


    node[conn.name] = conn.model('Node', NodeSchema);

    return node[conn.name];

};
