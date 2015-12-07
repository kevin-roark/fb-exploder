
var moment = require('moment');

var fbData;

module.exports.init = function _init(facebookResponse) {
  fbData = facebookResponse;
};

module.exports.renderedPhoto = function _renderedPhoto(photo) {
  var $img = $('<img class="fb-element fb-photo" src="' + photo.picture + '""/>');
  return $img;
};

module.exports.renderedPost = function _renderedPost(post) {
  var html = '<div class="fb-element fb-post"><div class="fb-post-wrapper">';
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

  html += '</div></div>';

  var $el = $(html);
  return $el;
};

module.exports.renderedLike = function _renderedLike(like) {
  var html = '<div class="fb-element fb-like">';

  if (like.cover) {
    html += '<img class="fb-like-cover" src="' + like.cover.source + '" />';
  }

  html += '<div class="fb-like-text-content">';
  html += '<div class="fb-like-title">' + like.name + '</div>';

  if (like.description) {
    html += '<div class="fb-like-description">' + like.description + '</div>';
  }

  if (like.likes) {
    html += '<div class="fb-like-likes">' + like.likes + ' likes :)</div>';
  }

  html += '</div></div>';

  var $el = $(html);
  return $el;
};

/**
  attending_count: 120
  cover: Object
    id: "519947678178935"
    offset_x: 0
    offset_y: 0
    source: "https://scontent.xx.fbcdn.net/hphotos-xpl1/t31.0-8/s720x720/12339394_519947678178935_4828449537731342652_o.jpg"
  declined_count: 0
  description: ...
  id: "629607613848785"
  maybe_count: 138
  name: "MALL MUSIC TAKEOVER NYC w/ DJ Paypal, DJ Mastercard, DJ Orange Julius, DJ Instant Message"
  noreply_count: 200
  owner: Object
    id: "194880727261260"
    name: "AdHoc"
  start_time: "2016-01-22T22:00:00-0500"
*/
module.exports.renderedEvent = function _renderedEvent(event) {
  var html = '<div class="fb-element fb-event">';
  html += '<div class="fb-event-name">' + event.name + '</div>';
  html += '<div class="fb-event-descriptipion">' + event.description + '</div>';
  html += '</div>';

  var $el = $(html);
  return $el;
};

function renderedPostHeader(post) {
  var html = '<div class="fb-post-header">';
  html += '<img class="fb-post-header-picture" src="' + fbData.picture.data.url + '" />';
  html += '<div class="fb-post-header-text">';
  html += '<div class="fb-post-header-name">' + fbData.name + '</div>';
  html += '<div class="fb-post-header-date">' + formattedDate(post.created_time) + '</div>';
  html += '</div></div>'; // text, then header
  return html;
}

function renderedStats(post) {
  var likeCount = post.likes ? post.likes.data.length : 0;
  var likeText = likeCount === 1 ? 'like' : 'likes';
  var shareCount = post.shares ? post.shares.count : 0;
  var shareText = shareCount === 1 ? 'share' : 'shares';
  var commentCount = post.comments ? post.comments.data.length : 0;
  var commentText = commentCount === 1 ? 'comment' : 'comments';

  var html = '<div class="fb-post-data">';
  html += '<div class="fb-post-datapoint">' + likeCount + ' ' + likeText + '</div>';
  html += '<div class="fb-post-datapoint">' + commentCount + ' ' + commentText + '</div>';
  html += '<div class="fb-post-datapoint">' + shareCount + ' ' + shareText + '</div>';

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
