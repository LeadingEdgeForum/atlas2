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


module.exports = function(mongooseConnection) {
  var licenceText = null;

  try {
      licenceText = require('../../tos-content-custom.json');
  } catch(e){
      console.error('Custom licence not found',e);
      try {
          licenceText = require('../../tos-content.json');
      } catch(e){
          console.error('Licence not found',e);
          licenceText = null;
      }
  }

  var module = {};

  module.router = require('express').Router();

  module.router.get('/', function(req, res) {
      res.json({"termsOfService" : licenceText});
  });

  return module;
};
