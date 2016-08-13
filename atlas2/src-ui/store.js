/*jshint esversion: 6 */

import EventEmitter from 'events';

var CHANGE_EVENT = 'change';

export default class Store extends EventEmitter {

  constructor() {
    super();
  }

  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
}

Store.dispatchToken = null;
