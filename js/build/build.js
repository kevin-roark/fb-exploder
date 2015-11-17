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
    'user_hometown',
    'user_relationship_details'
  ].join(',');
  window.FB.login(callback, {scope: scope});
};

var api = module.exports.api = function(endpoint, callback) {
  window.FB.api(endpoint, callback);
};

module.exports.meDump = function(callback) {
  var photosField = 'photos.limit(666){width,height,images,name,updated_time,picture}';
  var albumsField = 'albums.limit(666){count,created_time,description,location,name,photos.limit(666){picture,name}}';
  var postsField = 'posts.limit(666){created_time,description,link,message,picture,shares}';
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

},{}],2:[function(require,module,exports){

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

},{}],3:[function(require,module,exports){

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

},{"./fb":1,"./loading-view":2}]},{},[3]);
