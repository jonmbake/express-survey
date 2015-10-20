var _ = require('underscore');
var path = require('path');
var utils = require('./utils');
var Q = require('q');
var ResponseDatabase = require('./ResponseDatabase');
var SecuredResponseDatabase = require('./SecuredResponseDatabase');
var InvitationSender = require('./InvitationSender');

/**
 * A survey instance.  For the most part just a proxy to the {@link ResponseDatabase}.
 * @constructor
 * @param {String} instanceFileName file name of where instance specification lives
 * @param {Object} options          options hash
 * Currenly the following options are valid:
 * dbLocation - location where to save db file - defaults to db directory
 */
var SurveyInstance = function (instanceFileName, options) {
  _.extend(this, require(path.join(__dirname, '..', 'json', 'survey_instances', instanceFileName)));
  options = options || {};
  this.name = instanceFileName.split('.')[0];
  this.url = '/' + encodeURI(this.name);
  //enforce some invariants
  if (!this.title) {
    throw new Error('Survey instance title must be specified in ' + instanceFileName);
  } else if (!this['field_set']) {
    throw new Error('Survey instance field set must be specified in ' + instanceFileName);
  }
  this.fields = utils.loadFieldSet(this['field_set']);
  var dbOptions = options;
  var inviteListName = this.invite_list;
  var dbColumns = _.clone(this.fields);
  if (inviteListName) {
    var transporter = options.invitationTransporter;
    if (!transporter) {
      transporter = require('./transporters/' + (this.invitation_transporter ? this.invitation_transporter : 'email'));
    }
    var sender = new InvitationSender(this.title, this.url, transporter);
    var il = require(path.join(__dirname, '..', 'json', 'invite_lists', inviteListName + '.json'));
    dbOptions = _.extend(options, { inviteList: il, onInvite: InvitationSender.prototype.send.bind(sender) });
    this.db = new SecuredResponseDatabase(this.name, dbColumns, dbOptions);
    this.fields = [{ title: 'Name', name: '_name', type: 'text'}].concat(this.fields);
  } else {
    this.db = new ResponseDatabase(this.name, dbColumns, dbOptions);
  }
};

_.extend(SurveyInstance.prototype, {
  hasAccess: function (token) {
    return this.db.hasAccess(token);
  },
  getResponse: function (token) {
    return this.db.get(token);
  },
	/**
	 * Save data for this survey instance.
	 * @param  {Object} data to persist
	 * @return {Q.Promise}      Promise that is resolved when data finishes saving
	 */
  save: function (data, token) {
    var fieldErrors = utils.validateData(this.fields, data);
    if (!_.isEmpty(fieldErrors)) {
      var d = Q.defer();
      d.reject(fieldErrors);
      return d.promise;
    }
    return this.db.save(data, token);
  },
  /**
   * Results of the survey.
   * @return {Array} Array of results data
   */
  results: function (sortBy, sortDir, token) {
    var sortByInt = parseInt(sortBy, 10) || 1;
    if (sortByInt > this.fields.length || sortByInt < 1) {
      sortByInt = 1;
    }
    sortDir = sortDir === 'desc' ? 'desc' : 'asc';
    return this.db.queryAll(sortByInt, sortDir, token);
  },
  /**
   * JSON representation of this survey instance.
   * @return {Object} JSON representation of this
   */
  toJSON: function () {
    return _.pick(this, 'title', 'name', 'url', 'fields', 'message', 'html_escape_message');
  }
});

module.exports = SurveyInstance;
