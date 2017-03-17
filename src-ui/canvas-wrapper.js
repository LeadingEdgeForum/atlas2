/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
var CWB = require('./pages/workspace/maps/editor/canvas-with-background.js').default;
var jsPlumb = require("../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
jsPlumb.init();
jsPlumb.ready(function() {
    ReactDOM.render( < CWB nodes = {
            global.window.OPTS.nodes
        }
        comments = {
            global.window.OPTS.comments
        }
        mapID = {
            global.window.OPTS.mapID
        }
        workspaceID = {
            global.window.OPTS.workspaceID
        }
        background = "true" / > ,
        document.getElementById('root'));
});
