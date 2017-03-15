/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
var CWB = require('./pages/workspace/maps/editor/canvas-with-background.js').default;
var jsPlumb = require("../node_modules/jsplumb/dist/js/jsplumb.min.js").jsPlumb;
console.error('prerender',new Date().getTime());
jsPlumb.init();
jsPlumb.ready(function() {
  console.error('jsplumb ready', new Date().getTime());
    ReactDOM.render( < CWB nodes = {
            window.OPTS.nodes
        }
        comments = {
            window.OPTS.comments
        }
        mapID = {
            window.OPTS.mapID
        }
        workspaceID = {
            window.OPTS.workspaceID
        }
        background = "true" / > ,
        document.getElementById('root'), function(){
          console.error('postrender', new Date().getTime());
        });
});
