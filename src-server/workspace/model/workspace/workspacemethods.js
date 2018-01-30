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
var ObjectId = mongoose.Types.ObjectId;

let findNodeSuggestions = function(workspace, Node, timeSlice, mapId, suggestionText) {

  let regexp = new RegExp(suggestionText, 'i');
  let mapObjectId = new ObjectId(mapId);

  let mapIds = [];
  // we want to show suggestions from all the maps from the current timeline
  // except the map we are working on right now (to avoid duplication)
  for (let j = 0; j < timeSlice.maps.length; j++) {
    let id = timeSlice.maps[j] || timeSlice.maps[j]._id;
    if (!mapObjectId.equals(id)) {
      mapIds.push(id);
    }
  }
  // here we have a list of maps, so let's use them to find appropriate nodes
  return Node.aggregate([{
      $match: {
        parentMap: {
          $in: mapIds.map(function(id) {
            return new mongoose.Types.ObjectId(id);
          })
        }
      }
    },
    {
      $match: {
        name: regexp
      }
    },
    {
      $match: {
        $or: [{
          submapID: {
            $exists: false
          }
        }, {
          submapID: {
            $eq: null
          }
        }]
      }
    }
  ]).exec();
};

let findSubmapSuggestions = function(workspace, WardleyMap, timeSlice, suggestionText) {
  let regexp = new RegExp(suggestionText, 'i');
  let mapIds = [];
  // we want to show suggestions from all the maps from the current timeline
  // except the map we are working on right now (to avoid duplication)
  for (let j = 0; j < timeSlice.maps.length; j++) {
    let id = timeSlice.maps[j] || timeSlice.maps[j]._id;
    mapIds.push(id);
  }
  return WardleyMap.aggregate([{
      $match: { // step 1 - all maps from current timeline (!)
        _id: {
          $in: mapIds.map(function(id) {
            return new mongoose.Types.ObjectId(id);
          })
        }
      }
    },
    {
      $match: {
        isSubmap: true
      }
    },
    {
      $match: { // step 2 - name
        name: regexp
      }
    }
  ]).exec();
};

module.exports.findNodeSuggestions = findNodeSuggestions;
module.exports.findSubmapSuggestions = findSubmapSuggestions;
