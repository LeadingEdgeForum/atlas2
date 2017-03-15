/*jshint esversion: 6 */

import React from 'react';
import ReactDOM from 'react-dom';
var CanvasWrapper = require('./pages/workspace/maps/editor/canvas-with-background.js').default;
/*jshint -W117 */
require('jsplumb');
var jsPlumb = window.jsPlumb;
/*jshint -W117 */
jsPlumb.ready(function() {
    ReactDOM.render( < CanvasWrapper nodes = {
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
        document.getElementById('root'));
});
// jsPlumb.initialize();
