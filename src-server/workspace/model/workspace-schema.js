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
/**
 * Workspace, referred also as an organization, is a group of maps that all
 * refer to the same subject, for example to the company. Many people can work
 * on maps within a workspace, and they all have identical access rights.
 */
var workspace = null;
module.exports = function(conn) {
    if (workspace) {
        return workspace;
    }
    var workspaceSchema = new Schema({
        name : Schema.Types.String,
        purpose : Schema.Types.String,
        description : Schema.Types.String,
        owner : [ {
            type : Schema.Types.String
        } ],
        archived : Schema.Types.Boolean,
        maps : [ {
            type : Schema.Types.ObjectId,
            ref : 'WardleyMap'
        } ],
        capabilityCategories : [ {
          name : Schema.Types.String,
          capabilities : [ {
            aliases: [{
              nodes: [{
                  type: Schema.Types.ObjectId,
                  ref: 'Node'
              }]
            }]
          } ]
        } ]
    });


    workspaceSchema.statics.initWorkspace = function(name, description, purpose, owner, callback) {
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
            capabilityCategories : [
              { name:'Customer Service', capabilities : []},
              { name:'Administrative', capabilities : []},
              { name:'Quality', capabilities : []},
              { name:'Operational', capabilities : []},
              { name:'Sales and Marketing', capabilities : []},
              { name:'Research', capabilities : []},
              { name:'Finances', capabilities : []}
            ]
        });
        wkspc.save(callback);
    };

    workspaceSchema.statics.getAvailableSubmapsForMap = function(mapID, owner, success_callback, accessDenied) {
        var Workspace = require('./workspace-schema')(conn);
        Workspace.findOne({
            owner: owner,
            maps: mapID
        }).exec(function(err, result) {
            if (err) {
                return accessDenied(err);
            }
            if (!result) {
                return accessDenied();
            }
            var WardleyMap = require('./map-schema')(conn);
            // so we have a map that has a workspaceID, now it is time to look for all the maps within the workspace that has submap flag
            // we obviously miss a case where the map is already referenced, but let's leave it for future
            WardleyMap.find({
              workspace : result._id,
              archived: false,
              isSubmap : true
            }).exec(function(err, results){
              if(err){
                return accessDenied(err);
              }
              //handle the results - repack them into something useful.
              // no need to verify access to individual maps as we have confirmed the access to the workspace
              var listOfAvailableSubmaps = [];
              for(var i = 0; i < results.length; i++){
                listOfAvailableSubmaps.push({_id:results[i]._id, name:results[i].name});
              }
              success_callback(listOfAvailableSubmaps);
            });
        });

    };


    workspaceSchema.statics.getSubmapUsage = function(submapID, user, success_callback, accessDenied) {
        var WardleyMap = require('./map-schema')(conn);
        // step one - check access to the submap
        WardleyMap.findOne({
            _id: submapID
        }).exec(function(err, result) {
            if (err) {
                return accessDenied(err);
            }
            if (!result) {
                return accessDenied();
            }
            var workspaceID = result.workspace;
            result.verifyAccess(user, function() {
                // at this point we know we have access to the submap and workspace,
                // so it is time to query workspace for all nodes that reference this submap
                require('./node-schema')(conn).findSubmapUsagesInWorkspace(submapID, workspaceID, success_callback, accessDenied);
            }, accessDenied);
        });
    };

    workspaceSchema.statics.createMap = function(workspaceID, editor, user, purpose, responsiblePerson, success_callback, error_callback) {
        var WardleyMap = require('./map-schema')(conn);
        var Workspace = require('./workspace-schema')(conn);

        if (!workspaceID) {
            return error_callback();
        }
        if (!user) {
            user = "your competitor";
        }
        if (!purpose) {
            purpose = "be busy with nothing";
        }
        Workspace.findOne({ //this is check that the person logged in can actually write to workspace
            _id: workspaceID,
            owner: editor,
            archived: false
        }, function(err, result) {
            if (err) {
                return error_callback(err);
            }
            if (!result) {
                return error_callback();
            }

            var wm = new WardleyMap({
                user: user,
                purpose: purpose,
                workspace: result._id,
                archived: false,
                responsiblePerson : responsiblePerson
            });
            wm.save(function(err, savedMap) {
                if (err) {
                    return error_callback(err);
                }
                result.maps.push(savedMap._id);
                result.save(function(err, saveResult) {
                    if (err) {
                        return error_callback(err);
                    }
                    success_callback(savedMap.toObject());
                });
            });
        });
    };

    workspace = conn.model('Workspace', workspaceSchema);
    return workspace;
};
