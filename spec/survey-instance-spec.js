var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var chai = require('chai');
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);
chai.config.includeStack = true;

var SurveyInstance = require('../lib/SurveyInstance');
var si;
describe('Open SurveyInstance', function() {
  before(function () {
    si = new SurveyInstance('example', {dbFileLocation: path.join(__dirname, 'example.db')});
  });
  after(function () {
    fs.unlink(path.join(__dirname, 'example.db'));
  });
  it('should load the instance file', function () {
    assert(si.title === "An Example Survey");
  });
  it('should be able to save and retrive sorted results', function (done) {
    var v = {scale: 10, likeWhat: 'foo', mostWork: 'UI'};
    var v2 = {scale: 2, likeWhat: 'bar', mostWork: 'Documentation'};
    var v3 = {scale: 5, likeWhat: 'zoo', mostWork: 'Demo'};
    si.save(v)
      .then(si.save.bind(si, v2))
      .then(si.save.bind(si, v3))
      .then(function () {
        si.results().then(function (results) {
          assert.equal(results.sortDir, 'asc', 'Sort dir is correct');
          assert.equal(results.sortBy, 1, 'Sorting by correct column');
          assert.equal(results.results.length, 3, 'Correct number of results');
          assert.deepEqual(results.results[0], v2, 'Correctly sorting by first column');
          si.results(2, 'desc').then(function (results2) {
            assert.deepEqual(results2.results[0], v3, 'Correctly sorting by second column desc');
            done();
          });
        });
    });
  });
});

//var logArgs = function () { console.log(arguments); };
var send;
describe('Invite-only SurveyInstance', function() {
  before(function () {
    send = sinon.spy();
    si = new SurveyInstance('invite_only_example', { dbFiileLocation: path.join(__dirname, 'invite_only_example.db'), invitationTransporter: {send: send} });
  });
  after(function () {
    fs.unlink(path.join(__dirname, '..', 'db', 'invite_only_example.db'));
  });
  it('should mail out invitations', function () {
    expect(send).to.have.been.calledWith(sinon.match({ to: '@jonmbake', surveyTitle: si.title, message: sinon.match(/You have been invited to complete a survey at http:\/\/localhost\/invite_only_example\?token=.{96}\./) }));
  });
  it('should not be able to save without token', function (done) {
    var v = {scale: 10, likeWhat: 'foo', mostWork: 'UI'};
    si.save(v)
      .then(function () {
        assert.ok(false, 'Save without token suceeded');
        done();
      }, function () {
        assert.ok(true, 'Save without token had error');
        done();
      });
  });
  it('should not be able to get without token', function (done) {
    si.results()
      .then(function () {
        assert.ok(false, 'Get results without token suceeded');
        done();
      }, function () {
        assert.ok(true, 'Get results without token had error');
        done();
      });
  });
  it('should be able to save, update and get results with token', function (done) {
    var v = {scale: 10, likeWhat: 'foo', mostWork: 'UI'};
    var v2 = {scale: 5, likeWhat: 'bar', mostWork: 'Documentation'};
    si.db._getToken('@jonmbake').then(function (token) {
      si.save(v, token).then(function () {
        setTimeout(function () {
          si.results(null, null, token).then(function (results) {
            assert.equal(results.results.length, 1, 'Correct number of results');
            assert.deepEqual(results.results[0], _.extend({_name: 'Jon Bake', response_id: 1}, v), 'Results are returned');
            si.save(v2, token).then(function () {
              setTimeout(function () {
                si.getResponse(token).then(function (response) {
                  assert.deepEqual(response, _.extend({id: 1}, v2));
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});