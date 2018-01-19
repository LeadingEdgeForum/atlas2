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


var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
let q = require('Q');
let getId = require('../../../util/util.js').getId;

/*
  A submap node should be positioned in the place of average visibility and
  average evolution (!). The evolution is averaged from all the components
  included in submap, regardless of whether they are or are not visible.

  The visibility is calculated from components visible on a given map and is map
  specific. We do not want to make too much mess here.
*/
function getSubmapPositions(mongooseObjects, nodeIds, impact) {
  let Node = mongooseObjects.Node;
  let positions = {

    evolutionSum: 0,
    evolutionCount: 0,
    maps: {}
    /*  mapId : {
                nodeVisiblityCount : number,
                visibilitySum : number
              }
          */
  };


  // actually calculate submap position
  return Node.find({
      _id: {
        $in: nodeIds
      }
    }).exec()
    .then(function(nodes) {
      // iterate over submapped nodes. Sum and count evolution of all nodes,
      // sum and count visibility *per map*

      for (let i = 0; i < nodes.length; i++) {
        let analysedNode = nodes[i];

        for (let j = 0; j < analysedNode.visibility.length; j++) {

          // create a record if necessary
          if (!positions[analysedNode.visibility[j].map]) {
            positions.maps[analysedNode.visibility[j].map] = {
              nodeVisiblityCount: 0,
              visibilitySum: 0,
            };
          }
          positions.maps[analysedNode.visibility[j].map].nodeVisiblityCount++;
          positions.maps[analysedNode.visibility[j].map].visibilitySum += analysedNode.visibility[j].value;

        }

        positions.evolutionSum += analysedNode.evolution;
        positions.evolutionCount++;
      }

      return positions;
    })
    .then(function(position) {
      // normalise - calculate averages -  we want to get a nice result
      let result = {
        evolution: (position.evolutionSum / position.evolutionCount),
        visibility: {}
      };
      for (let key in position.maps) {
        if (position.maps.hasOwnProperty(key)) {
          result.visibility[key] = (position.maps[key].visibilitySum / position.maps[key].nodeVisiblityCount);
        }
      }
      return result;

    });
}

/*
This methods form a submap by creating a new map, moving shifting there all the
selected components, moving internal dependecies (got from impact).
*/
function createASubmap(mongooseObjects, workspace, timeSlice, mapId, name, responsiblePerson, nodes, impact) {
  let Node = mongooseObjects.Node;
  let WardleyMap = mongooseObjects.WardleyMap;
  return workspace.createAMap({
      name: name,
      responsiblePerson: responsiblePerson
    }, workspace.nowId, /*mark as submap */ true)
    .then(function(newlyCreatedMap) {
      //inSubmapDependencies those deps have to be copied
      //and nodes, of course
      return Node.find({
        _id: {
          $in: nodes
        }
      }).exec().then(function(nodes) {
        let promises = [];
        for (let i = 0; i < nodes.length; i++) {
          let processedNode = nodes[i];
          // for each node that was pushed to a submap


          //1. set parent map
          processedNode.parentMap = [getId(newlyCreatedMap)];

          //2. adjust visibility - steal it from current map
          // if for some reason it is not missing, take the first available one
          let bestVisibility = processedNode.visibility[0];
          for (let j = 0; j < processedNode.visibility.length; j++) {
            let analysedVisibility = processedNode.visibility[j];
            if (getId(analysedVisibility.map).equals(getId(mapId))) {
              bestVisibility = analysedVisibility;
            }
          }
          bestVisibility.map = getId(mapId);
          processedNode.visibility = [bestVisibility];

          //3. sort out dependencies, only those presented on a map will stay
          //for now, in the future we may have some cross maps dependencies possible
          processedNode.dependencies = [];
          for (let j = 0; j < impact.inSubmapDependencies.length; j++) {
            let processedDependency = impact.inSubmapDependencies[j];
            if (getId(processedDependency.node).equals(getId(processedNode))) {
              processedNode.dependencies = processedNode.dependencies.concat(processedDependency.deps);
            }
          }
          // 3.a ensure dependencies are visible when they should be
          for (let j = 0; j < processedNode.dependencies.length; j++) {
            processedNode.dependencies[j].visibleOn = [getId(mapId)];
          }
          //4. save, piece of cake
          promises.push(processedNode.save());
        }
        return q.all(promises).then(function() {
          return WardleyMap.findById(getId(newlyCreatedMap)).populate('nodes').exec();
        });
      });
    });
}


function createSubmapNode(mongooseObjects, arg, impact, workspace, name, responsiblePerson) {
  // console.log(impact);
  // build visibility and parentMap objects from the position calculation
  let visibility = [];
  let parentMaps = [];
  for (let key in arg.positions.visibility) {
    if (arg.positions.visibility.hasOwnProperty(key)) {
      visibility.push({
        value: arg.positions.visibility[key],
        map: getId(key)
      });
      parentMaps.push(getId(key));
    }
  }
  // now calculate dependencies
  let dependencies = [];
  // the first part is pretty simple. The map depends on all nodes its nodes depend,
  // console.log(arg);
  // with exactly same dependencies (hopefully)
  for (let i = 0; i < impact.outgoingDependencies.length; i++) {
    // console.log('out', i , impact.outgoingDependencies[i].deps);
    dependencies = dependencies.concat(impact.outgoingDependencies[i].deps);
  }

  // console.log('dependencies afterwards', dependencies);

  // we ignore the tangling references for now
  console.warn('some dangling references might have been ignored');

  return new mongooseObjects.Node({
      name: name,
      evolution: arg.positions.evolution,
      visibility: visibility,
      type: 'SUBMAP',
      workspace: getId(workspace),
      parentMap: parentMaps,
      description: '',
      inertia: 0,
      responsiblePerson: responsiblePerson,
      constraint: 0,
      submapID: getId(arg.submap)
    })
    .save()
    .then(function(node) {
      return mongooseObjects.Workspace
        .findOneAndUpdate({
          _id: getId(workspace),
          'timeline._id': workspace.nowId
        }, {
          $push: {
            'timeline.$.nodes': node._id
          }
        }, {
          select: {
            'timeline': {
              $elemMatch: {
                _id: workspace.nowId
              }
            }
          }
        })
        .exec()
        .then(function(res) {
          return node;
        });
    });
}

/*
 * every node that depends on a node injected into the submap, has to switch dependency
 * to a node representing that submap. Which should be as simple as:
 * remove all deps (constistent across all submaps)
 *
 * Further required work:
 *  - [ ] ensure consistency across all the maps
 */
function replaceIncomingDependencies(mongooseObjects, targetNodeId, nodesThatDependOnFutureSubmap, nodesInSubmap) {
  let results = [];
  for (let i = 0; i < nodesThatDependOnFutureSubmap.length; i++) {
    let analysedNode = nodesThatDependOnFutureSubmap[i];

    let atLeastOneMigrated = false;
    for (let j = analysedNode.dependencies.length - 1; j >= 0; j--) {
      let analysedDependency = analysedNode.dependencies[j];

      let isForSubmappedNode = false;
      for (let k = 0; k < nodesInSubmap.length; k++) {
        if (nodesInSubmap[k].equals(analysedDependency.target)) {
          isForSubmappedNode = true;
        }
      }

      if (isForSubmappedNode) {
        //we have to do something with current dependency
        if (atLeastOneMigrated) {
          // we have at least one dependency migrated earlier, we do not want to duplicate them,
          // so just discard it
          analysedNode.dependencies.split(j, 1);
          j--; //index should be shifted after the number of dependencies is reduced
        } else {
          //blatantly switch the first dependency that can be switched
          analysedDependency.target = targetNodeId;
          atLeastOneMigrated = true;
        }
      }
    }
    if (atLeastOneMigrated) {
      results.push(analysedNode.save());
    }
  }
  return q.allSettled(results);
}


/*
Forms a submap but returns some irrelevant crap
*/
function formASubmap(mongooseObjects, workspace, timeSlice, mapId, name, responsiblePerson, nodesInSubmap, impact) {
  let Node = mongooseObjects.Node;
  let Workspace = mongooseObjects.Workspace;

  return createASubmap(mongooseObjects, workspace, timeSlice, mapId, name, responsiblePerson, nodesInSubmap, impact)
    .then(function(submap) {
      return getSubmapPositions(mongooseObjects, nodesInSubmap, impact).then(function(positions) {
        return {
          positions: positions,
          submap: submap
        };
      });
    })
    .then(function(arg) {
      return createSubmapNode(mongooseObjects, arg, impact, workspace, name, responsiblePerson);
    })
    .then(function(node) {
      let nodeId = getId(node);
      // and the heavy part. get everyone depending on a submap to really depend on it
      return replaceIncomingDependencies(mongooseObjects, nodeId, impact.nodesThatDependOnFutureSubmap, nodesInSubmap);
    });
}
module.exports.formASubmap = formASubmap;

// for tests only
module.exports.createASubmap = createASubmap;
module.exports.getSubmapPositions = getSubmapPositions;
module.exports.createSubmapNode = createSubmapNode;
module.exports.replaceIncomingDependencies = replaceIncomingDependencies;
