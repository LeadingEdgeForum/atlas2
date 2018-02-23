/* Copyright 2018  Krzysztof Daniel.
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
const ObjectId = mongoose.Types.ObjectId;
const _ = require('underscore');
const q = require('q');
let getId = require('../../util/util.js').getId;
const SchemaDate = Schema.Types.Date;
const project = {};

const String = Schema.Types.String;
const Boolean = Schema.Types.Boolean;
const Number = Schema.Types.Number;

module.exports = function(conn) {

    if (project[conn.name]) {
        return project[conn.name];
    }
    /**
     * see capability-category-schema for explanations.
     */

    const ProjectSchema = new Schema({
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true
        },
        type : {
          type : String,
          enum:['EFFORT', 'REPLACEMENT', 'PROPOSAL', 'REMOVAL_PROPOSAL',/*not implemented yet*/'DEDUPLICATION'],
          required :true
        },
        state : {
          type : String,
          enum:['PROPOSED', 'EXECUTING', 'REJECTED', 'FAILED', 'SUCCEEDED', 'DELETED'],
          required :true
        },
        description : String,
        shortSummary : String,
        affectedNodes : [{
            type: Schema.Types.ObjectId,
            ref: 'Node',
        }],
        targetId : {
            type: Schema.Types.ObjectId,
            ref: 'Node',
        },
        evolution: Number,
        visibility: Number,
        schemaVersion : {
          type: Schema.Types.Number,
          default : 5
        }
    }, {
      toObject: {
        virtuals: true
      },
      toJSON: {
        virtuals: true
      }
    });


    ProjectSchema.methods.updateSummaryAndDescription = function(shortSummary, description){
        if(shortSummary || description){
            this.shortSummary = shortSummary;
            this.description = description;
        }
        return this.save();
    };

    /**
     * Does save and returns a promise returning changed project.
     * @param mapId
     * @param newX
     * @param newY
     * @returns {mongoose.Schema.methods}
     */
    ProjectSchema.methods.updateEffort = function(mapId, newX, newY){
        const _this = this;
        if(_this.type !== 'EFFORT'){
            //non effort projects cannot execute this method
            return _this;
        }
        mapId = getId(mapId);
        return q()
            .then(function(){
                if(_this.populated('affectedNodes')){
                    return _this;
                } else {
                    return _this.populate('affectedNodes').execPopulate();
                }})
            .then(function(populatedEffort){
                // effort has only one node
                let affectedNode = populatedEffort.affectedNodes[0];

                let relativeEvolution = newX - affectedNode.evolution;

                //visibility changes relatively to this on some map
                let relativeVisibility = newY - affectedNode.visibility[0].value;
                for(let i = 0; i < affectedNode.visibility; i++){
                    if(getId(affectedNode.visibility[i].map).equals(mapId)){
                        relativeVisibility = newY - affectedNode.visibility[i].value;
                    }
                }
                return {
                    node: affectedNode,
                    relativeEvolution: relativeEvolution,
                    relativeVisibility: relativeVisibility
                };
            })
            .then(function(newPos){
                _this.evolution = newPos.relativeEvolution;
                _this.visibility = newPos.relativeVisibility;
                return _this.save();
            });
    };


    ProjectSchema.methods.updateState = function(targetState){
        const _this = this;
        if(['EXECUTING', 'REJECTED', 'FAILED', 'SUCCEEDED'].indexOf(targetState) === -1){
            console.log('unknown target state', targetState);
            return;
        }
        _this.state = targetState;

        return q()
            .then(function(){
                if(_this.populated('affectedNodes')){
                    return _this;
                } else {
                    return _this.populate('affectedNodes').execPopulate();
                }})
            .then(function(populatedProject){
                /* project manipulations */

                if(_this.state === 'SUCCEEDED' && _this.type === 'EFFORT'){
                    let affectedNode = _this.affectedNodes[0];
                    affectedNode.evolution = affectedNode.evolution + _this.evolution;
                    return affectedNode.save()
                        .then(function(){
                            return populatedProject;
                        });
                }
                // 1. EFFORT SUCCEEDED - node advances in evolution.

                if(_this.state === 'SUCCEEDED' && _this.type === 'REPLACEMENT'){
                    console.log('not implemented');
                    return null;
                }

                if(_this.state === 'SUCCEEDED' && _this.type === 'PROPOSAL'){
                    let affectedNode = _this.affectedNodes[0];
                    if(affectedNode.status === 'PROPOSED'){
                        affectedNode.status = 'EXISTING';
                    }
                    return affectedNode.save()
                        .then(function(){
                            return populatedProject;
                        });
                }

                if(_this.state === 'SUCCEEDED' && _this.type === 'REMOVAL_PROPOSAL'){
                    let affectedNode = _this.affectedNodes[0];
                    if(affectedNode.status === 'SCHEDULED_FOR_DELETION'){
                        affectedNode.status = 'DELETED';
                    }
                    return affectedNode.save()
                        .then(function(){
                            return populatedProject;
                        });
                }

                return populatedProject;
            })
            .then(function(populatedProject){
                return populatedProject.save();
            });
    };

    /**
     * A node has been removed (its state has been changed to 'DELETED',
     * so it is necessary to remove the node from the project, and
     * if it is the last node, we do not remove it, but remove the project.
     * (Project without node does not make a lot of sense).
     *
     * @param node - a node that is being removed
     */
    ProjectSchema.methods.nodeRemoved = function(node){
        let nodeId = getId(node);
        if (this.affectedNodes.length > 1) {
            // the project affected mutliple nodes, so remove the node
            this.affectedNodes.pull(nodeId);
        } else {
            project.state = 'DELETED';
        }
        return this.save();
    };

    ProjectSchema.methods.removeProject = function(){
        this.state = 'DELETED';
        return this.save();
    };

    ProjectSchema.methods.verifyAccess = function(user) {
        const Workspace = require('./workspace-schema')(conn);
        const Project = require('./project-schema')(conn);
        const projectId = getId(this);
        const _this = this;
        return Workspace.findOne({
            owner: user,
        }).exec().then(function(workspace) {
            return Project.findOne({
                _id: projectId,
                workspace: getId(workspace)
            }).exec()
                .then(function(project) {
                    if (workspace) {
                        return _this; // if we found workspace, then we have access to the node
                    } else {
                        return null;
                    }
                });
        });
    };


    project[conn.name] = conn.model('Project', ProjectSchema);
    return project[conn.name];
};
