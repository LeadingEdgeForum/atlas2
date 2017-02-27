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
/**
 * Capability category groups capabilites. Capabilities are activities that
 * company does, and usually they map 1:1, unless there are some duplicated
 * activities. In that case, capability can point out to multiple activities.
 * 
 * It is also possible, that the same activity is referenced using multiple
 * names - we call them aliases.
 */
var category = null;
module.exports = function(conn) {
    if (category)
        return category;

    category = conn.model('CapabilityCategory', new Schema({
        name : Schema.Types.String,
        capabilities : [ {
            type : Schema.Types.ObjectId,
            ref : 'Capability'
        } ]
    }));
    
    return category;

};
