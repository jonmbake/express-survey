var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var sqlite3 = require('sqlite3').verbose();

var TO_SQL_TYPE = {'number': 'integer', 'text': 'text', 'select': 'text'};
var ResponseDatabase = function (dbName, fields, options) {
  _.extend(this, options);
  this.fields = fields;
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
    var colTypes = this.fields.map(function (fs) {
        return '"' + fs.name + '"' + ' ' + TO_SQL_TYPE[fs.type];
      }).join(', ');
    this.db.run('create table responses (id integer primary key autoincrement, ' + colTypes + ')');
  },
  _columnNames: function () {
    return this.fields.map(function (f) { return f.name; }).join(',');
  },
  _tokenExists: function (token) {
    var deferred = Q.defer();
    this.db.get("select name from invitees where token = ?", [token], function(err, row) {
      if (row) {
        deferred.reject('Token does not exist');
      } else {
        deferred.resolve('Token exists for ' + row.name);
      }
    });
    return deferred.promise;
  },
  save: function (data) {
    var binds = this.fields.map(_.constant('?')).join(',');
    var stmt = this.db.prepare('insert into responses(' + this._columnNames() + ') values (' + binds + ')');
    var bindValues = [];
    this.fields.forEach(function (f) {
      bindValues.push(data[f.name]);
    });
    stmt.run(bindValues);
    return Q.ninvoke(stmt, 'finalize');
  },
  queryAll: function (sortBy, sortDir) {
    var deferred = Q.defer();
    //add one to sortBy to account for ID column, which is internal and should not be visible to the outside world
    this.db.all("select " + this._columnNames() + " from responses order by " + (sortBy + 1)  + " " + sortDir, function(err, results) {
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