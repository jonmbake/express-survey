var path = require('path');

var VALID_FIELD_TYPES = ['number', 'text', 'select', 'checkbox'];

var SQL_MAX_INT = 9223372036854775807;
var SQL_MIN_INT = -9223372036854775808;
module.exports = {
  loadFieldSet: function (fieldSetName) {
    var fs = require(path.join(__dirname, '..', 'json', 'field_sets', fieldSetName + '.json'));
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
  validateData: function (fields, data) {
    var errors = {};
    for (var p in fields) {
      var f = fields[p];
      var val = data[f.name];
      if (val == null || val.toString().trim().length === 0) {
        if (f.validations && f.validations.required) {
          errors[f.name] = 'Required.';
        }
        continue;
      }
      //validation based on type
      switch (f.type) {
        case "checkbox":
          f.validations = f.validations || {};
          f.validations.max = 1;
          f.validations.min = 0;
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