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
var config = require('../../config.json');

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

  it('Login mechanism', function() {
    var selectedLoginType = config.userProvider.type;
    if(process.env.TRAVIS_EVENT_TYPE === 'cron'){
      // cron tests 'https://atlas2.wardleymaps.com'
      selectedLoginType = 'auth0';
    }
    if(selectedLoginType === 'auth0'){
      browser.url('/');
      browser.click("=Login");
      browser.waitForVisible(".auth0-lock-container");
      browser.waitForVisible('[name="email"]');
      browser.waitForVisible('[name="password"]');
      browser.waitForVisible('button[type="submit"]');
      browser.click('[name="email"]');
      browser.setValue('[name="email"]', process.env.TEST_USER1_LOGIN);
      browser.click('[name="password"]');
      browser.setValue('[name="password"]', process.env.TEST_USER1_PASSWORD);
      browser.click('button[type="submit"]');
      browser.waitForVisible("=Logout");
      browser.waitForVisible("button h4.list-group-item-heading");
      browser.getText("button h4.list-group-item-heading").should.equal("Create a new organization");
    } else if (selectedLoginType === 'passport'){
      if(config.userProvider.strategy === 'anonymous'){
        browser.url('/');
        browser.click("=Login now!");
        browser.waitForVisible("#email");
        browser.waitForVisible('#password');
        browser.waitForVisible('button[type="submit"]');
        browser.click('#email');
        browser.setValue('#email', process.env.TEST_USER1_LOGIN);
        browser.click('#password');
        browser.setValue('#password', process.env.TEST_USER1_PASSWORD);
        browser.click('button[type="submit"]');
        browser.waitForVisible("=Logout");
        browser.waitForVisible("button h4.list-group-item-heading");
        browser.getText("button h4.list-group-item-heading").should.equal("Create a new organization");
      } else {
        console.warn('No tests for passport strategy', config.userProvider.provider);
      }
    } else {
      console.warn('No tests for login type ', selectedLoginType);
    }
  });

  // afterEach(function(done) {
  // });


  // after(function(done) {
  // });


});
