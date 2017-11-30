// This is a rule for auth0
function (user, context, callback) {
  var termsAccepted = user && user.app_metadata && user.app_metadata.termsAccepted;
  if (context.protocol === "redirect-callback") {
    user.user_metadata = user.user_metadata || {};
    user.user_metadata.termsAccepted = user.user_metadata.termsAccepted || {
      date : new Date(),
      version: 1 // one day retrieve it from the tool
    };
    auth0.users.updateAppMetadata(user.user_id, user.user_metadata)
      .then(function(){
          callback(null, user, context);
      })
      .catch(function(err){
          callback(err);
      });
  } else if(!termsAccepted){
    context.redirect = {
      url: "https://atlas2.wardleymaps.com/accept-tos"
    };
    return callback(null, user, context);
  } else {
    // regular connection, termsAccepted
    return callback(null, user, context);
  }
}
