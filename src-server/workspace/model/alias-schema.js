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
var modelLogger = require('./../../log').getLogger('AliasSchema');
var q = require('q');

var alias = null;
module.exports = function(conn){
    
    if(alias){
        return alias;
    }
    /**
     * see capability-category-schema for explanations.
     */

    var AliasSchema = new Schema({
        nodes: [{
            type: Schema.Types.ObjectId,
            ref: 'Node'
        }]
    });


    // alias can group a list of nodes. So if we delete an alias, we have to unprocess all the nodes that were in the alias.
    AliasSchema.pre('remove', function(next) {
        modelLogger.trace('alias pre remove');
        var Node = require('./node-schema')(conn);
        var promises = [];
        var nodes = this.nodes.map(n => new ObjectId(n));
        nodes.forEach(function(n) {
            promises.push(Node.update({
                _id: n
            }, {
                $set: {
                    processedForDuplication: false
                }
            }, {
                safe: true
            }).exec());
        });
        q.all(promises).then(function(results) {
            modelLogger.trace('alias removing results', results);
            next();
        }, function(err) {
            modelLogger.error(err);
            next(err);
        });
    });
    
    alias = conn.model('Alias', AliasSchema);
    return alias;
};