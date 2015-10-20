var request = require('supertest');
var fs = require('fs');
var path = require('path');

describe('routes', function () {
  var server;
  before(function () {
    server = require('../app');
    fs.unlink(path.join(__dirname, 'example.db'));
  });
  it('should be able to get example questions', function (done) {
    request(server)
      .get('/example')
      .expect(200, done);
  });
  it('should be able to get results', function (done) {
    request(server)
      .get('/example/results')
      .expect(200, done);
  });
  it('should be able to post valid data', function (done) {
    request(server)
      .post('/example')
      .send({scale: '10', likeWhat: 'foo', mostWork: 'UI'})
      .expect(302, done);
  });
});

describe('validation', function () {
  var server;
  before(function () {
    server = require('../app');
    fs.unlink(path.join(__dirname, 'example.db'));
  });
  it('should get error when not posting required field', function (done) {
    request(server)
      .post('/example')
      .send({likeWhat: 'foo', mostWork: 'UI'})
      .expect(400, done);
  });
  it('should get error when number is lower than min', function (done) {
    request(server)
      .post('/example')
      .send({scale: '0', likeWhat: 'foo', mostWork: 'UI'})
      .expect(400, done);
  });
  it('should get error when number is greater than max', function (done) {
    request(server)
      .post('/example')
      .send({scale: '11', likeWhat: 'foo', mostWork: 'UI'})
      .expect(400, done);
  });
  it('should get error when number not really a number', function (done) {
    request(server)
      .post('/example')
      .send({scale: 'NOT_A_NUMBER', likeWhat: 'foo', mostWork: 'UI'})
      .expect(400, done);
  });
  it('should get error when selecting an option that does not exist', function (done) {
    request(server)
      .post('/example')
      .send({scale: '10', likeWhat: 'foo', mostWork: 'NOT_A_VALID_OPTION'})
      .expect(400, done);
  });
});
