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
var track = require('./tracker-helper');

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

}

function registerAnonymousPassportStrategy(app, passport, name, conn) {
    var LocalStrategy = require('passport-local');
    var localStrategy = new LocalStrategy({
        usernameField: 'login',
        session: true
    }, function(user, pass, done) {
      console.log(user, pass);
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

}


function createUserProvider(app, config, conn) {
    logger.trace('Using', config.userProvider.type, config.userProvider.strategy, 'user provider');
    /*
      The default provider - uses auth0 to manage users. Auth0 has to be
      properly configured (2FA and such).
    */
    if (config.userProvider.type === 'auth0') {
        const jwt = require('express-jwt');
        const jwksRsa = require('jwks-rsa');

        // Authentication middleware. When used, the
        // access token must exist and be verified against
        // the Auth0 JSON Web Key Set
        const authenticate = jwt({
            // Dynamically provide a signing key
            // based on the kid in the header and
            // the singing keys provided by the JWKS endpoint.
            secret: jwksRsa.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'https://wardleymaps.eu.auth0.com/.well-known/jwks.json'
            }),

            // Validate the audience and the issuer.
            audience: '2AUDOUquJ-jTXCxT8d731Jtfrv_sBEj9',
            issuer: 'https://wardleymaps.eu.auth0.com/',
            algorithms: ['RS256']
        });
        guard = {authenticationRequired : authenticate};
        return;
    }

    if (config.userProvider.type === 'passport') {



        var passport = require('passport');
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
