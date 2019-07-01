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
      browser.getAttribute('#app-container > div > div:nth-child(1) > div > nav > div > div.navbar-header > a > img', 'src').should.be.equal(browser.getUrl() + 'img/LEF-Logo.svg');
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

  it('Create a workspace', function(){
      browser.url('/'); //assume logged in
      // open dialog for new workspace
      browser.waitForVisible("button h4.list-group-item-heading");
      browser.click("button h4.list-group-item-heading");

      browser.waitForVisible('input#name');
      browser.waitForVisible('input#purpose');
      browser.waitForVisible('input#description');

      browser.setValue('input#name', "First organization");
      browser.setValue('input#purpose', "Gain situational awareness");
      browser.setValue('input#description', "Dummy description");

      browser.click('button=Create');

      browser.waitForVisible('.list-group a.list-group-item');

      let list = browser.$('.list-group');
      let orgs = list.$$('a.list-group-item');
      orgs.length.should.be.above(0);
      let orgName = orgs[orgs.length - 1].$('h4').getText();
      should(orgName).be.equal('First organization - Gain situational awareness');
  });

  it('Create a map', function(){
      browser.url('/'); //assume logged in

      // open dialog for new workspace
      browser.waitForVisible("a.list-group-item");
      let list = browser.$('.list-group');
      let orgs = list.$$('a.list-group-item');
      orgs[orgs.length - 1].click();
      // let orgUrl = orgs[orgs.length - 1].getAttribute('href');
      // browser.url(orgUrl);

      browser.waitForVisible("button h4.list-group-item-heading");
      browser.getText("button h4.list-group-item-heading").should.equal("Create a new map");

      browser.click("button h4.list-group-item-heading");

      browser.waitForVisible('input#name');
      browser.waitForVisible('input#responsiblePerson');

      browser.setValue('input#name', "As Chris, I want to gain situational awareness");
      browser.setValue('input#responsiblePerson', "dummy@dummy.dummy");

      browser.getText('h4.modal-title').should.equal('As Chris, I want to gain situational awareness');
      browser.click('button=Create a new map');

      browser.waitForVisible('button=Create a new map',5000, true);
      browser.waitForVisible('.list-group a.list-group-item');

      list = browser.$('.list-group');
      let maps = list.$$('a.list-group-item');
      maps.length.should.be.above(0);
      let mapName = maps[maps.length - 1].$('h4').getText();
      should(mapName).be.equal('As Chris, I want to gain situational awareness');
  });


  it('Create nodes', function(){
      browser.url('/'); //assume logged in

      // open dialog for new workspace
      browser.waitForVisible("a.list-group-item");
      let list = browser.$('.list-group');
      let orgs = list.$$('a.list-group-item');
      orgs[orgs.length - 1].click();
      browser.waitForVisible("a.list-group-item");

      list = browser.$('.list-group');
      let maps = list.$$('a.list-group-item');
      maps[maps.length - 1].click();

      browser.waitForVisible('ol.breadcrumb li a');

      browser.newNode(2, 'testNode1');

      browser.moveNode('testNode1',200,200);

      browser.newNode(2, 'testNode2');

      browser.moveNode('testNode2',-100,-100);
      browser.connectNodes('testNode1','testNode2');

      browser.waitForVisible('//div[text()=\'testNode2\']');

      browser.newNode(1, 'user1-1');
      browser.moveNode('user1-1', 0, -200);
      browser.waitForVisible('//div[text()=\'user1-1\']');

      browser.newNode(1, 'user2-1');
      browser.moveNode('user2-1', -50, -150);
      browser.waitForVisible('//div[text()=\'user2-1\']');

      browser.connectNodes('user1-1','testNode1');
      browser.connectNodes('user2-1','testNode1');
  });

  it('Create a new variant', function(){
      browser.url('/'); //assume logged in
      // open dialog for new workspace
      browser.waitForVisible("a.list-group-item");
      let list = browser.$('.list-group');
      let orgs = list.$$('a.list-group-item');
      orgs[orgs.length - 1].click();
      browser.waitForVisible("a.list-group-item");

      browser.click('ul.nav-tabs li.dropdown a.dropdown-toggle span.glyphicon.glyphicon-cog');
      browser.click('a=Create future variant from currently active');

      browser.waitForVisible("button h4.list-group-item-heading");
      browser.getText("h4.modal-title").should.equal("Create a new variant for your workspace");

      browser.setValue('input#name', "Future");
      browser.setValue('input#description', "Long description");
      browser.click('button=Create a new variant');
      browser.waitForVisible('button=Create a new variant', 6000, true);

      browser.waitForVisible('//*/div/ul[contains(@class,\'nav-tabs\')]/li[2]/a');
      should(browser.getText('//*/div/ul[contains(@class,\'nav-tabs\')]/li[2]/a')).be.equal('Future');
      browser.click('//*/div/ul[contains(@class,\'nav-tabs\')]/li[2]/a');

      // open map
      //tab switching is a pain in the @ss
      browser.waitForVisible("button h4.list-group-item-heading");
      browser.waitForVisible('//*/div/ul[contains(@class,\'nav-tabs\')]/li[2]/a[contains(@aria-selected,true)]');
      browser.waitForVisible('//*[@id="app-container"]/div/div[3]/div[1]/div/div[2]/div/div[2]');
      browser.waitForVisible('//*[@id="app-container"]/div/div[3]/div[1]/div/div[2]/div/div[2]/div/a[1]/p/div/div');
      browser.click('//*[@id="app-container"]/div/div[3]/div[1]/div/div[2]/div/div[2]/div/a[1]/p/div/div');

      browser.waitForVisible('ol.breadcrumb li a');


      // browser.click('#app-container > div > div:nth-child(1) > div > nav > div > div.navbar-collapse.collapse > ul:nth-child(1) > li:nth-child(4) > a');
      browser.click('ul.navbar-nav li a .glyphicon-tags');

      browser.moveNode('testNode1',-100,0);
      browser.newNode(3, 'testNode3');
      browser.moveNode('testNode3',100,0);

      browser.newNode(1, 'user3-1');
      browser.moveNode('user3-1', 100, -150);
      browser.waitForVisible('div=user3-1');

      browser.deleteNode('user1-1');


      // no connection should start in the left upper corner, as no node is there
      browser.waitUntil(function() {
        var svgList = browser.$$("//*[name()='svg']");
        var flag = true;
        var oneSet = false;
        for (let i = 0; i < svgList.length; i++) {
          let img = svgList[i];
          //only sufficiently large images may be connections
          // the try catch is necessary as jsplumb is still manipulating images
          // some references may be stale, we will assert them in the next loop run
          try {
            if (img.getCssProperty('width').parsed &&
              img.getCssProperty('height').parsed &&
              img.getCssProperty('left').parsed &&
              img.getCssProperty('top').parsed &&
              img.getCssProperty('width').parsed.value > 4 &&
              img.getCssProperty('height').parsed.value > 4) {
              if (img.getCssProperty('left').parsed.value < 50 || img.getCssProperty('top').parsed.value < 50) {
                flag = false;
              }
              oneSet = true;
            }
          } catch (e) {
            // console.warn(e);
          }
        }
        return flag && oneSet;
      }, 20000, 'no connection should be in the top left corner');
  });

  it('Verify diff colors', function(){
      //actually continous the previous test
      let queryUser3 = '//*/div[contains(@class,"user-label") and contains(string(),"user3-1")]/..';
      let queryUser1 = '//*/div[contains(@class,"user-label") and contains(string(),"user1-1")]/..';
      should(browser.$(queryUser3).getCssProperty('box-shadow')).exist;
      should(browser.$(queryUser1).getCssProperty('box-shadow')).exist;
      should(browser.$(queryUser3).getCssProperty('box-shadow').value).exist;
      should(browser.$(queryUser1).getCssProperty('box-shadow').value).exist;
      should(browser.$(queryUser3).getCssProperty('box-shadow').value).startWith('rgb(0,128,0)');
      should(browser.$(queryUser1).getCssProperty('box-shadow').value).startWith('rgb(255,0,0)');
  });


  after(function() {
      browser.url('/');
      browser.waitForVisible("a.list-group-item");
      var maxValue = browser.$('.list-group').$$('a.list-group-item').length - 1;
      while( maxValue > -1){
        browser.$('.list-group').$$('a.list-group-item')[maxValue].waitForVisible('button.dropdown-toggle');
        browser.click('button.dropdown-toggle');
        browser.waitForVisible('.glyphicon-remove');
        browser.click('.glyphicon-remove');
        browser.waitForVisible('.glyphicon-remove', 5000, true);
        maxValue --;
      }
  });


});
