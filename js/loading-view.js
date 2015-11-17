
module.exports = LoadingView;

function LoadingView(options) {
  this.$el = options.$el;
  this.baseText = options.baseText || 'loading';
  this.delay = options.delay || 250;

  this.loading = false;
}

LoadingView.prototype.start = function() {
  this.loading = true;
  this.$el.text(this.baseText);
  this.$el.fadeIn();

  this.update();
};

LoadingView.prototype.update = function() {
  if (!this.loading) {
    return;
  }

  var currentText = this.$el.text();
  if (currentText.length < this.baseText.length + 3) {
    currentText += '.';
    this.$el.text(currentText);
  }
  else {
    this.$el.text(this.baseText);
  }

  setTimeout(this.update.bind(this), this.delay);
};

LoadingView.prototype.stop = function() {
  this.loading = false;
  this.$el.fadeOut();
};
