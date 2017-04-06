//#!/bin/env node
/* Copyright 2016 Krzysztof Daniel

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


/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('tracker-helper');

var key = process.env.WOOPRA_PROJECT_KEY;
var woopra = null;
if (key) {
    try {
        var Woopra = require('woopra');
        woopra = new Woopra(key, {
            ssl: true
        });
        logger.info('tracking configured');
    } catch (e) {
        logger.error('something is wrong with woopra', e);
    }
} else {
    logger.warn('tracking not configured');
}

var track = function(user, eventname, properties) {
    if (woopra) {
        woopra.identify(user).track(eventname, properties);
    }
};
module.exports = track;
