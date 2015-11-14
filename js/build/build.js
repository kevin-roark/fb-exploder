(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports.init = function(callback) {
  window.fbAsyncInit = function() {
    window.FB.init({
      appId      : '112359899129533',
      xfbml      : true,
      cookie     : true,
      version    : 'v2.5'
    });

    if (callback) {
      callback();
    }
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
};

module.exports.login = function(callback) {
  var scope = 'public_profile,user_photos,user_friends,user_likes,user_posts';
  window.FB.login(callback, {scope: scope});
};

var api = module.exports.api = function(endpoint, callback) {
  window.FB.api(endpoint, callback);
};

module.exports.photos = function(callback) {
  api('/me/photos?fields=width,height,images,name,updated_time,picture&limit=666', callback);
};

},{}],2:[function(require,module,exports){

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

},{"./fb":1}]},{},[2]);
