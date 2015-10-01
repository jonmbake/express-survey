var _ = require('underscore');
var appConfig = require(require('path').join(__dirname, '..', 'json', 'app_config.json'));
var template = _.template(appConfig.invitation_template);

// create reusable transporter object using SMTP transport
var InvitationSender = function (surveyTitle, surveyUrl, transporter) {
  this.surveyTitle = surveyTitle;
  this.surveyUrl = surveyUrl;
  this.transporter = transporter;
};

_.extend(InvitationSender.prototype, {
  send: function (to, token) {
    var surveyURL = appConfig['app_url'] + this.surveyUrl + '?token=' + token;
    var opts = { to: to, surveyTitle: this.surveyTitle, message: template({surveyURL: surveyURL}) };
    this.transporter.send(opts);
  }
});

module.exports = InvitationSender;