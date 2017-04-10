//#!/bin/env node
/* Copyright 2017 Krzysztof Daniel

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

var logger = require('./log.js').getLogger('freshdesk-helper');

var key = process.env.FRESHDESK_PROJECT_KEY;
var params = {
    "queryString": "&widgetType=popup",
    "utf8": "✓",
    "widgetType": "popup",
    "buttonType": "text",
    "buttonText": "Support",
    "buttonColor": "white",
    "buttonBg": "#00789b",
    "alignment": "2",
    "offset": "235px",
    "formHeight": "500px",
    "url": null
};
var script = null;
if (key) {
    params.url = key;
    script = 'FreshWidget.init("",' + JSON.stringify(params) + ');';
} else {
    logger.warn('freshdesk not configured');
}

var freshdesk = function(req, res) {
    if (key) {
      res.setHeader('content-type', 'application/javascript');
      res.end(script);
    } else {
      res.send(200);
    }
};
module.exports = freshdesk;
