/* Copyright 2018 Krzysztof Daniel

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
/* globals document */
import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
var CWB = require('./minimal-canvas/canvas-with-background.js').default;
var jsPlumb = require("../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
jsPlumb.init();

/** map is passed via global variables, and once jsplumb is ready -
we render a component. This is expected to be used server side. */
jsPlumb.ready(function() {
    ReactDOM.render( <CWB
          users       = {global.window.OPTS.users}
          nodes       = {global.window.OPTS.nodes}
          comments    = {global.window.OPTS.comments}
          mapID       = {global.window.OPTS.mapID}
          workspaceID = { global.window.OPTS.workspaceID}
          nodeFontSize = {global.window.OPTS.nodeFontSize}
          otherFontSize = {global.window.OPTS.otherFontSize}
          background = "true" /> ,
        document.getElementById('root'));
});
