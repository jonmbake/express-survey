var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var sqlite3 = require('sqlite3').verbose();

var TO_SQL_TYPE = {'number': 'integer', 'text': 'text', 'select': 'text', 'checkbox': 'integer'};
var ResponseDatabase = function (dbName, columns, options) {
  _.extend(this, options);
  this.columns = columns;
  var dbFile = this.dbFileLocation || path.join(__dirname, '..', 'db', dbName + '.db');
  var exists = fs.existsSync(dbFile);
  var db = this.db = new sqlite3.Database(dbFile);
  if (!exists) {
    db.serialize(function() {
        this._createTables();
    }.bind(this));
  }
};

_.extend(ResponseDatabase.prototype, {
  _createTables: function () {
    var colTypes = this.columns.map(function (fs) {
        var ct = '"' + fs.name + '"' + ' ' + TO_SQL_TYPE[fs.type];
        if (fs.type === 'checkbox') {
          ct += ' default 0 CHECK ("' + fs.name + '" in (0, 1))'
        }
        return ct;
      }).join(', ');
    this.db.run('create table responses (id integer primary key autoincrement, ' + colTypes + ')');
  },
  _columnNames: function () {
    return this.columns.map(function (f) { return '"' + f.name + '"'; }).join(',');
  },
  _upsert: function (data, responseId) {
    var deferred = Q.defer();
    var binds = this.columns.map(_.constant('?')).join(',');
    var sqlStr;
    if (responseId) {
      sqlStr = 'update responses set ' + this.columns.map(function (f) { return '"' + f.name + '"' + '=?'; }).join(', ') + ' where id=?';
    } else {
      sqlStr = 'insert into responses(' + this._columnNames() + ') values (' + binds + ')';
    }
    var stmt = this.db.prepare(sqlStr);
    var bindValues = [];
    this.columns.forEach(function (f) {
      var val = data[f.name];
      if (f.type === 'checkbox' && !val) {
        val = "0";
      }
      bindValues.push(val);
    });
    if (responseId) {
      bindValues.push(responseId);
    }
    stmt.run(bindValues, function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(this.lastID);
      }
    });
    return deferred.promise;
  },
  _getProjection: function () {
    return this.columns.map(function (f) { return f.type === 'checkbox' ? 'case when "' + f.name + '" = 1 then \'Yes\' else \'No\' end as  "' + f.name + '"' : '"' + f.name + '"'; }).join(',');
  },
  hasAccess: function () {
    var deferred = Q.defer();
    deferred.resolve('Unsecured response database-- everyone has access.');
    return deferred.promise;
  },
  get: function () {
    var deferred = Q.defer();
    deferred.resolve({});
    return deferred.promise;
  },
  save: function (data) {
    return this._upsert(data);
  },
  queryAll: function (sortBy, sortDir) {
    var deferred = Q.defer();
    this.db.all("select " + this._getProjection() + " from responses order by " + sortBy  + " " + sortDir, function(err, results) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve({results: results, sortBy: sortBy, sortDir: sortDir});
      }
    });
    return deferred.promise;
  }
});

module.exports = ResponseDatabase;
