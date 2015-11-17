
var fb = require('./fb');
var LoadingView = require('./loading-view');
var color = require('./color');

$(function() {

  /// state

  var $container = $('body');
  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'CRUNCHING YOUR FACEBOOK'
  });

  fb.init(function() {
    $facebookLoginButton.fadeIn();
  });

  $(window).resize(layout);
  function layout() {
    $container.css('height', (window.innerHeight * 2) + 'px');
  }
  layout();

  /// behavior

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
      handlePosts(response.posts);
    });
  }

  /// photos

  function handlePhotos(photos) {
    if (!photos) {
      return;
    }

    var data = photos.data;
    var spit = function() { spitPhotos(data); };
    var delaySpit = function(delay) { setTimeout(spit, delay); };

    // do each photo twice
    for (var i = 0; i < 2; i++) {
      delaySpit(i * 30000);
    }
  }

  function spitPhotos(photos) {
    var delay = 0;

    photos.forEach(function(photo) {
      delay += Math.random() * 200 + 50;

      setTimeout(function() {
        $container.append(renderedPhoto(photo));
      }, delay);
    });
  }

  function renderedPhoto(photo) {
    var $img = $('<img class="fb-photo" src="' + photo.picture + '""/>');
    $img.css('top', (Math.random() * window.innerHeight * 0.9) + 'px');
    $img.css('left', (Math.random() * window.innerWidth * 0.9) + 'px');
    $img.css('width', (window.innerWidth * (Math.random() * 0.1 + 0.05)) + 'px');
    return $img;
  }

  /// posts

  function handlePosts(posts) {
    if (!posts) {
      return;
    }

    var data = posts.data;
    var delay = 0;

    data.forEach(function(post) {
      delay += Math.random() * 666 + 666;

      setTimeout(function() {
        $container.append(renderedPost(post));
      }, delay);
    });
  }

  function renderedPost(post) {
    var text = '';
    if (post.description) text += post.description;
    if (post.message) text += ' — ' + post.message;
    if (post.link) text += ' — <a href="' + post.link + '">' + post.link + '</a>';

    var $el = $('<div class="fb-post">' + text + '</div>');
    $el.css('color', color.randomBrightColor());
    $el.css('font-size', (Math.floor(Math.random() * 30) + 12) + 'px');

    var width = (window.innerWidth * (Math.random() * 0.33 + 0.33));
    $el.css('max-width', width + 'px');
    $el.css('left', (Math.random() * (window.innerWidth - width) * 1.15) + 'px');
    $el.css('top', (Math.random() * window.innerHeight * 0.85) + 'px');

    return $el;
  }

});
