var _ = require('underscore');
var nodemailer = require('nodemailer');
var appConfig = require(require('path').join(__dirname, '..', 'json', 'app_config.json'));
var mailerConfig = appConfig.mailer;
var emailTemplate = _.template(mailerConfig.mail_template);

// create reusable transporter object using SMTP transport
var Mailer = function (title, surveyUrl, options) {
  this.title = title;
  this.surveyUrl = surveyUrl;
  this.transporter = options.transporter || nodemailer.createTransport({
    service: mailerConfig.service,
    auth: {
      user: mailerConfig.from_address,
      pass: mailerConfig.from_password
    }
  });
};

_.extend(Mailer.prototype, {
  send: function (to, token) {
    var surveyURL = appConfig['app_url'] + this.surveyUrl + '?token=' + token;
    var mailOptions = { from: mailerConfig.from_address, subject: this.title, html: emailTemplate({surveyURL: surveyURL}) };
    this.transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Message sent: ' + info.response);
      }
    });
  }
});

module.exports = Mailer;