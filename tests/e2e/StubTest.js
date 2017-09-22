//#!/bin/env node
/* Copyright 2017 Krzysztof Daniel, Leading Edge Forum

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
/*jslint node:true, mocha:true, expr: true */
/*global browser */

var should = require('should');

describe('Atlas 2 E2E tests', function() {


  this.timeout(80000);


  // before(function(done) {
    // chromedriver.start();
    // browser.perform(function() {
    //   console.log('beforeAll');
    // });
    // client.start(done);
  // });


  // beforeEach(function(done) {
    // browser.perform(function() {
    //   console.log('beforeEach');
    // });
    // client.start(done);
  // });


  it('should have the right title - the fancy generator way', function() {
      browser.url('https://duckduckgo.com/');
      browser.setValue('#search_form_input_homepage', 'WebdriverIO');
      browser.click('#search_button_homepage');
      browser.getTitle().should.be.equal('WebdriverIO at DuckDuckGo');
  });


  // afterEach(function(done) {
    // browser.perform(function() {
    //   console.log('afterEach');
    // });
    // client.start(done);
  // });


  // after(function(done) {
    // browser.end(function() {
    //   console.log('afterAll');
    //   chromedriver.stop();
    // });
    // client.start(done);
  // });


});
