/*jshint esversion: 6 */

import Store from '../store.js';
import $ from 'jquery';

class AuthStore extends Store {

  constructor() {
    super();
    this.loggedIn = false;
    this.inProgress = false;
    this.isLoggedIn.bind(this);
    this.logout.bind(this);
  }

  isLoggedIn(){
    if(this.loggedIn){
      return true;
    }
    if(!this.inProgress){
      this.inProgress = true;
      $.ajax({
        type: 'GET',
        url: '/me',
        success: function(data2) {
          this.loggedIn = true;
          this.inProgress = false;
          this.emitChange();
        }.bind(this)
      });
    }
    return this.loggedIn;
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
