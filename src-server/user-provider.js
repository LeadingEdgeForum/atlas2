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



var guard = null;

function createUserProvider(app, config){
  if (config.userProvider.type === 'stormpath') {
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
      app.use(provider);
      return;
  }

  if (config.userProvider.type === 'passport') {
      var passport = require('passport');
      var StormpathStrategy = require('passport-stormpath').Strategy;
      var stormpathStrategy = new StormpathStrategy({
        apiKeyId:     StormpathHelper.stormpathId,
        apiKeySecret: StormpathHelper.stormpathKey,
        appHref:      StormpathHelper.stormpathApplication,
        usernameField : 'login'
      });
      passport.use('stormpath', stormpathStrategy);
      passport.serializeUser(stormpathStrategy.serializeUser);
      passport.deserializeUser(stormpathStrategy.deserializeUser);

      //passport guard compatible with stormpath api
      guard = new function(){
          this.loginRequired = function(req,res,next){
            if (req.isAuthenticated()) { return next(); }
            res.send(403);
          };
          this.authenticationRequired = function(req,res,next){
            if (req.isAuthenticated()) { return next(); }
            res.send(403);
          };
      }();

      app.use(passport.initialize());
      app.use(passport.session());

      app.get('/me',function(req,res){
        if (req.isAuthenticated()) {
            res.status(200).send(req.user);
            return;
        }
        res.status(401).send({"status":401,"message":"Unauthorized"});
      });

      app.post('/login', passport.authenticate('stormpath', {
          successRedirect: '/',
          failureRedirect: '/login'
      }));

      app.get('/logout', function(req,res){
        req.logout();
        res.redirect('/');
      });

      app.get('/login', function(req, res, next) {
        console.log(next, !req.get('X-Stormpath-Agent'));
        if(!req.get('X-Stormpath-Agent')){
          // no stormpath agent, process normally
          return next();
        }
        res.status(200).send({
            "form": {
                "fields": [{
                    "label": "Username or Email",
                    "placeholder": "Username or Email",
                    "required": true,
                    "type": "text",
                    "name": "login"
                }, {
                    "label": "Password",
                    "placeholder": "Password",
                    "required": true,
                    "type": "password",
                    "name": "password"
                }]
            },
            "accountStores": [] /*[{
                "href": "https://api.stormpath.com/v1/directories/ZZZZ",
                "name": "Atlas2 Google",
                "provider": {
                    "href": "https://api.stormpath.com/v1/directories/ZZZZ",
                    "providerId": "google",
                    "clientId": "zzzz.apps.googleusercontent.com",
                    "scope": "email profile"
                }
            }] */
        });
    });
      return;
  }
  console.error('User provider', config.userProvider.type, 'not implemented');
}


var WrapperClass = function(){
    this.installUserProvider = function(app, config){
      createUserProvider(app, config);
    };

    this.getGuard = function(){
      return guard;
    };
};


var wrapper = new WrapperClass();
module.exports = wrapper;
