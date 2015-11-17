(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* thanks henry */

function v() {
  return Math.floor(Math.random() * 256);
}

module.exports.randomColor = function() {
  return "rgb(" + v() + "," + v() + ", " + v() + ")";
};

module.exports.randomBrightColor = function() {
  var key = Math.floor(Math.random() * 6);

  if (key === 0)
    return "rgb(" + "0,255," + v() + ")";
  else if (key === 1)
    return "rgb(" + "0," + v() + ",255)";
  else if (key === 2)
    return "rgb(" + "255, 0," + v() + ")";
  else if (key === 3)
    return "rgb(" + "255," + v() + ",0)";
  else if (key === 4)
    return "rgb(" + v() + ",255,0)";
  else
    return "rgb(" + v() + ",0,255)";
};

},{}],2:[function(require,module,exports){

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
  var scope = [
    'public_profile',
    'user_photos',
    'user_friends',
    'user_likes',
    'user_posts',
    'user_managed_groups',
    'user_about_me',
    'user_birthday',
    'user_relationships',
    'user_tagged_places',
    'user_work_history',
    'user_education_history',
    'user_location',
    'user_religion_politics',
    'user_events',
    'user_hometown'
  ].join(',');
  window.FB.login(callback, {scope: scope});
};

var api = module.exports.api = function(endpoint, callback) {
  window.FB.api(endpoint, callback);
};

module.exports.meDump = function(callback) {
  var photosField = 'photos.limit(666){width,height,name,updated_time,picture,comments,tags,likes}';
  var albumsField = 'albums.limit(666){count,created_time,description,location,name,photos.limit(666){picture,name}}';
  var postsField = 'posts.limit(666){created_time,description,link,message,picture,shares,message_tags}';
  var placesField = 'tagged_places.limit(666){created_time,place{name}}';
  var friendsField = 'friends.limit(5000)';
  var eventsField = 'events.limit(666){description,cover,name,owner,start_time,attending_count,declined_count,maybe_count,noreply_count}';
  var likesField = 'likes.limit(666){about,category,cover,description,name,likes}';
  var groupsField = 'groups.limit(666){cover,description,name,privacy}';
  var demographicFields = 'family{name},about,age_range,bio,birthday,education,email,name,hometown{name},location{name},political,relationship_status,religion,work,cover';
  var combinedFields = [
    photosField,
    albumsField,
    postsField,
    placesField,
    friendsField,
    eventsField,
    likesField,
    groupsField,
    demographicFields
  ].join(',');
  api('/me?fields=' + combinedFields, callback);
};

},{}],3:[function(require,module,exports){

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

},{}],4:[function(require,module,exports){

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

},{"./color":1,"./fb":2,"./loading-view":3}]},{},[4]);
