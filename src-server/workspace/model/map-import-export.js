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


function makeDependencyTo(jsonLink, id, node){
    if (!node) {
      console.error('Could not establish', jsonLink, id);
      return null;
    }
    // this calls save
    return node.makeDependencyTo(id);
}

module.exports.mapImport = function(Node, workspace, incomingMapJSON) {
    if (!workspace) {
      return null;
    }
    return workspace
      /* create an empty map with just the title */
      .createAMap({
        name: incomingMapJSON.title
      })
      /* create all the imported nodes */
      .then(function(emptyMap) {
        var promises = [];

        if(!incomingMapJSON.elements){ // null-proof - just in case
          incomingMapJSON.elements = [];
        }
        for (let i = 0; i < incomingMapJSON.elements.length; i++) {
          let currentNode = incomingMapJSON.elements[i];
          promises.push(new Node({
            name: currentNode.name,
            x: 1 - currentNode.maturity,
            y: 1 - currentNode.visibility,
            type: "INTERNAL",
            workspace: emptyMap.workspace,
            parentMap: emptyMap._id,
            description: "",
            inertia: 0,
            responsiblePerson: "",
            constraint: 0,
            foreignKey: currentNode.id // this needs to be stored for export and external diffs
          }).save());
        }

        /* once nodes are created, push them into nodes array */
        return q.allSettled(promises).then(function(results) {
          for (let i = 0; i < results.length; i++) {
            emptyMap.nodes.push(results[i].value);
          }
          return emptyMap.save();
        });
      })
      .then(function(mapWithNodes) {
        // at this point we have a map with nodes and foreign keys
        // we need to translate json connections (based on foreign keys)
        // to use real _id we have in db


        // iteration one, build a lookup table connecting foreignKey with _ids
        // created by db during save in previous chapter
        let foreignKeyMap = {};
        for (let i = 0; i < mapWithNodes.nodes.length; i++) {
          let foreignKey = mapWithNodes.nodes[i].foreignKey;
          // the node may or not be expanded. Try to use _id (expanded),
          // and if there is none, use the object (hopefully _id).
          foreignKeyMap[foreignKey] = mapWithNodes.nodes[i]._id || mapWithNodes.nodes[i];
        }

        // iterate over JSON links and establish appropriate connections
        // use foreignKey to locate real dependency _id
        let promises = [];
        if(!incomingMapJSON.links){ // null-proof - links are not mandatory
          incomingMapJSON.links = [];
        }
        for (let i = 0; i < incomingMapJSON.links.length; i++) {
          promises.push(
            Node
            .findOne(foreignKeyMap[incomingMapJSON.links[i].start])
            .exec()
            .then(
              makeDependencyTo.bind(
                this,
                incomingMapJSON.links[i], //for debugging only
                foreignKeyMap[incomingMapJSON.links[i].end]) //the dep to be made
            )
          );
        }
        // and once all connections are saved, return the fully imported map
        return q.allSettled(promises).then(function(r) {
          return mapWithNodes.defaultPopulate();
        });
      });
};

module.exports.mapExport = function(map) {
  let newMap = {
    title: '',
    elements: [],
    links: []
  };
  newMap.title = map.name;

  let foreignKeyMap = {};
  for (let i = 0; i < map.nodes.length; i++) {
    foreignKeyMap['' + map.nodes[i]._id] = map.nodes[i].foreignKey;
  }

  for (let i = 0; i < map.nodes.length; i++) {
    let node = map.nodes[i];
    //translate nodes
    newMap.elements.push({
      id: '' + (node.foreignKey || node._id),
      name: node.name,
      visibility: 1 - node.y, //atlas uses screen based positioning
      maturity: 1 - node.x
    });

    //translate links
    for (let j = 0; j < node.outboundDependencies.length; j++) {
      let targetId = node.outboundDependencies[j];
      newMap.links.push({
        start: '' + (foreignKeyMap['' + node._id] || node._id),
        end: '' + (foreignKeyMap[targetId] || targetId)
      });
    }
  }

  // sort nodes to avoid unnecessary diffs
  newMap.elements.sort(function(a, b) {
    let aName = a.id;
    let bName = b.id;
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });

  newMap.links.sort(function(a, b) {
    if (a.start < b.start) {
      return -1;
    }
    if (a.start > b.start) {
      return 1;
    }
    if (a.end < b.end) {
      return -1;
    }
    if (a.end > b.end) {
      return 1;
    }
    return 0;
  });

  return newMap;
};
