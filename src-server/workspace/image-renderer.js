//#!/bin/env node
/* Copyright 2016,2017 Leading Edge Forum

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

var _ = require('underscore');
var logger = require('./../log');
var rendererLogger = require('./../log').getLogger('renderer');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var q = require('q');
var _async = require('async');
var React = require('react');
var ReactDom = require('react-dom');
var fs = require('fs');


var log4js = require('log4js');
rendererLogger.setLevel(log4js.levels.WARN);




var getUserIdFromReq = function(req) {
    if (req && req.user && req.user.email) {
        return req.user.email;
    }
    //should never happen as indicates lack of authentication
    console.error('user.email not present');
    return null;
};

if (typeof(window) === 'undefined') {
    global.window = {};
    global.navigator = {
        userAgent: "node.js"
    };
    global.document = {
        documentElement: []
    };
} else {
    console.log(typeof(window));
}

//https://github.com/mhart/react-server-example
// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/<\/(script)/ig, '<\\/$1')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028') // Only necessary if interpreting as JS, which we do
    .replace(/\u2029/g, '\\u2029'); // Ditto
}

var r = process.cwd();
var script = fs.readFileSync(r + '/build-ui/js/canvas-wrapper.js');

function renderFullPage(opts) {
  return "<!doctype html><html><body><div id=\"root\" style=\"background:white\">"
  + "</div><script>OPTS=" + safeStringify(opts) + ";</script><script>" + script + "</script></body></html>";
}

var atob = require('atob');
var phantom = require('phantom');
var multer = require('multer');


var upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1024,
        files: 1
    }
});

// custom helper function
  function wait(testFx, onReady, maxWait, start, ph) {
    var start = start || new Date().getTime();
    if (new Date().getTime() - start < maxWait) {
      testFx(function(result) {
        if (result) {
          onReady();
        } else {
          setTimeout(function() {
            wait(testFx, onReady, maxWait, start, ph);
          }, 250);
        }
      });
    } else {
      console.error('page timed out');
      ph.exit();
    }
  }

module.exports = function(authGuardian, mongooseConnection) {
    var WardleyMap = require('./model/map-schema')(mongooseConnection);
    var Workspace = require('./model/workspace-schema')(mongooseConnection);
    var Node = require('./model/node-schema')(mongooseConnection);


    var module = {};

    module.router = require('express').Router();

    var defaultAccessDenied = function(res, err) {
        console.error('default error handler', err);
        if (err) {
            return res.send(500);
        }
        res.send(403);
    };

    module.router.get('/:mapID', authGuardian.authenticationRequired, function(req, res) {
        var owner = getUserIdFromReq(req);
        var mapName = req.params.mapID;
        var splitMapName = mapName.split(".");
        if (splitMapName.length !== 2 || splitMapName[1] !== 'png') {
            return defaultAccessDenied(res, 'Invalid req');
        }
        var mapID = new ObjectId(splitMapName[0]);

        WardleyMap
            .findOne({
                _id: mapID,
                archived: false
            })
            .populate('nodes')
            .exec(function(err, result) {
                if (!result) {
                    return res.status(404);
                }
                if (err) {
                    return res.status(500);
                }
                result.verifyAccess(owner, function() {
                    var opts = {
                        nodes: result.nodes,
                        comments: result.comments,
                        mapID: mapID,
                        workspaceID: result.workspaceID,
                        background : true
                    };

                    var pageText = renderFullPage(opts);
                    // return res.send(pageText);

                    phantom.create(['--ignore-ssl-errors=yes']).then(function(ph) {

                        ph.createPage().then(function(page) {

                            page.property('viewportSize', {
                                width: 800,
                                height: 600
                            });



                            page.property('onError', function(msg, trace) {
                                trace.forEach(function(item) {
                                    console.log('  ', item.file, ':', item.line);
                                });
                            });

                            page.property('onConsoleMessage', function(msg, lineNum, sourceId) {
                                console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
                            });

                            page.evaluateJavaScript("function(){ window.OPTS =" + safeStringify(opts)+ "; console.log(JSON.stringify(window.OPTS));}");

                            page.property('content',pageText);

                            wait(function(clb) {
                              page.evaluate(function(){
                                console.log(window.jsplumbreconciled);
                                return window.jsplumbreconciled;
                              }).then(clb);
                            },
                            function(){
                              //http://phantomjs.org/api/webpage/method/render-buffer.html
                              page.renderBase64('png').then(function(content64) {
                                  res.writeHead(200, {
                                      'Content-Type': 'image/png'
                                  });
                                  res.end(atob(content64), 'binary');
                              });

                              page.close();
                              ph.exit();
                            },
                            10000,
                            null,
                            ph
                          );



                        }).catch(
                            function(e) {
                                console.log(e);
                                res.end();
                            }
                        );
                    }).catch(
                        function(e) {
                            console.log(e);
                            res.statusCode = 500;
                            res.end();
                        }
                    );
                }, defaultAccessDenied.bind(null, res));
            });
    });

    return module;
};
