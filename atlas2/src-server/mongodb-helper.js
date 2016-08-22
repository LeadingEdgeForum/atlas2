/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('mongodb-helper');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var mongoDBService = appEnv.getService("mongodb");

var connectionURL = null;
if(mongoDBService && mongoDBService.credentials && mongoDBService.credentials.url){
  logger.trace('MongodDB service found...');
  if(mongoDBService.credentials && mongoDBService.credentials.url){
    logger.trace('... with url');
    connectionURL = mongoDBService.credentials.url;
  }
} else {
    logger.warn('mongoDB service not configured (or configured improperly), defaulting to local database');
    connectionURL = 'mongodb://localhost:27017/atls2';
}
module.exports = connectionURL;
