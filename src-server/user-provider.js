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

var StormpathHelper = require('./stormpath-helper');
var stormpath = require('express-stormpath');



var guard = null;


/*
 */
function registerStormpathPassportStrategy(app, passport, name) {
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



    app.get('/login', function(req, res, next) {
        console.log(next, !req.get('X-Stormpath-Agent'));
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


function registerGoogleAuthPassportStrategy(app, passport, name) {
    var GoogleStrategy = require('passport-google-auth').Strategy;
    var googleStrategy = new GoogleStrategy();

    passport.use(name, googleStrategy);

    app.get('/login', function(req, res, next) {
        console.log(next, !req.get('X-Stormpath-Agent'));
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


function registerAnonymousPassportStrategy(app, passport, name) {
    var LocalStrategy = require('passport-local');
    var localStrategy = new LocalStrategy({
        usernameField: 'login',
        session: true
    }, function(user, pass, done) {
        return done(null, {
            email: user,
            href: user
        });
    });

    passport.serializeUser(function(user, cb) {
        cb(null, user.email);
    });
    passport.deserializeUser(function(id, cb) {
        cb(null, {
            email: id,
            href: id
        });
    });

    passport.use(name, localStrategy);

    app.get('/login', function(req, res, next) {
        console.log(next, !req.get('X-Stormpath-Agent'));
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


function createUserProvider(app, config) {

    /*
      The default provider - uses stormpath to manage users. Stormpath has to be
      properly configured (2FA and such).
    */
    if (config.userProvider.type === 'stormpath') {
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
            registerStormpathPassportStrategy(app, passport, config.userProvider.strategy);
        }
        if (config.userProvider.strategy === 'google-auth') {
            registerGoogleAuthPassportStrategy(app, passport, config.userProvider.strategy);
        }
        if (config.userProvider.strategy === 'anonymous') {
            registerAnonymousPassportStrategy(app, passport, config.userProvider.strategy);
        }


        app.use(passport.initialize());
        app.use(passport.session());

        app.post('/login', passport.authenticate(config.userProvider.strategy, {
            successRedirect: '/',
            failureRedirect: '/login'
        }));

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
    this.installUserProvider = function(app, config) {
        createUserProvider(app, config);
    };

    this.getGuard = function() {
        return guard;
    };
};


var wrapper = new WrapperClass();
module.exports = wrapper;
