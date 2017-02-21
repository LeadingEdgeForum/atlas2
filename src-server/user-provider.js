/* Copyright 2017 and Scott Weinstein and Krzysztof Daniel.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/

var StormpathHelper = require('./stormpath-helper');
var stormpath = require('express-stormpath');

var config = {
    userProvider : 'stormpath'
};
try {
    config = require('../config.json');
} catch (ex) {

}

var guard = null;

function createUserProvider(app){
  if (config.userProvider === 'stormpath') {
      var provider =  stormpath.init(app, {
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

      app.on('stormpath.ready', function() {
          console.log('Stormpath Ready');
      });
      guard = stormpath;
      return provider;
  }
  console.error('User provider', config.userProvider, 'not implemented');
}


var WrapperClass = function(){
    this.getRouter = function(app){
      return createUserProvider(app);
    };

    this.getGuard = function(){
      return guard;
    };
};


var wrapper = new WrapperClass();
module.exports = wrapper;
