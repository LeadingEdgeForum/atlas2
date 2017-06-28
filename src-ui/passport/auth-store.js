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
      var _this = this;
      $.ajax({
        type: 'GET',
        url: '/me',
        success: function(data2) {
          _this._loggedIn = true;
          _this.inProgress = false;
          _this.meQueried = true;
          _this.emitChange();
          if(_this.history){
              _this.history.push(_this.location);
              _this.history = null;
              _this.location = null;
          }
        },
        error: function(err) {
          _this.inProgress = false;
          _this._loggedIn = false;
          _this.meQueried = true;
          _this.emitChange();
        }
      });
    }
    return this._loggedIn;
  }

  // record history
  next(location,history){
    this.location = location;
    this.history = history;
  }

  loginPasswordLogin(login, password){
    if(this._loggedIn){
      return; //no op if already logged in
    }
    if(!this.inProgress){
      this.inProgress = true;
      var _this = this;
      $.ajax({
        type: 'POST',
        url: '/login',
        data: {
          login:login,
          password:password
        },
        success: function(data2) {
          _this._loggedIn = true;
          _this.inProgress = false;
          _this.meQueried = true;
          _this.emitChange();
          if(_this.history){
              _this.history.push(_this.location);
              _this.history = null;
              _this.location = null;
          }
        },
        error: function(err) {
          this.inProgress = false;
          this._loggedIn = false;
          this.meQueried = true;
          this.emitChange();
        }
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
