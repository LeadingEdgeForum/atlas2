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
var track = require('../tracker-helper');
var accessLogger = require('./../log').getLogger('access');


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

function AccessError(status, message){
  this.status = status;
  this.message = message;
}
AccessError.prototype = Object.create(Error.prototype);
AccessError.prototype.constructor = AccessError;

var checkAccess = function(id, user, map) {
  if (!user) {
    accessLogger.error('user.email not present');
    throw new AccessError(401, 'user.email not present');
  }
  if (!map) {
    accessLogger.warn('map ' + id + ' does not exist');
    throw new AccessError(404, 'map ' + id + ' does not exist');
  }
  return map.verifyAccess(user).then(function(verifiedMap) {
    if (!verifiedMap) {
      accessLogger.warn(user + ' has no access to map ' + id + '.');
      throw new AccessError(403, user + ' has no access to map ' + id + '.');
    }
    return verifiedMap;
  });
};

var checkAccess = function(id, user, map) {
  if (!user) {
    accessLogger.error('user.email not present');
    throw new AccessError(401, 'user.email not present');
  }
  if (!map) {
    accessLogger.warn('map ' + id + ' does not exist');
    throw new AccessError(404, 'map ' + id + ' does not exist');
  }
  return map.verifyAccess(user).then(function(verifiedMap) {
    if (!verifiedMap) {
      accessLogger.warn(user + ' has no access to map ' + id + '.');
      throw new AccessError(403, user + ' has no access to map ' + id + '.');
    }
    return verifiedMap;
  });
};

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
var CANVAS_WRAPPER_PATH = '/build-ui/js/canvas-wrapper.js';
var script = null;
var css = fs.readFileSync(r + '/build-ui/css/bootstrap.min.css');
var glyphs = fs.readFileSync(r + '/build-ui/fonts/glyphicons-halflings-regular.svg');

function renderFullPage(opts, canvasScript) {
  return "<!doctype html><html><head><style>" + css + "</style></head><body><div id=\"root\" style=\"background:white\">"
  + "</div><script>OPTS=" + safeStringify(opts) + ";</script><script>" + canvasScript + "</script></body></html>";
}

var atob = require('atob');
var phantom = require('phantom');
var createPhantomPool = require('phantom-pool').default;


var pool = createPhantomPool({
  max: 1, // default
  min: 1, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 60000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  phantomArgs: [['--ignore-ssl-errors=true', '--disk-cache=true'], {logLevel: 'error'}] // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
});

module.exports = function(authGuardian, mongooseConnection, webpack_middleware) {
    if (!webpack_middleware) {
      // middleware not supplied, use the prebuilt file
      try {
        script = fs.readFileSync(r + CANVAS_WRAPPER_PATH);
      } catch (e) {
        console.error('Run "webpack -p" before launching this app in production mode!');
      }
    }

    var WardleyMap = require('./model/map-schema')(mongooseConnection);
    var Workspace = require('./model/workspace-schema')(mongooseConnection);
    var Node = require('./model/node-schema')(mongooseConnection);


    var module = {};

    module.router = require('express').Router();

    var defaultErrorHandler = function(res, err){
        if(err){
            if(err instanceof AccessError){
              return res.status(err.status).send(err.message);
            }
            accessLogger.error(err);
            return res.status(500).send(err.message);
        }
        res.status(500).send("No more details available");
    };

    module.router.get('/:mapID', authGuardian.authenticationRequired, function(req, res) {
        var owner = getUserIdFromReq(req);
        var mapName = req.params.mapID;
        var splitMapName = mapName.split(".");
        if (!(splitMapName.length === 2 && (splitMapName[1] === 'png' || splitMapName[1] === 'html'))) {
            return defaultErrorHandler(res, new AccessError(400, 'wrong request'));
        }
        var mapID = new ObjectId(splitMapName[0]);

        var width = Number(req.query.width);
        if(!Number.isInteger(width) || width < 0 || width > 4000){
          width = 1024;
        }

        var height = Number(req.query.height);
        if(!Number.isInteger(height) || height < 0 || height > 2000){
          height = 800;
        }

        var nodeFontSize = Number(req.query.nodeFontSize);
        if(!Number.isInteger(nodeFontSize) || nodeFontSize < 0 || nodeFontSize > 30){
          nodeFontSize = 11;
        }

        var otherFontSize = Number(req.query.otherFontSize);
        if(!Number.isInteger(otherFontSize) || otherFontSize < 0 || otherFontSize > 30){
          otherFontSize = 10;
        }

        WardleyMap
            .findOne({
                _id: mapID,
                archived: false
            })
            .populate('nodes')
            .exec()
            .then(checkAccess.bind(this, req.params.mapID, owner))
            .then(function(map) {
                var opts = {
                    nodes: map.nodes,
                    comments: map.comments,
                    mapID: mapID,
                    workspaceID: map.workspace,
                    background: true,
                    coords: {
                        size: {
                            width: width,
                            height: height
                        }
                    },
                    nodeFontSize : nodeFontSize,
                    otherFontSize : otherFontSize
                };
                var pageText = renderFullPage(opts, script || webpack_middleware.fileSystem.readFileSync(r + CANVAS_WRAPPER_PATH));

                if(splitMapName[1] === 'html'){
                  res.send(pageText);
                  return;
                }

                pool.use(function(instance) {
                    instance.createPage().then(function(page) {

                        page.property('viewportSize', opts.coords.size);

                        page.property('content', pageText);

                        page.renderBase64('png').then(function(content64) {
                            res.writeHead(200, {
                                'Content-Type': 'image/png'
                            });
                            res.end(atob(content64), 'binary');
                            page.close();
                        });

                    });
                });
            })
            .done(function(v){
              track(owner,'download',{
                'format' : 'png',
                'type' : 'map',
                'id' : splitMapName[0]
              });
            }, defaultErrorHandler.bind(this,res));
    });

    module.shutdown = function(){
        pool.drain().then(function(){
            pool.clear();
        });
    };

    return module;
};
