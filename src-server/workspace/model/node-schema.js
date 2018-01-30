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


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var modelLogger = require('./../../log').getLogger('NodeSchema');
var nodeRemovalLogger = require('./../../log').getLogger('NodeRemoval');
var q = require('q');
let getId = require('../../util/util.js').getId;

var node = {};



module.exports = function(conn){
    if(node[conn.name]){
        return node[conn.name];
    }

    var NodeSchema = new Schema({
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
        width : Schema.Types.Number, //label width, TODO: express in font size relation
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
        action: [{
            x : Schema.Types.Number,
            y : Schema.Types.Number,
            shortSummary : Schema.Types.String,
            description : Schema.Types.String
        }],
        submapID: {
            type: Schema.Types.ObjectId,
            ref: 'WardleyMap'
        },
        responsiblePerson : Schema.Types.String,
        inertia : Schema.Types.Number,
        description : Schema.Types.String,
        /**holds a reference to a submap if there is one (type must be set to SUBMAP)*/
        processedForDuplication: {
            default: false,
            type: Schema.Types.Boolean
        },
        next : [Schema.Types.ObjectId],
        previous : Schema.Types.ObjectId
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
      let Node = require('./node-schema')(conn);

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

    NodeSchema.methods.makeAction = function(dataPos) {
        var relativeX = dataPos.x - this.x;
        var relativeY = dataPos.y - this.y;
        this.action.push({
          x : relativeX,
          y : relativeY
        });
        return this.save();
    };

    NodeSchema.methods.updateAction = function(seq, actionBody) {
        if (actionBody.x && actionBody.y) {
            var relativeX = actionBody.x - this.x;
            var relativeY = actionBody.y - this.y;

            for (var i = 0; i < this.action.length; i++) {
                if ('' + this.action[i]._id === seq) {
                    this.action[i].set('x', relativeX);
                    this.action[i].set('y', relativeY);
                }
            }
        }
        if (actionBody.shortSummary || actionBody.description) {
            for (var j = 0; j < this.action.length; j++) {
                if ('' + this.action[j]._id === seq) {
                    this.action[j].set('shortSummary', actionBody.shortSummary);
                    this.action[j].set('description', actionBody.description);
                }
            }
        }
        return this.save();
    };

    NodeSchema.methods.deleteAction = function(seq) {

        for(var i = 0; i < this.action.length; i++){
          if('' + this.action[i]._id === seq){
            this.action.splice(i,1);
            break;
          }
        }
        this.markModified('action');

        return this.save();
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


    node[conn.name] = conn.model('Node', NodeSchema);

    return node[conn.name];

};
