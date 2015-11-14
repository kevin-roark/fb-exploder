
var fb = require('./fb');

$(function() {

  // state
  var $facebookLoginButton = $('#facebook-login-button');

  // init
  fb.init(() => {
    $facebookLoginButton.fadeIn();
  });

  // behavior time

  $facebookLoginButton.click(function() {
    fb.login(didLogin);
  });

  function didLogin() {
    $('#welcome-container').fadeOut(1000);

    fb.api('/me', function(response) {
      console.log(response);
    });

    fb.photos(function(response) {
      console.log(response);

      var data = response.data;
      spitPhotos(data);
      for (var i = 0; i < 4; i++) {
        setTimeout(function() {
          spitPhotos(data);
        }, i * 1000);
      }
    });

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
        $img.css('width', (Math.random() * window.innerWidth * 0.1 + 0.08) + 'px');
        $('body').append($img);
      }, delay);
    });
  }

});
