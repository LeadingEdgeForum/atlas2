/*eslint-env node*/
/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var userProvider = require('./src-server/user-provider.js');
var freshdesk = require('./src-server/freshdesk-helper');

var app = express();
var io = null;

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
var MongoDBConnection = require('./src-server/mongodb-helper');
var conn = mongoose.createConnection(MongoDBConnection.atlas2.connectionURL, MongoDBConnection.atlas2.options);
if (!(typeof global.it === 'function')) {
  require('./src-server/workspace/model/migrator')(conn);
}


var debug = false;
debug = true;
if (typeof global.it === 'function') {
  debug = false;
}
if (debug){
  try{
    var webpack = require('webpack');
    var config = require('./webpack.config');
    var compiler = webpack(config);
    app.webpack_middleware = require('webpack-dev-middleware')(compiler);
    app.use(app.webpack_middleware);
  }catch(e){
    console.log(e);
  }
}


var config = {
    userProvider : {
      type:'stormpath'
    }
};

try {
  config = require('./config.json');
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

app.get('/css/bootstrap.min.css', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/css/bootstrap.min.css'));
});

app.get('/css/bootstrap.min.css.map', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/css/bootstrap.min.css.map'));
});

app.get('/css/bootstrap-slider.min.css', function(req, res) {
    res.sendFile(path.join(__dirname, '/node_modules/react-bootstrap-slider/src/css/bootstrap-slider.min.css'));
});

app.get('/fonts/glyphicons-halflings-regular.eot', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.eot'));
});

app.get('/fonts/glyphicons-halflings-regular.svg', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.svg'));
});

app.get('/fonts/glyphicons-halflings-regular.ttf', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.ttf'));
});

app.get('/fonts/glyphicons-halflings-regular.woff', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.woff'));
});

app.get('/fonts/glyphicons-halflings-regular.woff2', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.woff2'));
});

app.get('/img/LEF_logo.png', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/img/LEF_logo.png'));
});

var appJs = path.join(__dirname, '/build-ui/js/app.js');
var index = path.join(__dirname, '/build-ui/index.html');
if(config.userProvider.type === 'passport'){
  console.log('using password');
  if(config.userProvider.strategy === 'google'){
    appJs = path.join(__dirname, '/build-ui/js/google-app.js');
    if(debug){ // for debug use local names
      index = path.join(__dirname, '/build-ui/google-index.html');
    }
  } else if(config.userProvider.strategy === 'ldap' || config.userProvider.strategy === 'anonymous'){
    console.log('using l-p');
    appJs = path.join(__dirname, '/build-ui/js/l-p-app.js');
    if(debug){
      index = path.join(__dirname, '/build-ui/l-p-index.html');
    }
  } else {
    console.error('unrecognized auth strategy', config.userProvider.strategy);
  }
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

app.use('/api', require('./src-server/workspace/workspace-router.js')(userProvider.getGuard(), conn).router);

var imageRendererModule = require('./src-server/workspace/image-renderer.js')(userProvider.getGuard(), conn, app.webpack_middleware);
app.use('/img', imageRendererModule.router);
process.on('SIGINT', function(){
    console.log('shutting down');
    imageRendererModule.shutdown();
    process.exit();
});

app.get('*', function(req, res) {
    res.sendFile(index);
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);

});

io = require('socket.io').listen(server);

io.on('connection', function(socket) {

    socket.on('disconnect', function() {
    });

    socket.on('map', function(msg){
      if(msg.type === 'sub'){
        socket.join(msg.id);
      }
      if(msg.type === 'unsub'){
        socket.leave(msg.id);
      }
      if(msg.type === 'change'){
        socket.broadcast.to(msg.id).emit('mapchange', msg);
      }
    });

    socket.on('workspace', function(msg){
      if(msg.type === 'sub'){
        socket.join(msg.id);
      }
      if(msg.type === 'unsub'){
        socket.leave(msg.id);
      }
      if(msg.type === 'change'){
        socket.broadcast.to(msg.id).emit('workspacechange', msg);
      }
    });
});

server.___app = app;
server.___conn = conn;
server.___app.io = io;
module.exports=server;
