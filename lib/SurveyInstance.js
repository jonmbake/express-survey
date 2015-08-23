var _ = require('underscore');
var path = require('path');
var utils = require('./utils');
var Q = require('q');

/**
 * A survey instance.
 * @constructor
 * @param {String} instanceFileName file name of where instance specification lives
 * @param {Object} options          options hash
 * Currenly the following options are valid:
 * dbLocation - location where to save db file - defaults to db directory
 */
var SurveyInstance = function (instanceFileName, options) {
  _.extend(this, require(path.join(__dirname, '..', 'survey_instances', instanceFileName)));
  this.name = instanceFileName.split('.')[0];
  this.url = '/' + encodeURI(this.name);
  //enforce some invariants
  if (!this.title) {
    throw new Error('Survey instance title must be specified in ' + instanceName);
  } else if (!this['field_set']) {
    throw new Error('Survey instance field set must be specified in ' + instanceName);
  }
  this.fields = utils.loadFieldSet(this['field_set']);
  this.db = utils.initDb(this.name, this.fields, options && options.dbLocation);
};

_.extend(SurveyInstance.prototype, {
	/**
	 * Save data for this survey instance.
	 * @param  {Object} data to persist
	 * @return {Q.Promise}      Promise that is resolved when data finishes saving
	 */
  save: function (data) {
    var binds = this.fields.map(function () { return '?'; }).join(',');
    var fields = this.fields.map(function (f) { return f.name; }).join(',');
    var stmt = this.db.prepare('insert into responses(' + fields + ') values (' + binds + ')');
    var bindValues = [];
    this.fields.forEach(function (f) {
      bindValues.push(data[f.name]);
    });
    stmt.run(bindValues);
    return Q.ninvoke(stmt, 'finalize');
  },
  /**
   * Results of the survey.
   * @return {Array} Array of results data
   */
  results: function () {
    var deferred = Q.defer();
    this.db.all("select * from responses", function(err, rows) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(rows);
      }
    });
    return deferred.promise;
  },
  /**
   * JSON representation of this survey instance.
   * @return {Object} JSON representation of this
   */
  toJSON: function () {
    var r = _.pick(this, 'title', 'name', 'url', 'fields');
    return r;
  }
});

module.exports = SurveyInstance;