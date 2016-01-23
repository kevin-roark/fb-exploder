
var TWEEN = require('tween.js');
var buzz = require('./lib/buzz');

require('./shims');
var fb = require('./fb');
var fbRenderer = require('./fb-renderer');
var fbGravityStreamer = require('./fb-gravity-streamer');
var LoadingView = require('./loading-view');

$(function() {

  /// state

  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'Gathering your Facebook data'
  });
  var friendsSound = new buzz.sound('/media/friends', {
    formats: ['mp3'],
    webAudioApi: true
  });
  var shouldUpdate = true;

  update();

  fb.init(function() {
    friendsSound.loop().play();
    $facebookLoginButton.animate({opacity: 1}, 500);
  });

  $(window).mousemove(function(ev) {
    fbGravityStreamer.mouseUpdate(ev.clientX, ev.clientY);
  });

  $(document).keypress(function(ev) {
    var key = ev.which;
    if (key === 32) {
      shouldUpdate = !shouldUpdate;
      fbGravityStreamer.setShouldUpdate(shouldUpdate);
    }
  });

  /// behavior

  $facebookLoginButton.click(function() {
    fb.login(didLogin);
  });

  function didLogin() {
    $('.welcome-container').fadeOut();

    loadingView.start();

    fb.meDump(function(response) {
      console.log(response);

      loadingView.stop();
      fbRenderer.init(response);
      fbGravityStreamer.startWithFacebookDump(response);
    });
  }

  function update() {
    requestAnimationFrame(update);

    if (!shouldUpdate) {
      return;
    }

    TWEEN.update();

    fbGravityStreamer.update();
  }

});
