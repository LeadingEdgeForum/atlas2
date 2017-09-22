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
  // });


  // beforeEach(function(done) {
  // });


  it('LEF logo should always point to HOME', function() {
      browser.url('/');
      browser.getAttribute('#app-container > div > div:nth-child(1) > div > nav > div > div.navbar-header > a', 'href').should.be.equal(browser.getUrl());
      browser.getAttribute('#app-container > div > div:nth-child(1) > div > nav > div > div.navbar-header > a > img', 'src').should.be.equal(browser.getUrl() + 'img/LEF_logo.png');
      browser.getTitle().should.be.equal('Atlas2, the mapping Tool');
  });


  // afterEach(function(done) {
  // });


  // after(function(done) {
  // });


});
