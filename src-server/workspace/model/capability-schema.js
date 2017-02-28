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
var modelLogger = require('./../../log').getLogger('CapabilitySchema');
var q = require('q');
/**
 * see capability-category-schema for explanations.
 */


var capability = null;

module.exports = function(conn){
    if(capability){
        return capability;
    }
    var CapabilitySchema = new Schema({
        aliases: [{
            type: Schema.Types.ObjectId,
            ref: 'Alias'
        }]
    });

    CapabilitySchema.pre('remove', function(next) {
        var Alias = require('./alias-schema')(conn);
        var Node = require('./node-schema')(conn);
        var promises = [];
        var _id = this._id;
        var aliases = this.aliases.map(n => n); // unmark all nodes processed for
                                                // duplication
        modelLogger.trace('unprocessing aliases', aliases);
        aliases.forEach(function(a) {
            promises.push(
                Alias.findById(new Object(a))
                .then(function(alias) {
                    alias.nodes.forEach(function(n) {
                        modelLogger.trace('unprocessing node', n);
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
                    return alias;
                }).then(function(alias) {
                    return alias.remove();
                })
            );
        });
        var CapabilityCategory = require('./capability-category-schema')(conn);
        promises.push(CapabilityCategory.update({
            capabilities: _id
        }, {
            $pull: {
                capabilities: _id
            }
        }, {
            safe: true
        }).exec());
        q.all(promises).then(function(results) {
            modelLogger.trace('unprocessing results', results.length);
            next();
        }, function(err) {
            modelLogger.error(err);
            next(err);
        });
    });
    
    capability = conn.model('Capability', CapabilitySchema);
    return capability;
};