/*jshint esversion: 6 */

// import Auth0Lock from 'auth0-lock';
import { browserHistory } from 'react-router';
import { isTokenExpired } from './jwtHelper';
import auth0 from 'auth0-js';


export default class AuthService {
  constructor(clientId, domain) {

    this.auth0 = new auth0.WebAuth({
      clientID: clientId,
      domain: domain,
      responseType: 'token id_token',
      redirectUri: window.location.origin + '/login',
      scope: 'openid email user_metadata picture'
    });

    this.login = this.login.bind(this);
    this.signup = this.signup.bind(this);
    this.loginWithGoogle = this.loginWithGoogle.bind(this);
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

  login(username, password) {
    this.auth0.redirect.loginWithCredentials({
      connection: 'Username-Password-Authentication',
      username,
      password
    }, err => {
      if (err) {return alert(err.description);}
    });
  }

  signup(email, password){
    this.auth0.redirect.signupAndLogin({
      connection: 'Username-Password-Authentication',
      email,
      password,
    }, function(err) {
      if (err) {
        alert('Error: ' + err.description);
      }
    });
  }

  loginWithGoogle() {
    this.auth0.authorize({
      connection: 'google-oauth2'
    });
  }

  parseHash(hash) {
    this.auth0.parseHash({ hash, _idTokenVerification: false }, (err, authResult) => {
      if (err) {
        alert(`Error: ${err.errorDescription}`);
      }
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setToken(authResult.accessToken, authResult.idToken);
        this.auth0.client.userInfo(authResult.accessToken, (error, profile) => {
          if (error) {
            console.log('Error loading the Profile', error);
          } else {
            this.setProfile(profile);
            browserHistory.replace('/');
          }
        });
      }
    });
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !isTokenExpired(token);
  }

  setToken(accessToken, idToken) {
    // Saves user token to local storage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('id_token', idToken);
  }

  getToken() {
    // Retrieves the user token from local storage
    return localStorage.getItem('id_token');
  }

  logout() {
    // Clear user token and profile data from local storage
    localStorage.removeItem('id_token');
    localStorage.removeItem('profile');
  }
}
