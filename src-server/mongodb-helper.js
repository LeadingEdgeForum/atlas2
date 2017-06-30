/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('mongodb-helper');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var mongoDBService = appEnv.getService("mongo-for-atlas");

var connectionURL = null;
var options = {};


if(mongoDBService && mongoDBService.credentials && (mongoDBService.credentials.uri ||mongoDBService.credentials.url)){
  logger.trace('MongodDB service found...');
  if(mongoDBService.credentials && (mongoDBService.credentials.uri || mongoDBService.credentials.url)){
    logger.trace('... with uri/url');
    connectionURL = mongoDBService.credentials.uri || mongoDBService.credentials.url;
    if(mongoDBService.credentials.ca_certificate_base64){
      logger.trace('... and a security certificate');
      var ca = [new Buffer(mongoDBService.credentials.ca_certificate_base64, 'base64')];
      options = {
          mongos: {
              ssl: true,
              sslValidate: true,
              sslCA: ca
          }
      };
    }
  }
} else {
    logger.warn('mongoDB service not configured (or configured improperly), defaulting to local database');
    connectionURL = process.env.MONGO_URL_ATLAS2 || 'mongodb://localhost:27017/atlas2';
}

module.exports = {
  'atlas2': { connectionURL:connectionURL, options:options },
  'test_duplication': { connectionURL:process.env.MONGO_URL_TEST_DUPLICATION || "mongodb://localhost:27017/test-duplication" },
  'test_usage': { connectionURL:process.env.MONGO_URL_TEST_USAGE || "mongodb://localhost:27017/test-usage" }
};
