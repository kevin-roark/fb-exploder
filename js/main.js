
var TWEEN = require('tween.js');
var buzz = require('./lib/buzz');

require('./shims');
var fb = require('./fb');
var fbRenderer = require('./fb-renderer');
var LoadingView = require('./loading-view');
var fbGravityStreamer = require('./fb-gravity-streamer');
var fbPopularityCalculator = require('./fb-popularity-calculator');

var HELLO_STATE = 0;
var POPULARITY_STATE = 1;
var GRAVITY_STATE = 2;

$(function() {

  /// state

  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'Gathering and Crunching your Facebook data'
  });
  var friendsSound = new buzz.sound('media/friends3', {
    formats: ['mp3'],
    webAudioApi: true
  });
  var shouldUpdate = true;
  var currentState = HELLO_STATE;

  update();

  fb.init(function() {
    friendsSound.loop().play();
    var isMuted = false;
    $('.sound-toggle').click(function() {
      isMuted = !isMuted;
      friendsSound.setVolume(isMuted ? 0 : 80);
    });

    $facebookLoginButton.animate({opacity: 1}, 500);
  });

  $(window).mousemove(function(ev) {
    if (currentState === GRAVITY_STATE) {
      fbGravityStreamer.mouseUpdate(ev.clientX, ev.clientY);
    }
  });

  $(document).keypress(function(ev) {
    var key = ev.which;
    if (key === 32) {
      shouldUpdate = !shouldUpdate;

      if (currentState === GRAVITY_STATE) {
        fbGravityStreamer.setShouldUpdate(shouldUpdate);
      }
    }
  });

  /// behavior

  $facebookLoginButton.click(function() {
    fb.login(didLogin);
  });

  function didLogin() {
    $('.welcome-container').fadeOut();

    loadingView.start();

    var $loadingWaitText = $('#loading-wait-text');
    $loadingWaitText.fadeIn();

    var waitTextInterval = setInterval(function() {
      var top = parseFloat($loadingWaitText.css('top')) + (Math.random() - 0.5) * 2;
      $loadingWaitText.css('top', top + 'px');

      var left = parseFloat($loadingWaitText.css('left')) + (Math.random() - 0.5) * 2;
      $loadingWaitText.css('left', left + 'px');
    }, 50);

    fb.meDump(function(response) {
      loadingView.stop();
      $('#loading-wait-text').fadeOut();
      clearInterval(waitTextInterval);

      fbRenderer.init(response);
      currentState = POPULARITY_STATE;

      fbPopularityCalculator.start(response, function finishedPopularity() {
        currentState = GRAVITY_STATE;
        fbGravityStreamer.start(response);
      });
    });
  }

  function update() {
    requestAnimationFrame(update);

    if (!shouldUpdate) {
      return;
    }

    TWEEN.update();

    if (currentState === GRAVITY_STATE) {
      fbGravityStreamer.update();
    }
  }

});
