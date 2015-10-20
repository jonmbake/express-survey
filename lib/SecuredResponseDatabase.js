var _ = require('underscore');
var crypto = require('crypto');
var ResponseDatabase = require('./ResponseDatabase');
var Q = require('q');

var SecuredResponseDatabase = function (dbName, columns, options) {
  ResponseDatabase.call(this, dbName, columns, options);
  if (!options.inviteList) {
    throw new Error('Invite list must be provided when constructing a Secured Response Database');
  }
};

_.extend(SecuredResponseDatabase.prototype, ResponseDatabase.prototype, {
  _createTables: function () {
    ResponseDatabase.prototype._createTables.apply(this, arguments);
    this.db.run('create table invitees (id integer primary key autoincrement, response_id integer, token text NOT NULL UNIQUE, address text NOT NULL UNIQUE, name text NOT NULL, FOREIGN KEY(response_id) REFERENCES responses(id))');
    this.inviteList.forEach(function (i) {
      var binds = [i.address, crypto.randomBytes(48).toString('hex'), i.name];
      this.db.run('insert into invitees (address, token, name) values (?,?,?)', binds);
      if (this.onInvite) {
        this.onInvite.apply(null, binds);
      }
    }.bind(this));
  },
  _getToken: function (address) {
    var deferred = Q.defer();
    this.db.get('select token from invitees where address = ?', [address], function (err, val) {
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(val.token);
    });
    return deferred.promise;
  },
  hasAccess: function (token) {
    var deferred = Q.defer();
    if (!token) {
      deferred.reject('Token is null');
      return deferred.promise;
    }
    this.db.get("select * from invitees where token = ?", [token], function(err, row) {
      if (err || row == null) {
        deferred.reject('Token does not exist');
      } else {
        deferred.resolve(row);
      }
    });
    return deferred.promise;
  },
  get: function (token) {
    var deferred = Q.defer();
    if (!token) {
      deferred.resolve({});
      return deferred.promise;
    }
    this.db.get("select r.* from responses r join invitees i on (r.id = i.response_id) where i.token = ?", [token], function(err, row) {
      if (err || row == null) {
        deferred.resolve({});
      } else {
        deferred.resolve(row);
      }
    });
    return deferred.promise;
  },
  save: function (data, token) {
    var db = this.db;
    var _this = this;
    return this.hasAccess(token).then(function (invitee) {
      //should be wrapped in transaction?
      db.serialize(function() {
        var responseId = invitee && invitee.response_id;
        ResponseDatabase.prototype._upsert.call(_this, data, responseId).then(function (newResponseId) {
          db.run('update invitees set response_id = ? where token = ?', [responseId || newResponseId, token]);
        });
      });
    });
  },
  queryAll: function (sortBy, sortDir, token) {
    return this.hasAccess(token).then(function () {
      var deferred = Q.defer();
      this.db.all('select i.name "_name", ' + this._getProjection() + ', i.response_id from invitees i left outer join responses r on (r.id = i.response_id) order by ' + sortBy  + ' ' + sortDir, function(err, results) {
        if (err) {
          deferred.reject(err);
        } else {
          var responded = _(results).filter(function (r) { return r.response_id != null; });
          var awaitingReply = _(results).filter(function (r) { return r.response_id == null; });
          deferred.resolve({results: responded, awaitingReply: awaitingReply, sortBy: sortBy, sortDir: sortDir});
        }
      });
    return deferred.promise;
    }.bind(this));
  }
});

module.exports = SecuredResponseDatabase;
