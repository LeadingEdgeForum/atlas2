//#!/bin/env node
/* Copyright 2016 Leading Edge Forum

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jslint node:true, mocha:true */
var should = require('should');
var app = require('../app');
var request = require('supertest');


//maybe automate getting test users and test keys from stormpath in the future
var stormpathId = process.env.WM_STORMPATH_TEST_ACCOUNT1_KEY;
var stormpathKey = process.env.WM_STORMPATH_TEST_ACCOUNT1_SECRET;


describe('Workspaces & maps', function() {

    var authorizationHeader = 'Basic ' + new Buffer(stormpathId +":"+stormpathKey).toString("base64");

    before(function(done) {
        this.timeout(2 * 60 * 1000);
        app.___app.on('stormpath.ready', function() {
            console.log('stormpath ready for tests');
            done();
        });
    });

    it('verify login', function(done) {
      request(app).
      get('/api/workspaces')
      .set('Content-type', 'application/json')
      .set('Authorization', authorizationHeader)
      .expect(200)
          .end(function(err, res) {
              done(err);
          });
    });
});
