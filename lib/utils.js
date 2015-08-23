var path = require('path');
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var VALID_FIELD_TYPES = ['number', 'text', 'select'];
var TO_SQL_TYPE = {'number': 'integer', 'text': 'text', 'select': 'text'};
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
  }
};