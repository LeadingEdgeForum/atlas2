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

    /* globals ___AUTH0_AUDIENCE___ */
    /* globals ___AUTH0_ISSUER___ */
    let mustAcceptTerms = false;
    let languageDictionary = {
      title : 'Welcome to Atlas'/*,
      signUpTerms : "I agree to <a href=\"/tos\" target=\"_new\">Terms of Service</a>."
      */
    };
    this.auth0 = new Auth0Lock(___AUTH0_AUDIENCE___, ___AUTH0_ISSUER___, {
      auth: {
          responseType: 'token id_token',
          redirect: true,
          redirectUrl: window.location.origin,
          params: {
              scope: 'openid email user_metadata picture app_metadata'
          }
      },
      theme : {
        logo : '/img/LEF_logo.png',
        primaryColor : '#00789b'
      },
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
    let logger = function(arg){
      return function(arg, msg) {
          console.log('log', arg, msg);
      }
    }
    this.auth0.on('authenticated', this._doAuthentication);
    this.auth0.on('authorization_error', logger('authorization_error'));
      this.auth0.on('unrecoverable_error', logger('unrecoverable_error'));
      this.auth0.on('hash_parsed', logger('hash_parsed'));
  }

  _doAuthentication(authResult) {
    console.log('auth', authResult);
      this.setToken(authResult.idToken);
      this.emitChange();
      if(this.history && this.location) {
          this.history.push(this.location);
      }
      this.history = null;
      this.location = null;
  }

  next(location,history){
    console.log(location, history);
    this.location = location;
    this.history = history;
  }

  setProfile(profile) {
      // Saves profile data to local storage
      localStorage.setItem('profile', JSON.stringify(profile));
      // Triggers update
      this.emitChange();
  }

  getProfile() {
      // Retrieves the profile data from local storage
      const profile = localStorage.getItem('profile');
      return profile ? JSON.parse(localStorage.profile) : {};
  }

  login() {
    this.auth0.removeAllListeners();
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
    const loggedIn = !!token && !isTokenExpired(token);
    console.log('loggedIn', loggedIn, token);
    return loggedIn;
  }

  setToken(idToken) {
    console.log('set token', idToken);
    localStorage.setItem('id_token', idToken);
  }

  getToken() {
    // Retrieves the user token from local storage
    return localStorage.getItem('id_token');
  }

  logout() {
      // console.log('logout', idToken);
    // Clear user token and profile data from local storage
    localStorage.removeItem('id_token');
    localStorage.removeItem('profile');
    this.emitChange();
  }
}
