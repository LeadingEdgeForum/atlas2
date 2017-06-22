/*jshint esversion: 6 */

import Store from '../store.js';
import $ from 'jquery';

class AuthStore extends Store {

  constructor() {
    super();
    this._loggedIn = false;
    this.inProgress = false;
    this.meQueried = false;
    this.loggedIn = this.loggedIn.bind(this);
    this.loginPasswordLogin = this.loginPasswordLogin.bind(this);
    this.logout = this.logout.bind(this);
  }

  loggedIn(){
    if(this._loggedIn){
      return true;
    }
    if(this.meQueried){ // not logged in, me queried, no point in querying again
      return false;
    }
    if(!this.inProgress){
      this.inProgress = true;
      $.ajax({
        type: 'GET',
        url: '/me',
        success: function(data2) {
          this._loggedIn = true;
          this.inProgress = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this),
        error: function(err) {
          this.inProgress = false;
          this._loggedIn = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this)
      });
    }
    return this._loggedIn;
  }

  loginPasswordLogin(login, password, next){
    if(this._loggedIn){
      return; //no op if already logged in
    }
    if(!this.inProgress){
      this.inProgress = true;
      $.ajax({
        type: 'POST',
        url: '/login',
        data: {
          login:login,
          password:password
        },
        success: function(data2) {
          this._loggedIn = true;
          this.inProgress = false;
          this.meQueried = true;
          this.emitChange();
          if(next){
            next();
          }
        }.bind(this),
        error: function(err) {
          this.inProgress = false;
          this._loggedIn = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this)
      });
    }
  }

  logout(){
    $.ajax({
      type: 'GET',
      url: '/logout',
      success: function(data2) {
        this._loggedIn = false;
        this.emitChange();
      }.bind(this)
    });
  }
}

export default AuthStore;
