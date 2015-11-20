
var moment = require('moment');
var TWEEN = require('tween.js');

var fb = require('./fb');
var LoadingView = require('./loading-view');
var color = require('./color');

$(function() {

  /// state

  var $container = $('#content-container');
  var $photosLayer = $('#photos-layer');
  var $postsLayer = $('#posts-layer');
  var orderedLayers = [$photosLayer, $postsLayer];
  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'CRUNCHING YOUR FACEBOOK'
  });
  var meData;

  update();

  fb.init(function() {
    $facebookLoginButton.fadeIn();
  });

  $(window).mousemove(function(ev) {
    // nice reference for 3d css effects: http://tympanus.net/Development/StackEffects/

    var percent = ev.clientX / window.innerWidth;
    var halfWidth = window.innerWidth / 2;
    var normalizedPercent = percent > 0.5 ? (ev.clientX - halfWidth) / halfWidth : (halfWidth - ev.clientX) / halfWidth;

    var containerRotation = percent * 120 - 60;
    $container.css('transform', 'rotateY(' + containerRotation + 'deg)');

    var zTransform = 0;

    var xTranslationMagnitude = Math.pow(normalizedPercent, 2) * 400;
    if (percent < 0.5) xTranslationMagnitude = -xTranslationMagnitude;
    for (var i = 0; i < orderedLayers.length; i++) {
      var $layer = orderedLayers[i];
      var xTranslation = (i / (orderedLayers.length - 1)) * (2 * xTranslationMagnitude) - xTranslationMagnitude;
      $layer.css('transform', 'translateZ(' + zTransform + 'px) translateX(' + xTranslation + 'px)');
    }
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

  function update() {
    requestAnimationFrame(update);

    TWEEN.update();
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
    var photoIndex = 0;
    var activeRenderedPhotos = [];
    var isFillingScreen = true;
    var accumulatedScreenFillingTargetBottom = 0;

    var rowWidths, leftOffset, lastRowMinHeight, minRowHeight = 0;
    function resetRowVariables() {
      lastRowMinHeight = minRowHeight;
      rowWidths = nextRowWidthPercentages();
      leftOffset = 0;
      minRowHeight = 100000000;
    }
    resetRowVariables();

    spitNextPhoto();

    function spitNextPhoto() {
      if (rowWidths.length === 0) {
        resetRowVariables();

        if (accumulatedScreenFillingTargetBottom >= 0.99) {
          isFillingScreen = false;
        }

        if (isFillingScreen) {
          accumulatedScreenFillingTargetBottom += lastRowMinHeight;
        }

        var nextRowTime = Math.random() * 2500 + 2500;
        setTimeout(spitNextPhoto, nextRowTime);
        return;
      }

      var width = rowWidths.shift();
      var offset = leftOffset;
      leftOffset += width; // for next time

      if (photoIndex >= photos.length) {
        photoIndex = 0;
      }
      var photo = photos[photoIndex++];
      photo.renderedHeight = (photo.height / photo.width) * width * 0.01; // unit is decimal percentage of window width
      minRowHeight = Math.min(photo.renderedHeight, minRowHeight);

      var $html = renderedPhoto(photo);
      $html.css('left', offset + '%');
      $html.css('width', width + '%');
      $html.css('top', 0);
      $html._yOffset = -(photo.renderedHeight * window.innerWidth);
      $html.css('transform', 'translateY(' + $html._yOffset + 'px)');

      activeRenderedPhotos.push($html);
      $photosLayer.append($html);

      var targetOffset = isFillingScreen ? window.innerHeight - (accumulatedScreenFillingTargetBottom * window.innerWidth) - (photo.renderedHeight * window.innerWidth) : 300;
      var time = Math.random() * 1500 + 1500;
      var downTween = new TWEEN.Tween($html).to({_yOffset: targetOffset}, time);
      downTween.onUpdate(function() {
        $html.css('transform', 'translateY(' + $html._yOffset + 'px)');
      });
      downTween.start();

      var nextTime = Math.random() * 500 + 50;
      setTimeout(spitNextPhoto, nextTime);
    }
  }

  function renderedPhoto(photo) {
    var $img = $('<img class="fb-element fb-photo" src="' + photo.picture + '""/>');
    return $img;
  }

  function choice(arr) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  function nextRowWidthPercentages() {
    var percentageOptions = [10, 10, 15, 15, 20, 20, 30];

    var attempts = 0;
    var sum = 0;
    var widths = [];
    while (sum < 100 && attempts < 50) {
      attempts += 1;
      var width = choice(percentageOptions);
      if (sum + width <= 100) {
        widths.push(width);
        sum += width;
      }
    }
    if (sum < 100) {
      widths.push(100 - sum);
    }

    return widths;
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
        $postsLayer.append(renderedPost(post));
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

// request animation frame shim
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                      window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
