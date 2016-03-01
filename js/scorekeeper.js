
var Odometer = require('odometer');

module.exports = ScoreKeeper;

function ScoreKeeper(options) {
  if (!options) options = {};
  this.$scoreZone = options.$scoreZone || $('.collage-score-zone');
  this.$scoreEl = options.$scoreEl || $('#collage-score');
  this.score = options.initialScore ||  0;
  this.isShowing = false;

  this.odometer = new Odometer({
    el: this.$scoreEl.get(0),
    value: this.score,
    theme: 'default',
    duration: 100
  });
  this.odometer.update(0);
}

ScoreKeeper.prototype.show = function(dur) {
  if (!dur) {
    this.$scoreZone.show();
    this.isShowing = true;
  }
  else {
    var self = this;
    this.$scoreZone.fadeIn(dur, function() {
      self.isShowing = true;
    });
  }
};

ScoreKeeper.prototype.hide = function(dur) {
  if (!dur) {
    this.$scoreZone.hide();
    this.isShowing = false;
  }
  else {
    var self = this;
    this.$scoreZone.fadeOut(dur, function() {
      self.isShowing = false;
    });
  }
};

ScoreKeeper.prototype.addScore = function(increment) {
  this.setScore(increment + this.score);

};

ScoreKeeper.prototype.drain = function() {
  this.setScore(0);
};

ScoreKeeper.prototype.setScore = function(score) {
  if (!this.isShowing) {
    this.show();
  }

  this.score = score;
  this.odometer.update(score);
};
