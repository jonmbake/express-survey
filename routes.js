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
    instance.results().then(function (results) {
      var i = instance.toJSON();
      i.results = results;
      res.render('results', i);
    });
  });
  router.post(instance.url, function(req, res, next) {
    instance.save(req.body).then(function () {
        res.redirect(instance.url + '/results');
    });
  });
});

module.exports = router;
