var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var path = require('path');
var SurveyInstance = require('./lib/SurveyInstance');
var router = express.Router();

fs.readdirSync(path.join(__dirname, 'survey_instances')).forEach(function(si) {
  var instance = new SurveyInstance(si);

  router.use(function(req, res, next) {
    instance.hasAccess(req.query.token)
    .then(function () { next(); }, function () {
      res.status(401).render('error', { message: 'Access Denied', error: {status: 401} });
    });
  });

  router.get(instance.url, function(req, res) {
    instance.data(req.query.token).then(function (values) {
      res.render('questions', _.extend(instance.toJSON(), {token: req.query.token, values: values}));
    });
  });

  router.get(instance.url + '/results', function(req, res) {
    instance.results(req.query.sortBy, req.query.sortDir, req.query.token).then(function (results) {
      var i = instance.toJSON();
      _.extend(i, results, {token: req.query.token});
      res.render('results', i);
    });
  });

  router.post(instance.url, function(req, res) {
    var submittedValues = req.body;
    instance.save(submittedValues, req.query.token).then(
      function () {
        res.redirect(instance.url + '/results?token=' + req.query.token);
      },
      function (fieldErrors) {
        res.status(400).render('questions', _.extend(instance.toJSON(), {fieldErrors: fieldErrors, values: submittedValues, token: req.query.token}));
      });
  });
});

module.exports = router;
