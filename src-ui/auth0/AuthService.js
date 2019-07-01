/*jshint esversion: 6 */

import Auth0Lock from 'auth0-lock';
import { browserHistory } from 'react-router';
import { isTokenExpired } from './jwtHelper';
import Store from '../store';

/* globals localStorage */
/* globals window */

export default class AuthService extends Store {

    constructor(clientId, domain) {
        super();

        let mustAcceptTerms = false;
        let languageDictionary = {
            title : 'Welcome to Atlas'
            /*
            ,
            signUpTerms : "I agree to <a href=\"/tos\" target=\"_new\">Terms of Service</a>."
            */
        };
        this.auth0 = new Auth0Lock(clientId, domain, {
            auth: {
                responseType: 'token id_token',
                params: {
                    scope: 'openid email user_metadata picture app_metadata'
                }
            },
            theme : {
                logo : '/img/LEF-Logo.svg',
                primaryColor : '#00789b'
            },
            autoclose : true,
            languageDictionary : languageDictionary,
            mustAcceptTerms : mustAcceptTerms
        });

        this.login = this.login.bind(this);
        this.signUp = this.signUp.bind(this);
        this._doAuthentication = this._doAuthentication.bind(this);
        this.setToken = this.setToken.bind(this);
        this.getToken = this.getToken.bind(this);
        this.loggedIn = this.loggedIn.bind(this);
        this.logout = this.logout.bind(this);
        this.auth0.on('authenticated', this._doAuthentication);
        this.auth0.on('unrecoverable_error', console.error);
        this.auth0.on('authorization_error', console.error);
    }

    _doAuthentication(authResult) {
        this.auth0.getUserInfo(authResult.accessToken, function(error, profile) {
            if (error) {
                // Handle error
                console.log('error', error);
                this.emitChange();
                return;
            }

            localStorage.setItem("accessToken", authResult.accessToken);
            localStorage.setItem("profile", JSON.stringify(profile));

            this.setToken(authResult.idToken);
            this.setProfile(profile);
            this.emitChange();
            if(this.history && this.location) {
                this.history.push(this.location);
            }
            this.history = null;
            this.location = null;
        }.bind(this));
    }

    next(location,history){
        this.location = location;
        this.history = history;
    }

    setProfile(profile) {
        // Saves profile data to local storage
        localStorage.setItem('profile', JSON.stringify(profile));
    }

    getProfile() {
        // Retrieves the profile data from local storage
        const profile = localStorage.getItem('profile');
        return profile ? JSON.parse(localStorage.profile) : {};
    }

    login() {
        this.auth0.show({
            allowSignUp : false,
            allowLogin	 : true
        });
    }

    signUp(){
        this.auth0.show({
            allowSignUp : true,
            allowLogin	 : false
        });
    }

    loggedIn() {
        const token = this.getToken();
        return !!token && !isTokenExpired(token);
    }

    setToken(idToken) {
        localStorage.setItem('id_token', idToken);
    }

    getToken() {
        // Retrieves the user token from local storage
        return localStorage.getItem('id_token');
    }

    getAccessToken(){
        return localStorage.getItem('accessToken');
    }

    logout() {
        // Clear user token and profile data from local storage
        localStorage.removeItem('id_token');
        localStorage.removeItem("accessToken");
        localStorage.removeItem('profile');
        this.emitChange();
    }
}
