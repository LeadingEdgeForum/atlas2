/*eslint-env node*/
/*jshint esversion: 6 */


var stormpath = require('express-stormpath');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var express = require('express');

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

var StormpathHelper = require('./src-server/stormpath-helper');

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


app.use(stormpath.init(app, {
    debug: 'debug',
    web: {
        produces: ['application/json'],
        logout: {
            enabled: true,
            uri: '/logout',
            nextUri: '/'
        }
    },
    client: {
        apiKey: {
            id: StormpathHelper.stormpathId,
            secret: StormpathHelper.stormpathKey
        }
    },
    application: {
        href: StormpathHelper.stormpathApplication
    }
}));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use('/api', require('./src-server/workspace/workspace-router.js')(stormpath).router);

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/index.html'));
});

app.post('/me', stormpath.loginRequired, function(req, res) {
    function writeError(message) {
        res.status(400);
        res.json({
            message: message,
            status: 400
        });
        res.end();
    }

    function saveAccount() {
        req.user.givenName = req.body.givenName;
        req.user.surname = req.body.surname;
        req.user.email = req.body.email;

        req.user.save(function(err) {
            if (err) {
                return writeError(err.userMessage || err.message);
            }
            res.end();
        });
    }

    if (req.body.password) {
        var application = req.app.get('stormpathApplication');

        application.authenticateAccount({
            username: req.user.username,
            password: req.body.existingPassword
        }, function(err) {
            if (err) {
                return writeError('The existing password that you entered was incorrect.');
            }

            req.user.password = req.body.password;

            saveAccount();
        });
    } else {
        saveAccount();
    }
});



// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.on('stormpath.ready', function() {
    console.log('Stormpath Ready');

});
var server = app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
server.___app = app;
module.exports=server;
