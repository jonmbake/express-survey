var _ = require('underscore');
var crypto = require('crypto');
var ResponseDatabase = require('./ResponseDatabase');
var Q = require('q');

var SecuredResponseDatabase = function (dbName, fields, options) {
  ResponseDatabase.call(this, dbName, fields, options);
  if (!options.inviteList) {
    throw new Error('Invite list must be provided when constructing a Secured Response Database');
  }
};

_.extend(SecuredResponseDatabase.prototype, ResponseDatabase.prototype, {
  _createTables: function () {
    ResponseDatabase.prototype._createTables.apply(this, arguments);
    this.db.run('create table invitees (id integer primary key autoincrement, response_id integer, token text NOT NULL UNIQUE, email_address text NOT NULL UNIQUE, name text NOT NULL, FOREIGN KEY(response_id) REFERENCES responses(id))');
    this.inviteList.forEach(function (i) {
      var binds = [i.email, crypto.randomBytes(64).toString('hex'), i.name];
      this.db.run('insert into invitees (email_address, token, name) values (?,?,?)', binds);
      if (this.onInvite) {
        this.onInvite.apply(null, binds);
      }
    }.bind(this));
  },
  _getToken: function (email) {
    var deferred = Q.defer();
    this.db.get('select token from invitees where email_address = ?', [email], function (err, val) {
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(val.token);
    });
    return deferred.promise;
  },
  _tokenExists: function (token) {
    var deferred = Q.defer();
    if (!token) {
      deferred.reject('Token is null');
      return deferred.promise;
    }
    this.db.get("select name from invitees where token = ?", [token], function(err, row) {
      if (err) {
        deferred.reject('Token does not exist');
      } else {
        deferred.resolve('Token exists for ' + row.name);
      }
    });
    return deferred.promise;
  },
  save: function (data, token) {
    var db = this.db;
    var _this = this;
    return this._tokenExists(token).then(function () {
      //should be wrapped in transaction?
      db.serialize(function() {
        ResponseDatabase.prototype.save.call(_this, data).then(function () {
          this.db.run('update invitees set response_id = ? where token = ?', [this.id, token]);
        });
      });
    });
  },
  queryAll: function (sortBy, sortDir, token) {
    return this._tokenExists(token).then(function () {
      return ResponseDatabase.prototype.queryAll.call(this, sortBy, sortDir);
    }.bind(this));
  }
});

module.exports = SecuredResponseDatabase;