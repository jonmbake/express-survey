var appConfig = require(require('path').join(__dirname, '..', '..', 'json', 'app_config.json'));
var request = require('request');

module.exports = {
	send: function (options) {
		var payload = { text: options.message, username: appConfig.slack_from_username, channel: options.to };
    request.post(appConfig.slack_webhook_url, { json: payload });
	}
};