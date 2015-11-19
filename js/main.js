
var moment = require('moment');
var fb = require('./fb');
var LoadingView = require('./loading-view');
var color = require('./color');

$(function() {

  /// state

  var $container = $('#content-container');
  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'CRUNCHING YOUR FACEBOOK'
  });
  var meData = {};

  fb.init(function() {
    $facebookLoginButton.fadeIn();
  });

  $(window).mousemove(function(ev) {
    // nice reference for 3d css effects: http://tympanus.net/Development/StackEffects/

    var percent = ev.clientX / window.innerWidth;
    var halfWidth = window.innerWidth / 2;
    var normalizedPercent = percent > 0.5 ? (ev.clientX - halfWidth) / halfWidth : (halfWidth - ev.clientX) / halfWidth;

    var containerRotation = percent * 180 - 90;
    $container.css('transform', 'rotateY(' + containerRotation + 'deg)');

    var zTransform = -300;

    var photoXTranslate = Math.pow(normalizedPercent, 2) * 1200;
    if (percent < 0.5) photoXTranslate = -photoXTranslate;
    $('.fb-photo').css('transform', 'translateZ(' + zTransform + 'px) translateX(' + photoXTranslate + 'px)');

    var postXTranslate = -photoXTranslate;
    $('.fb-post').css('transform', 'translateZ(' + zTransform + 'px) translateX(' + postXTranslate + 'px)');
  });

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
      meData = response;

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
    spitPhotos(data);
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
    var $img = $('<img class="fb-element fb-photo" src="' + photo.picture + '""/>');
    $img.css('top', (Math.random() * window.innerHeight * 0.9) + 'px');
    $img.css('left', (Math.random() * window.innerWidth * 0.9) + 'px');
    $img.css('width', (window.innerWidth * (Math.random() * 0.2 + 0.05)) + 'px');
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
      delay += Math.random() * 400 + 300;

      setTimeout(function() {
        $container.append(renderedPost(post));
      }, delay);
    });
  }

  function renderedPost(post) {
    var html = '<div class="fb-element fb-post">';
    html += '<div class="fb-post-content">';
    html += renderedPostHeader(post);

    if (post.message) html += '<div class="fb-post-message">' + post.message + '</div>';

    if (post.link && post.link.indexOf('facebook') === -1) {
      html += '<a href="' + post.link + '">';
      if (post.picture) {
        html += '<img class="fb-post-picture" src="' + post.picture + '"/>';
      }
      html += '<div class="fb-link-body">';
      html += '<div class="fb-link">' + post.link + '</div>';
      if (post.description) {
        html += '<div class="fb-post-description">' + post.description + '</div>';
      }
      html += '</div></a>'; // link body, then a tag
    }
    else if (post.picture) {
      html += '<img class="fb-post-picture" src="' + post.picture + '"/>';
      if (post.description) {
        html += '<div class="fb-post-description">' + post.description + '</div>';
      }
    }

    html += '</div>'; // content

    html += renderedStats(post);

    html += '</div>';

    var $el = $(html);
    var width = Math.random() * 300 + 200;
    $el.css('width', width + 'px');
    $el.css('left', (Math.random() * (window.innerWidth - width) * 1.15) + 'px');
    $el.css('top', (Math.random() * window.innerHeight * 0.6) + 'px');

    return $el;
  }

  function renderedPostHeader(post) {
    var html = '<div class="fb-post-header">';
    html += '<img class="fb-post-header-picture" src="' + meData.picture.data.url + '" />';
    html += '<div class="fb-post-header-text">';
    html += '<div class="fb-post-header-name">' + meData.name + '</div>';
    html += '<div class="fb-post-header-date">' + formattedDate(post.created_time) + '</div>';
    html += '</div></div>'; // text, then header
    return html;
  }

  function renderedStats(post) {
    var likeCount = post.likes ? post.likes.data.length : 0;
    var shareCount = post.shares ? post.shares.length : 0;
    var commentCount = post.comments ? post.comments.data.length : 0;

    var html = '<div class="fb-post-data">';
    html += '<div class="fb-post-datapoint">' + likeCount + ' likes</div>';
    html += '<div class="fb-post-datapoint">' + commentCount + ' comments</div>';
    html += '<div class="fb-post-datapoint">' + shareCount + ' shares</div>';

    for (var i = 0; i < commentCount; i++) {
      var comment = post.comments.data[i];
      html += '<div class="fb-post-comment">';
      html += '<span class="fb-post-comment-name">' + comment.from.name + '</span>';
      html += ' <span class="fb-post-comment-message">' + comment.message + '</span>';
      html += ' <span class="fb-post-comment-date">' + formattedDate(comment.created_time) + '</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function formattedDate(date) {
    return moment(date).format('MMMM Do YYYY, h:mm a');
  }

});
