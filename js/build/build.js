(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

$(function() {

  // state

  var $facebookLoginButton = $('#facebook-login-button');

  // facebook time

  function attemptLogin() {
    var scope = 'public_profile,user_photos,user_friends,user_likes,user_posts';
    window.FB.login(didLogin, {scope: scope});
  }

  window.fbAsyncInit = function() {
    window.FB.init({
      appId      : '112359899129533',
      xfbml      : true,
      cookie     : true,
      version    : 'v2.5'
    });

    $facebookLoginButton.fadeIn();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  // behavior time

  $facebookLoginButton.click(() => {
    attemptLogin();
  });

  function didLogin() {
    $('#welcome-container').fadeOut(1000);
    console.log('you are in...');
    window.FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
    });
  }

});

},{}]},{},[1]);
