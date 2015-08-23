var assert = require('assert');
var fs = require('fs');
var path = require('path');
var assert = require('chai').assert;

var SurveyInstance = require('../lib/SurveyInstance');
var si;
describe('SurveyInstance', function() {
	before(function () {
		si = new SurveyInstance('example', {dbLocation: path.join(__dirname, 'example.db')});
	});
	after(function () {
		fs.unlink(path.join(__dirname, 'example.db'));
	});
	it('should load the instance file', function () {
		assert(si.title === "An Example Survey");
	});
	it('should be able to save and retrive results', function () {
		var v = {scale: 10, likeWhat: 'foo', changeWhat: 'bar', opts: 'First'};
		si.save(v);
		si.results().then(function (results) {
			assert.deepEqual(results, v);
		});
	});
});