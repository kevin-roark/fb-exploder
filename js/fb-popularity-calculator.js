
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

  console.log({photos: bestPhotos, posts: bestPosts, likes: bestLikes, events: bestEvents});

  var $popularityZone = $('<div class="popularity-zone"></div>');
  $container.append($popularityZone);

  var $bestPhotos = renderedBestPhotos(bestPhotos);
  $popularityZone.append($bestPhotos);

  $bestPhotos.animate({opacity: 1}, 2000);

  setTimeout(finishedCallback, 30000);
};

/// Private

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

function renderedBestPhotos(photos) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Photos</div>'));

  for (var i = 0; i < photos.length; i++) {
    var $wrapper = $('<div class="popularity-fb-element-wrapper"></div>');
    $wrapper.append($('<img class="popularity-photo" src="' + photos[i].picture + '"/>'));
    $el.append($wrapper);
  }

  return $el;
}
