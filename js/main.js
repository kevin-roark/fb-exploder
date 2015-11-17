
var fb = require('./fb');
var LoadingView = require('./loading-view');

$(function() {

  // state
  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'CRUNCHING YOUR FACEBOOK'
  });

  // init
  fb.init(function() {
    $facebookLoginButton.fadeIn();
  });

  // behavior time

  $facebookLoginButton.click(function() {
    fb.login(didLogin);
  });

  function didLogin() {
    $('#welcome-container').fadeOut(1000);

    loadingView.start();

    fb.meDump(function(response) {
      console.log(response);
      loadingView.stop();

      handlePhotos(response.photos);
    });
  }

  function handlePhotos(photos) {
    if (!photos) {
      return;
    }

    var data = photos.data;
    var spit = function() { spitPhotos(data); };
    var delaySpit = function(delay) { setTimeout(spit, delay); };

    // spit 5 times
    for (var i = 0; i < 5; i++) {
      delaySpit(i * 10000);
    }
  }

  function spitPhotos(photos) {
    var delay = 0;

    photos.forEach(function(photo) {
      delay += Math.random() * 200 + 50;

      setTimeout(function() {
        var $img = $('<img src="' + photo.picture + '""/>');
        $img.css('position', 'fixed');
        $img.css('top', (Math.random() * window.innerHeight * 0.9) + 'px');
        $img.css('left', (Math.random() * window.innerWidth * 0.9) + 'px');
        $img.css('width', (window.innerWidth * (Math.random() * 0.1 + 0.05)) + 'px');
        $('body').append($img);
      }, delay);
    });
  }

});
