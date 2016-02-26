
// inspired by http://www.johndcook.com/blog/standard_deviation/

module.exports = RunningStats;

function RunningStats(config) {
  if (!config) {
    config = {};
  }

  this.numberOfEntries = config.numberOfEntries || 0;
  this.oldMean = config.oldMean;
  this.newMean = config.newMean;
  this.oldVarianceS = config.oldVarianceS;
  this.newVarianceS = config.newVarianceS;
}

RunningStats.prototype.push = function(x) {
  this.numberOfEntries += 1;

  if (this.numberOfEntries === 1) {
    this.oldMean = this.newMean = x;
    this.oldVarianceS = this.newVarianceS = 0;
    return;
  }

  this.newMean = this.oldMean + (x - this.oldMean) / this.numberOfEntries;
  this.newVarianceS = this.oldVarianceS + (x - this.oldMean) * (x - this.newMean);

  this.oldMean = this.newMean;
  this.oldVarianceS = this.newVarianceS;
};

RunningStats.prototype.mean = function() {
  return this.numberOfEntries > 0 ? this.newMean : 0;
};

RunningStats.prototype.variance = function() {
  return this.numberOfEntries > 1 ? this.newVarianceS / (this.numberOfEntries - 1) : 0;
};

RunningStats.prototype.standardDeviation = function() {
  return Math.sqrt(this.variance());
};

RunningStats.prototype.percentile = function(x) {
  var mean = this.mean();
  var sd = this.standardDeviation();

  if (sd === 0) {
    return x < mean ? 0 : 1;
  }

  var percentile = normalcdf((x - mean) / sd);

  return Math.round(percentile * 10000) / 100;
};

RunningStats.prototype.serialize = function() {
  return {
    numberOfEntries: this.numberOfEntries,
    oldMean: this.oldMean,
    newMean: this.newMean,
    oldVarianceS: this.oldVarianceS,
    newVarianceS: this.newVarianceS
  };
};


// classic TI-83 way to calculate normal distribution
function normalcdf(x) {
	var t = 1 / (1 + 0.2316419 * Math.abs(x));
	var d = 0.3989423 * Math.exp(-x * x / 2);

  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  if (x > 0) {
    p = 1 - p;
	}

	return p;
}
