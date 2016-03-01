
var kt = require('kutility');
var color = require('./color');

var phrases = [
  "You're so popular!",
  "I like you... Do you like me?",
  "We've shared so much together",
  "Remembering memories with you... Unbeleivable",
  "It feels good, to see you",
  "Cherish what we have, what we've done",
  "You look great today, and yesterday"
];

module.exports.go = function(options) {
  if (!options) options = {};

  var phraseCount = options.phraseCount || 50;
  var $container = options.$container || $('body');
  var delay = options.delay || 0;
  var minX = options.minX || -50;
  var maxX = options.maxX || window.innerWidth - 50;
  var minY = options.minY || 0;
  var maxY = options.maxY || window.innerHeight - 20;
  var minFontSize = options.minFontSize || 16;
  var maxFontSize = options.maxFontSize || 72;
  var fontFamily = options.fontFamily || 'sans-serif';

  for (var i = 0; i < phraseCount; i++) {
    var phrase = kt.choice(phrases);
    var textColor = color.randomBrightColor();
    var shadowColor = color.randomBrightColor();
    var fontSize = kt.randInt(minFontSize, maxFontSize);
    var x = kt.randInt(minX, maxX);
    var y = kt.randInt(minY, maxY);
    var rotation = kt.randInt(0, 360);
    var fadeTime = kt.randInt(200, 5000);

    var $div = $('<div class="scattered-phrase">')
      .text(phrase)
      .css('position', 'absolute').css('left', x + 'px').css('top', y + 'px')
      .css('font-family', fontFamily).css('font-size', fontSize + 'px')
      .css('color', textColor).css('text-shadow', '5px 5px 20px ' + shadowColor)
      .css('transform', 'rotate(' + rotation + 'deg)')
      .css('display', 'none');

    $container.append($div);
    setTimeout(function() {
      $div.fadeIn(fadeTime);
    }, delay);
  }
};

module.exports.hide = function(fadeTime) {
  if (fadeTime) {
    $('.scattered-phrase').fadeOut(fadeTime);
  }
  else {
    $('.scattered-phrase').remove();
  }
};
