var request = require('supertest');
describe('routes', function () {
  var app;
  before(function () {
    server = require('../app');
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
  it('should be able to post data', function (done) {
    request(server)
      .post('/example')
      .send({scale: 10, likeWhat: 'foo', spiceGirls: 'Scary'})
      .expect(302, done);
  });
});