/*eslint-env node*/
/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var userProvider = require('./src-server/user-provider.js');

var app = express();
var webpack_middleware = null;

if(process.env.PRODUCTION){
  console.log('forcing https');
  app.enable('trust proxy');
  app.use(function (req, res, next) {
    if (req.secure) {
            next();
    } else {
            res.redirect('https://' + req.headers.host + req.url);
    }
});
}




var debug = false;
debug = true;
if (debug){
  try{
    var webpack = require('webpack');
    var config = require('./webpack.config');
    var compiler = webpack(config);
    webpack_middleware = require('webpack-dev-middleware')(compiler);
    app.use(webpack_middleware);
  }catch(e){
    console.log(e);
  }
}


app.use(morgan('combined'));



// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

app.get('/css/bootstrap.min.css', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/css/bootstrap.min.css'));
});

app.get('/css/bootstrap.min.css.map', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/css/bootstrap.min.css.map'));
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

app.get('/app.js', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/js/app.js'));
});

app.use(userProvider.getRouter(app));

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use('/api', require('./src-server/workspace/workspace-router.js')(userProvider.getGuard()).router);

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/index.html'));
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
server.___app = app;
module.exports=server;
