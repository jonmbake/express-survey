var path = require('path');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var _ = require('underscore');

var VALID_FIELD_TYPES = ['number', 'text', 'select'];
var TO_SQL_TYPE = {'number': 'integer', 'text': 'text', 'select': 'text'};
var SQL_MAX_INT = 9223372036854775807;
var SQL_MIN_INT = -9223372036854775808;
module.exports = {
  loadFieldSet: function (fieldSetName) {
    var fs = require(path.join(__dirname, '..', 'field_sets', fieldSetName + '.json'));
    fs.forEach(function (f) {
      if (!f.title || !f.name || !f.type) {
        throw new Error('Title, name or type missing for field set field defintion: ' + JSON.stringify(f) + ' in ' + fieldSetName);
      }
      if (VALID_FIELD_TYPES.indexOf(f.type) === -1) {
       throw new Error('Invalid type for field set field defintion: ' + JSON.stringify(f) + ' in ' + fieldSetName);
      }
    });
    return fs;
  },
  initDb: function (dbName, fieldSet, dbLocation) {
    var dbFile = dbLocation || path.join(__dirname, '..', 'db', dbName + '.db');
    var exists = fs.existsSync(dbFile);
    var db = new sqlite3.Database(dbFile);
    if (!exists) {
      db.serialize(function() {
          var colTypes = fieldSet.map(function (fs) {
              return '"' + fs.name + '"' + ' ' + TO_SQL_TYPE[fs.type];
            }).join(', ');
          db.run('create table responses (id integer primary key autoincrement, ' + colTypes + ')');
      });
    }
    return db;
  },
  validateData: function (fields, data) {
    var errors = {};
    for (var p in fields) {
      var f = fields[p];
      var val = data[f.name];
      if (_.isEmpty(val)) {
        if (f.validations && f.validations.required) {
          errors[f.name] = 'Required.';
        }
        continue;
      }
      //validation based on type
      switch (f.type) {
        case "number":
          var parsedInt = parseInt(data[f.name], 10);
          var max = f.validations.max || SQL_MAX_INT;
          var min = f.validations.min || SQL_MIN_INT;
          if (isNaN(parsedInt)) {
            errors[f.name] = 'Must be an integer value.';
          } else if (parsedInt > max) {
            errors[f.name] = 'Value is outside of maximum range. Maximum value allowed is ' + max + '.';
          } else if (parsedInt < min) {
            errors[f.name] = 'Value is outside minimum range. Minimum value allowed is ' + min + '.';
          }
          break;
        case "select":
          if (f.options.indexOf(val) === -1) {
            errors[f.name] = 'Must select one of the following values: ' + f.options.join(', ') + '.';
          }
          break;
      }
    }
    return errors;
  }
};