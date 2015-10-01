var appConfig = require(require('path').join(__dirname, '..', '..', 'json', 'app_config.json'));

var transporter = require('nodemailer').createTransport({
  service: appConfig.email_service,
  auth: {
    user: appConfig.email_from_address,
    pass: appConfig.email_from_password
  }
});

module.exports = {
	send: function (options) {
		transporter.sendMail({ from: appConfig.email_from_address, to: options.to, subject: options.surveyTitle, html: options.message }, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Message sent: ' + info.response);
      }
    });
	}
};