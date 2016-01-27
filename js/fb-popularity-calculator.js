
var fbRenderer = require('./fb-renderer');

var PiecesToShow = 3;
var LikeValue = 1;
var CommentValue = 2;
var ShareValue = 3;

var $container;
$(function() {
  $container = $('#content-container');
});

/// Public

module.exports.start = function _start(dump, finishedCallback) {
  var bestPhotos = dump.photos ? calculateBestElements(dump.photos.data, calculateStandardPoints) : [];
  var bestPosts = dump.posts ? calculateBestElements(dump.posts.data, calculateStandardPoints) : [];
  var bestLikes = dump.likes ? calculateBestElements(dump.likes.data, calculateLikePoints) : [];
  var bestEvents = dump.events ? calculateBestElements(dump.events.data, calculateEventPoints) : [];
  var bestContent = {photos: bestPhotos, posts: bestPosts, likes: bestLikes, events: bestEvents};
  console.log(bestContent);

  var $popularityZone = $('<div class="popularity-zone"></div>');
  $container.append($popularityZone);

  var $bestPhotos = renderedBestPhotos(bestPhotos);
  $popularityZone.append($bestPhotos);

  var $bestPosts = renderedBestPosts(bestPosts);
  $popularityZone.append($bestPosts);

  var $bestEvents = renderedBestEvents(bestEvents);
  $popularityZone.append($bestEvents);

  var $bestLikes = renderedBestLikes(bestLikes);
  $popularityZone.append($bestLikes);

  $bestPhotos.animate({opacity: 1}, 2000);
  setTimeout(function() {
    $bestPosts.animate({opacity: 1}, 2000);
  }, 5000);
  setTimeout(function() {
    $bestEvents.animate({opacity: 1}, 2000);
  }, 10000);
  setTimeout(function() {
    $bestLikes.animate({opacity: 1}, 2000);
  }, 15000);

  setTimeout(finishedCallback, 30000);

  generateCompositeImage(bestContent, function(compositeImage) {
    $popularityZone.append(compositeImage);
  });
};

/// Calculation

function calculateBestElements(elements, pointCalculator) {
  if (!elements) return [];

  // sort elements in descending order by points
  var sortedElements = elements.sort(function(a, b) {
    return pointCalculator(b) - pointCalculator(a);
  });

  return sortedElements.slice(0, PiecesToShow);
}

function calculateStandardPoints(item) {
  var stats = calculateStats(item);
  var likePoints = stats.likes * LikeValue;
  var sharePoints = stats.shares * ShareValue;
  var commentPoints = stats.comments * CommentValue;
  return likePoints + sharePoints + commentPoints;
}

function calculateLikePoints(like) { return like.likes; }

function calculateEventPoints(event) { return event.attending_count ? event.attending_count : 0; }

function calculateStats(item) {
  return {
    likes: item.likes && item.likes.summary ? item.likes.summary.total_count : 0,
    shares: item.shares ? item.shares.count : 0,
    comments: item.comments && item.comments.summary ? item.comments.summary.total_count : 0
  };
}

/// Dom Rendering

function renderedBestPhotos(photos) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Photos</div>'));

  for (var i = 0; i < photos.length; i++) {
    var $wrapper = $('<div class="popularity-fb-element-wrapper"><img class="popularity-element" src="' + photos[i].picture + '"/></div>');
    $el.append($wrapper);

    $wrapper.append($('<div class="popularity-score-overlay">' + calculateStandardPoints(photos[i]) + '</div>'));
  }

  return $el;
}

function renderedBestPosts(posts) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Posts</div>'));

  for (var i = 0; i < posts.length; i++) {
    var $wrapper = $('<div class="popularity-fb-element-wrapper"></div>');
    $el.append($wrapper);

    var $post = fbRenderer.renderedPost(posts[i]);
    $post.addClass('popularity-element');
    $post.css('position', 'relative');
    $wrapper.append($post);

    $wrapper.append($('<div class="popularity-score-overlay">' + calculateStandardPoints(posts[i]) + '</div>'));
  }

  return $el;
}

function renderedBestEvents(events) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Events</div>'));

  for (var i = 0; i < events.length; i++) {
    var $wrapper = $('<div class="popularity-fb-element-wrapper"></div>');
    $el.append($wrapper);

    var $event = fbRenderer.renderedEvent(events[i]);
    $event.addClass('popularity-element');
    $event.css('position', 'relative');
    $wrapper.append($event);

    $wrapper.append($('<div class="popularity-score-overlay">' + calculateEventPoints(events[i]) + '</div>'));
  }

  return $el;
}

function renderedBestLikes(likes) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Likes</div>'));

  for (var i = 0; i < likes.length; i++) {
    var $wrapper = $('<div class="popularity-fb-element-wrapper"></div>');
    $el.append($wrapper);

    var $like = fbRenderer.renderedLike(likes[i]);
    $like.addClass('popularity-element');
    $like.css('position', 'relative');
    $wrapper.append($like);

    $wrapper.append($('<div class="popularity-score-overlay">' + calculateLikePoints(likes[i]) + '</div>'));
  }

  return $el;
}

/// Image Generation

function generateCompositeImage(bestContent, callback) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 600;

  var context = canvas.getContext('2d');

  bestContent.photos.forEach(function(photo, idx) {
    var photoHeight = canvas.height / bestContent.photos.length;
    drawImageFromUrl(photo.picture, context, 0, photoHeight * idx, canvas.width, photoHeight);
  });

  setTimeout(function() {
    var image = new Image();
    image.src = canvas.toDataURL();
    if (callback) {
      callback(image);
    }
  }, 3000); // to allow images to load...
}

function drawImageFromUrl(url, context, x, y, w, h) {
  var img = new Image();
  img.setAttribute('crossOrigin', '*');

  img.onload = function() {
    context.drawImage(img, x, y, w, h);
  };

  img.src = url;
}
