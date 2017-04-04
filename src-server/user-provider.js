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
/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('user-provider');
var guard = null;

function renderProperStormpathLoginForm(app){
  app.get('/login', function(req, res, next) {
      if (!req.get('X-Stormpath-Agent')) {
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
          "accountStores": []
      });
  });
}
/*
 */
function registerStormpathPassportStrategy(app, passport, name) {
    var StormpathHelper = require('./stormpath-helper');
    var stormpath = require('express-stormpath');
    var StormpathStrategy = require('passport-stormpath').Strategy;
    var stormpathStrategy = new StormpathStrategy({
        apiKeyId: StormpathHelper.stormpathId,
        apiKeySecret: StormpathHelper.stormpathKey,
        appHref: StormpathHelper.stormpathApplication,
        usernameField: 'login'
    });
    passport.use(name, stormpathStrategy);
    passport.serializeUser(stormpathStrategy.serializeUser);
    passport.deserializeUser(stormpathStrategy.deserializeUser);

    app.use(passport.initialize());
    app.use(passport.session());

    return renderProperStormpathLoginForm(app);
}

function registerGooglePassportStrategy(app, passport, config, conn) {
    var GoogleStrategy = require('passport-google-oauth20').Strategy;
    var googleStrategy = new GoogleStrategy({
        clientID: config.userProvider.clientID,
        clientSecret: config.userProvider.clientSecret,
        callbackURL: config.userProvider.callbackURL
    }, function(accessToken, refreshToken, profile, done) {
      var UnifiedUser = require('./user-model')(conn).UnifiedUser;
      UnifiedUser.findOne({
          type: 'Passport',
          href: profile.id
      }).exec(function(err, result) {
          if (err) {
              return done(err);
          }
          //create new user if missing.
          if (!result) {
              result = new UnifiedUser();
          }
          var email = null;
          for(var i = 0; i< profile.emails.length; i++){
            if(profile.emails[i].type === 'account'){
              email = profile.emails[i].value;
              break;
            }
          }
          if(!email){ //better this than nothing
            email = profile.emails[0].value;
          }
          result.type = 'Passport';
          result.href = profile.id;
          result.email = email;
          result.fullName = profile.displayName;
          result.save(function(e2, r2) {
              return done(e2, r2);
          });
      });
    });

    passport.use(config.userProvider.strategy, googleStrategy);

    passport.serializeUser(function(user, cb) {
        return cb(null, JSON.stringify(user));
    });

    passport.deserializeUser(function(id, cb) {
        return cb(null, JSON.parse(id));
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.get('/auth/google/callback',
        passport.authenticate(config.userProvider.strategy, {
            failureRedirect: '/login'
        }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
        });

    app.get('/login', passport.authenticate(config.userProvider.strategy, {
        scope: ['profile email']
    }));
}

function registerLdapPassportStrategy(app, passport, config, conn) {
    var LDAPStrategy = require('passport-ldapauth').Strategy;
    var ldapStrategy = new LDAPStrategy({
        server: config.userProvider.server,
        usernameField: 'login'
    }, function(user, done) {
        var UnifiedUser = require('./user-model')(conn).UnifiedUser;
        UnifiedUser.findOne({
            type: 'Passport',
            email: user.mail
        }).exec(function(err, result) {
            if (err) {
                return done(err);
            }
            //create new user if missing.
            if (!result) {
                result = new UnifiedUser();
            }
            result.type = 'Passport';
            result.href = user.uid;
            result.email = user.mail;
            result.fullName = user.cn;
            result.save(function(e2, r2) {
                return done(e2, r2);
            });
        });
    });

    passport.use(config.userProvider.strategy, ldapStrategy);

    passport.serializeUser(function(user, cb) {
        return cb(null, JSON.stringify(user));
    });
    passport.deserializeUser(function(id, cb) {
        return cb(null, JSON.parse(id));
    });

    app.use(passport.initialize());
    app.use(passport.session());

    return renderProperStormpathLoginForm(app);
}

function registerAnonymousPassportStrategy(app, passport, name, conn) {
    var LocalStrategy = require('passport-local');
    var localStrategy = new LocalStrategy({
        usernameField: 'login',
        session: true
    }, function(user, pass, done) {
        var UnifiedUser = require('./user-model')(conn).UnifiedUser;
        UnifiedUser.findOne({
            type: 'Passport',
            email: user
        }).exec(function(err, result) {
            if (err) {
                return done(err);
            }
            //create new user if missing.
            if (!result) {
                result = new UnifiedUser();
            }
            result.type = 'Passport';
            result.href = user;
            result.email = user;
            result.fullName = user;
            result.save(function(e2, r2) {
                return done(e2, r2);
            });
        });
    });

    passport.serializeUser(function(user, cb) {
        return cb(null, JSON.stringify(user));
    });

    passport.deserializeUser(function(id, cb) {
        return cb(null, JSON.parse(id));
    });

    passport.use(name, localStrategy);

    app.use(passport.initialize());
    app.use(passport.session());

    return renderProperStormpathLoginForm(app);
}


function createUserProvider(app, config, conn) {
    logger.trace('Using', config.userProvider.type, config.userProvider.strategy, 'user provider');
    /*
      The default provider - uses stormpath to manage users. Stormpath has to be
      properly configured (2FA and such).
    */
    if (config.userProvider.type === 'stormpath') {
        var stormpath = require('express-stormpath');
        var StormpathHelper = require('./stormpath-helper');
        var provider = stormpath.init(app, {
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
        if (config.userProvider.strategy === 'stormpath') {
            registerStormpathPassportStrategy(app, passport, config.userProvider.strategy, conn);
        }
        if (config.userProvider.strategy === 'google') {
            registerGooglePassportStrategy(app, passport, config, conn);
        }
        if (config.userProvider.strategy === 'ldap') {
            registerLdapPassportStrategy(app, passport, config, conn);
        }
        if (config.userProvider.strategy === 'anonymous') {
            registerAnonymousPassportStrategy(app, passport, config.userProvider.strategy, conn);
        }

        app.post('/login', passport.authenticate(config.userProvider.strategy), function(req, res){
          if(req.isAuthenticated()){
            res.location('/');
            res.json(200,{});
          } else {
            res.location('/login');
            res.json(400,{"status":400,"message":"Invalid username or password."});
          }
        });

        // guard compatible with stormpath api
        guard = new function() { //jshint ignore:line
            this.loginRequired = function(req, res, next) {
                if (req.isAuthenticated()) {
                    return next();
                }
                res.send(403);
            };
            this.authenticationRequired = function(req, res, next) {
                if (req.isAuthenticated()) {
                    return next();
                }
                res.send(403);
            };
        }();

        app.get('/me', function(req, res) {
            if (req.isAuthenticated()) {
                res.status(200).send(req.user);
                return;
            }
            res.status(401).send({
                "status": 401,
                "message": "Unauthorized"
            });
        });

        app.get('/logout', function(req, res) {
            req.logout();
            res.redirect('/');
        });

        return;
    }
    console.error('User provider', config.userProvider.type, 'not implemented');
}


var WrapperClass = function() {
    this.installUserProvider = function(app, config, conn) {
        createUserProvider(app, config, conn);
    };

    this.getGuard = function() {
        return guard;
    };
};


var wrapper = new WrapperClass();
module.exports = wrapper;
