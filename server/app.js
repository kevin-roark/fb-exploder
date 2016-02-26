
var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var RunningStats = require('./running-stats');

var runningScorePath = path.join(__dirname, 'score.json');
var runningStats = new RunningStats(JSON.parse(fs.readFileSync(runningScorePath)));

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.post('/score', function(req, res) {
  var score = parseFloat(req.body.score) || 0;

  addScore(score, function(err, data) {
    var responseData = {
      percentile: data && data.percentile ? data.percentile : 50
    };

    if (err) {
      responseData.error = err;
    }

    res.send(responseData);
  });
});

var server = http.createServer(app);

var port = parseInt(process.env.LIFE_IN_REVIEW_PORT || 3000);
server.listen(port);

server.on('listening', function() {
  console.log('listening on ' + port);
});

function addScore(score, callback) {
  if (!callback) {
    callback = function() {};
  }

  runningStats.push(score);

  callback(null, {percentile: runningStats.percentile(score)});

  fs.writeFile(runningScorePath, JSON.stringify(runningStats.serialize()), function(err) {
    if (err) {
      console.error('error writing score json...');
      console.error(err);
    }
  });
}
