/*jshint esversion: 6 */

var logger = require('./log.js').getLogger('sendgrid-helper');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var sg = null;
if (process.env.SENDGRID) {
  sg = require('sendgrid')(process.env.SENDGRID);
}


// {
//     owner : owner,
//     editor : email,
//     workspaceID : workspaceID,
//     name : name,
//     purpose : purpose
// }

var sendInvitation = function(params) {
    if (!sg) {
        return;
    }
    params.service = 'https://atlas2.wardleymaps.com';

    var helper = require('sendgrid').mail;
    var from_email = new helper.Email('noreply@atlas2.wardleymaps.com');
    var to_email = new helper.Email(params.editor);

    var mail = new helper.Mail();
     mail.setFrom(from_email);

    var personalization = new helper.Personalization();
    personalization.addTo(to_email);
    personalization.addSubstitution(
        new helper.Substitution('%owner%', params.owner));
    personalization.addSubstitution(
        new helper.Substitution('%receiver%', params.editor));
    personalization.addSubstitution(
        new helper.Substitution('%url%', params.service));
    personalization.addSubstitution(
        new helper.Substitution('%wkspc%', params.service + '/workspace/' + params.workspaceID));
    personalization.addSubstitution(
        new helper.Substitution('%name%', params.name));
    personalization.addSubstitution(
        new helper.Substitution('%purpose%', params.purpose));
    personalization.addSubstitution(
        new helper.Substitution('%description%', params.description));
    mail.setTemplateId('5a95a87e-45ea-4b1e-990a-def91dda678c');
    mail.addPersonalization(personalization);

    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
    });

    sg.API(request, function(error, response) {
        console.log(response.statusCode);
    });
};


module.exports = {
    sendInvitation: sendInvitation
};
