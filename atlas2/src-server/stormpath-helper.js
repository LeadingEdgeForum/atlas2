/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('stormpath-helper');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var stormpathApplication = null;
var stormpathId = null;
var stormpathKey = null;
var getStormpathData = function(appEnv) {
    var stormpathCredService = appEnv.getService("atlas2-stormpath-credentials");
    if (stormpathCredService && stormpathCredService.credentials) {
        logger.trace("found configured credential service");
        stormpathApplication = stormpathCredService.credentials.href;
        stormpathId = stormpathCredService.credentials["apiKey.id"];
        stormpathKey = stormpathCredService.credentials["apiKey.secret"];
        return;
    }
    if (!(stormpathCredService && stormpathApplication && stormpathId && stormpathKey)) {
        if (!stormpathCredService) {
            logger.warn("stormpath credentials service not found ...");
        }
        if (stormpathCredService && !(stormpathApplication && stormpathId && stormpathKey)) {
            logger.warn("stormpath service did not provide required parameters ...");
        }
    }
    logger.warn("... continuing to search in dev properties");
    stormpathApplication = process.env.WM_STORMPATH_APPLICATION;
    stormpathId = process.env.WM_STORMPATH_API_KEY_ID;
    stormpathKey = process.env.WM_STORMPATH_API_KEY_SECRET;
    if (!stormpathApplication && stormpathId && stormpathKey) {
        logger.error("stormpath credentials not found");
    } else {
        logger.trace("stormpath credentials FOUND in dev properties");
    }
};

getStormpathData(appEnv);

exports.stormpathApplication = stormpathApplication;
exports.stormpathId = stormpathId;
exports.stormpathKey = stormpathKey;
