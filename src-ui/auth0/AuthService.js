/*jshint esversion: 6 */

import Auth0Lock from 'auth0-lock';
import { browserHistory } from 'react-router';
import { isTokenExpired } from './jwtHelper';
/* globals localStorage */
/* globals window */

export default class AuthService {
  constructor(clientId, domain) {

    this.auth0 = new Auth0Lock(clientId, domain, {
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
      languageDictionary : {
        title : 'Welcome to Atlas',
        // signUpTerms: "I agree to the <a href='/terms' target='_new'>terms of service</a> and <a href='/privacy' target='_new'>privacy policy</a>.",
      },
      // mustAcceptTerms : true
    });

    this.login = this.login.bind(this);
    this.signUp = this.signUp.bind(this);
    this.setHistory = this.setHistory.bind(this);
    this._doAuthentication = this._doAuthentication.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.loggedIn = this.loggedIn.bind(this);
    this.logout = this.logout.bind(this);
    this.auth0.on('authenticated', this._doAuthentication);
  }

  _doAuthentication(authResult) {
      // Saves the user token
      this.setToken(authResult.idToken);
      // navigate to the home route
      if(this.history){
        this.history.replace('/');
      }
  }

  setHistory(history){
    this.history = history;
  }

  setProfile(profile) {
      // Saves profile data to local storage
      localStorage.setItem('profile', JSON.stringify(profile));
      // Triggers profile_updated event to update the UI
      // this.emit('profile_updated', profile);
  }

  getProfile() {
      // Retrieves the profile data from local storage
      const profile = localStorage.getItem('profile');
      return profile ? JSON.parse(localStorage.profile) : {};
  }

  login(history) {
    this.history = history;
    this.auth0.removeAllListeners();
    this.auth0.show({
      allowSignUp : false,
      allowLogin	 : true
    });
  }

  signUp(history){
    this.auth0.show({
      allowSignUp : true,
      allowLogin	 : false
    });
    this.history = history;
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

  logout(history) {
    // Clear user token and profile data from local storage
    localStorage.removeItem('id_token');
    localStorage.removeItem('profile');
    if(history){
      history.replace('/');
    }
  }
}
