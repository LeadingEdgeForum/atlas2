/*jshint esversion: 6 */

import Store from '../store.js';
import $ from 'jquery';

class AuthStore extends Store {

  constructor() {
    super();
    this.loggedIn = false;
    this.inProgress = false;
    this.meQueried = false;
    this.isLoggedIn.bind(this);
    this.logout.bind(this);
  }

  isLoggedIn(){
    if(this.loggedIn){
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
          this.loggedIn = true;
          this.inProgress = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this),
        error: function(err) {
          this.inProgress = false;
          this.loggedIn = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this)
      });
    }
    return this.loggedIn;
  }

  loginPasswordLogin(login, password, next){
    if(this.loggedIn){
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
          this.loggedIn = true;
          this.inProgress = false;
          this.meQueried = true;
          this.emitChange();
          if(next) next();
        }.bind(this),
        error: function(err) {
          this.inProgress = false;
          this.loggedIn = false;
          this.meQueried = true;
          this.emitChange();
        }.bind(this)
      });
    }
  }

  logout(next){
    $.ajax({
      type: 'GET',
      url: '/logout',
      success: function(data2) {
        this.loggedIn = false;
        this.emitChange();
      }.bind(this)
    });
    if(next){
      next();
    }
  }
}

export default AuthStore;
