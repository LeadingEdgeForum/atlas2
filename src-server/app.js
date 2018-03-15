//#!/bin/env node
/* Copyright 2017 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*eslint-env node*/
/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var userProvider = require('./user-provider.js');
var freshdesk = require('./freshdesk-helper');


var app = express();

var webpack_middleware = null;

if (process.env.PRODUCTION) {
    console.log('forcing https');
    app.enable('trust proxy');
    app.use(function(req, res, next) {
        if (req.secure) {
            next();
        } else {
            res.redirect('https://' + req.headers.host + req.url);
        }
    });
}

var mongoose = require('mongoose');
var q = require('q');
mongoose.Promise = q.Promise;
var MongoDBConnection = require('./mongodb-helper');
var conn = mongoose.createConnection(MongoDBConnection.atlas2.connectionURL, MongoDBConnection.atlas2.options);

if (typeof global.it !== 'function') {
  require('./workspace/model/migrator')(conn);
}


var debug = false;
debug = true;
if (typeof global.it === 'function') {
  debug = false;
}
if (debug){
  try{
    var webpack = require('webpack');
    var config = require('../webpack.config');
    config.devtool =  'source-map';
    config.mode = 'development';
    var compiler = webpack(config);
    app.webpack_middleware = require('webpack-dev-middleware')(compiler);
    app.use(app.webpack_middleware);
  }catch(e){
    console.log(e);
  }
}


var config = {
    userProvider : {
        type : 'passport',
        strategy : 'anonymous'
    }
};

try {
  config = require('../config.json');
} catch (ex) {

}

if (typeof global.it === 'function') {
  //testing, use anonymous
  config.userProvider.type = 'passport';
  config.userProvider.strategy = 'anonymous';
}

app.use(morgan('combined'));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));


app.use(require('express-session')({
  resave:true,
  secret:'nosecret',
  saveUninitialized:'true'}));
app.use(require('cookie-parser')());


// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

const BUILD_UI_PATH = '../build-ui';
const NODE_MODULES_PATH = '../node_modules';

app.get('/css/bootstrap.min.css', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/css/bootstrap.min.css'));
});

app.get('/css/bootstrap.min.css.map', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/css/bootstrap.min.css.map'));
});

app.get('/css/bootstrap-slider.min.css', function(req, res) {
    res.sendFile(path.join(__dirname, NODE_MODULES_PATH + '/react-bootstrap-slider/src/css/bootstrap-slider.min.css'));
});

app.get('/fonts/glyphicons-halflings-regular.eot', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/fonts/glyphicons-halflings-regular.eot'));
});

app.get('/fonts/glyphicons-halflings-regular.svg', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/fonts/glyphicons-halflings-regular.svg'));
});

app.get('/fonts/glyphicons-halflings-regular.ttf', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/fonts/glyphicons-halflings-regular.ttf'));
});

app.get('/fonts/glyphicons-halflings-regular.woff', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/fonts/glyphicons-halflings-regular.woff'));
});

app.get('/fonts/glyphicons-halflings-regular.woff2', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/fonts/glyphicons-halflings-regular.woff2'));
});

app.get('/img/LEF_logo.png', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/img/LEF_logo.png'));
});

app.get('/img/human-figure.svg', function(req, res) {
    res.sendFile(path.join(__dirname, BUILD_UI_PATH + '/img/human-figure.svg'));
});

var appJs = path.join(__dirname, BUILD_UI_PATH + '/js/app.js');
var index = path.join(__dirname, BUILD_UI_PATH + '/index.html');
if(process.env.AUTH0_FORCE !== 'true'){
  if(config.userProvider.type === 'passport'){
    console.log('using password');
    if(config.userProvider.strategy === 'google'){
      appJs = path.join(__dirname, BUILD_UI_PATH + '/js/google-app.js');
      if(debug){ // for debug use local names
        index = path.join(__dirname, BUILD_UI_PATH + '/google-index.html');
      }
    } else if(config.userProvider.strategy === 'ldap' || config.userProvider.strategy === 'anonymous'){
      console.log('using l-p');
      appJs = path.join(__dirname, BUILD_UI_PATH + '/js/l-p-app.js');
      if(debug){
        index = path.join(__dirname, BUILD_UI_PATH + '/l-p-index.html');
      }
    } else {
      console.error('unrecognized auth strategy', config.userProvider.strategy);
    }
  }
} else {
  console.log('forced auth0');
}
app.get('/app.js', function(req, res) {
    res.sendFile(appJs);
});

if(debug){// for debug use local names
    app.get('/google-app.js', function(req, res) {
        res.sendFile(appJs);
    });

    app.get('/l-p-app.js', function(req, res) {
        res.sendFile(appJs);
    });
}

app.get('/js/freshdesk.js', freshdesk);

userProvider.installUserProvider(app, config, conn);

app.use('/api/tos', require('./tos/tos.js')(conn).router);
let routerModule = require('./workspace/workspace-router.js')(userProvider.getGuard(), conn);
app.use('/api', routerModule.router);

var imageRendererModule = require('./workspace/image-renderer.js')(userProvider.getGuard(), conn, app.webpack_middleware);
app.use('/img', imageRendererModule.router);


let shutdownHandler = function(){
    // console.log('shutting down');
    return imageRendererModule
      .shutdown()
      .then(function(){
        // console.log('closing connection');
        conn.close(function(){
            console.log('...exiting process');
            process.exit();
        });
      });
};

process.on('SIGINT', shutdownHandler);
process.on('exit', shutdownHandler);

app.get('*', function(req, res) {
    res.sendFile(index);
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);

});



let ioServ = require('socket.io').listen(server);
ioServ.on('connection', function(socket) {

  socket.on('map', function(msg) {
    if (msg.type === 'sub') {
      socket.join(msg.id);
    }
    if (msg.type === 'unsub') {
      socket.leave(msg.id);
    }
    if (msg.type === 'change') {
      socket.broadcast.to(msg.id).emit('mapchange', msg);
    }
  });

  socket.on('workspace', function(msg) {
    if (msg.type === 'sub') {
      socket.join(msg.id);
    }
    if (msg.type === 'change') {
      socket.broadcast.to(msg.id).emit('workspacechange', msg);
    }
    if (msg.type === 'unsub') {
      socket.leave(msg.id);
    }
  });
});

let clientSocket = require('socket.io-client')(appEnv.url, { rejectUnauthorized: false });
routerModule.setSocket(clientSocket);
clientSocket.on('connect_error', function (socket) {
    console.log('socket error', socket);
});
clientSocket.on('error', function (socket) {
    console.log('socket error', socket);
});
clientSocket.on('connect', function () {
    console.log('socket connected', clientSocket);
    routerModule.setSocket(clientSocket);
});


server.___app = app;
server.___conn = conn;
server.___app.io = ioServ;
module.exports=server;
