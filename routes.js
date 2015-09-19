var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var path = require('path');
var SurveyInstance = require('./lib/SurveyInstance');
var router = express.Router();

fs.readdirSync(path.join(__dirname, 'survey_instances')).forEach(function(si) {
  var instance = new SurveyInstance(si);

  router.get(instance.url, function(req, res) {
    res.render('questions', instance.toJSON());
  });
  router.get(instance.url + '/results', function(req, res) {
    instance.results(req.query.sortBy, req.query.sortDir).then(function (results) {
      var i = instance.toJSON();
      _.extend(i, results);
      res.render('results', i);
    });
  });
  router.post(instance.url, function(req, res, next) {
    var submittedValues = req.body;
    instance.save(submittedValues).then(
      function () {
        res.redirect(instance.url + '/results');
      },
      function (fieldErrors) {
        res.status(400).render('questions', _.extend(instance.toJSON(), {fieldErrors: fieldErrors, values: submittedValues}));
      });
  });
});

module.exports = router;
