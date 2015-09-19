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
    var fieldErrors = utils.validateData(this.fields, data);
    if (!_.isEmpty(fieldErrors)) {
      var d = Q.defer();
      d.reject(fieldErrors);
      return d.promise;
    }
    var binds = this.fields.map(_.constant('?')).join(',');
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
  results: function (sortBy, sortDir) {
    var deferred = Q.defer();
    var sortByInt = parseInt(sortBy, 10) || 1;
    if (sortByInt > this.fields.length || sortByInt < 1) {
      sortByInt = 1;
    }
    sortDir = sortDir === 'desc' ? 'desc' : 'asc';
    this.db.all("select * from responses order by " + (sortByInt + 1)  + " " + sortDir, function(err, results) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve({results: results, sortBy: sortByInt, sortDir: sortDir});
      }
    });
    return deferred.promise;
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
