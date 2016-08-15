/*eslint-env node*/


var stormpath = require('express-stormpath');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var webpack = require('webpack');
var config = require('./webpack.config');

var app = express();
var compiler = webpack(config);
app.use(require('webpack-dev-middleware')(compiler));

app.use(morgan('combined'));



// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');


app.get('/css/bootstrap.min.css', function (req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/css/bootstrap.min.css'));
});

app.get('/fonts/glyphicons-halflings-regular.woff2', function (req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/fonts/glyphicons-halflings-regular.woff2'));
});

app.get('/img/LEF_logo.png', function (req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/img/LEF_logo.png'));
});

app.get('/app.js', function (req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/js/app.js'));
});


app.use(stormpath.init(app, {
    debug:'debug',
    web: {
      produces: ['application/json'],
      login: {
        nextUri: '/wrong'
      },
      logout : {
          enabled : true,
          uri : '/logout',
          nextUri: '/'
      }
    },
    client: {
        apiKey: {
          id: process.env.WM_STORMPATH_API_KEY_ID,
          secret: process.env.WM_STORMPATH_API_KEY_SECRET
        }
     },
    application: {
        href: process.env.WM_STORMPATH_APPLICATION
    }
}));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use('/api', require('./src-server/workspace/workspace-router.js')(stormpath).router);

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/build-ui/index.html'));
});

app.post('/me', stormpath.loginRequired, function (req, res) {
    function writeError(message) {
      res.status(400);
      res.json({ message: message, status: 400 });
      res.end();
    }

    function saveAccount() {
      req.user.givenName = req.body.givenName;
      req.user.surname = req.body.surname;
      req.user.email = req.body.email;

      req.user.save(function (err) {
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
      }, function (err) {
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


app.on('stormpath.ready', function () {
    console.log('Stormpath Ready');

    app.listen(appEnv.port, '0.0.0.0', function() {
        // print a message when the server starts listening
        console.log("server starting on " + appEnv.url);
      });
    });
