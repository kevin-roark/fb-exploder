
var moment = require('moment');
var kt = require('kutility');

var fbData;

module.exports.init = function _init(facebookResponse) {
  fbData = facebookResponse;
};

module.exports.renderedPhoto = function _renderedPhoto(photo) {
  var $img = $('<img class="fb-element fb-photo" src="' + photo.picture + '"/>');
  return $img;
};

module.exports.renderedAlbumPhoto = function _renderedAlbumPhoto(photo) {
  var html = '<div class="fb-element fb-photo">';

  html += '<img class="fb-album-photo" src="' + photo.picture + '"/>';

  if (photo.name && photo.name.length > 0) {
    html += div('fb-photo-caption', photo.name);
  }

  html += '</div>';
  return $(html);
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

  var title = div('fb-like-title', like.name);
  var likes = div('fb-like-likes', like.likes && like.likes > 1 ? like.likes + ' people like this.' : '1 person likes this');
  html += div('fb-like-text-content', title + likes);

  html += '<img class="fb-likes-liked-button" src="/media/liked.jpg" alt="liked" />';

  html += '</div>';

  var $el = $(html);
  return $el;
};

/**
  attending_count: 120
  cover: Object
    offset_x: 0
    offset_y: 0
    source: "https://scontent.xx.fbcdn.net/hphotos-xpl1/t31.0-8/s720x720/12339394_519947678178935_4828449537731342652_o.jpg"
  declined_count: 0
  description: ...
  maybe_count: 138
  name: "MALL MUSIC TAKEOVER NYC w/ DJ Paypal, DJ Mastercard, DJ Orange Julius, DJ Instant Message"
  noreply_count: 200
  owner: Object
    name: "AdHoc"
  place: Object
    name: "place name"
  start_time: "2016-01-22T22:00:00-0500"
*/
module.exports.renderedEvent = function _renderedEvent(event) {
  var date = moment(event.start_time);

  var html = '<div class="fb-element fb-event">';

  // cover
  html += event.cover ? '<img class="fb-event-cover" src="' + event.cover.source + '">' : '<div class="fb-event-cover">';
  html += div('fb-event-cover-when', div('fb-event-cover-month', date.format('MMM')) + div('fb-event-cover-day', date.format('Do')));
  html += event.cover ? '</img>' : '</div>';

  // data
  var name = div('fb-event-name', event.name);
  var when = div('fb-event-when', formattedDate(event.start_time));
  var venue = div('fb-event-venue', event.place.name);
  var who = div('fb-event-who', event.attending_count + ' going, ' + event.maybe_count + ' maybe, ' + event.noreply_count + ' not replied');
  var goingImage = '<img class="fb-event-going-image" src="/media/going.jpg" alt="Going" />';
  html += div('fb-event-data', name + when + venue + who + goingImage);

  // finisher
  html += '</div>';

  var $el = $(html);
  return $el;
};

/**
  created_time: "2015-05-30T19:40:54+0000"
  id: "983592525014726"
  place: Object
    id: "103127603061486"
    name: "Columbia University"
 */
module.exports.renderedPlace = function _renderedPlace(place) {
  var html = '<div class="fb-element fb-place">';

  html += span('fb-place-username', fbData.name);
  html += ' checked in at ';
  html += span('fb-place-name', place.place.name);
  html += ' on ';
  html += span('fb-place-when',  moment(place.created_time).format('MMMM Do YYYY'));
  html += ' at ';
  html += span('fb-place-when', moment(place.created_time).format('h:mm a'));

  html += '</div>';
  var $el = $(html);
  return $el;
};

/**
  cover: Object
    offset_x: 0
    offset_y: 48
    source: "https://scontent.xx.fbcdn.net/hphotos-xaf1/v/t1.0-9/11041818_1043629535651475_2955382725209973170_n.jpg?oh=59fa3160e3cd3f469e77eb982ae1b79f&oe=571438DF"
  description: "..."
  name: "WBAR DJs Spring 2015"
  privacy: "CLOSED"
 */
module.exports.renderedGroup = function _renderedGroup(group) {
  var html = '<div class="fb-element fb-group">';

  var name = div('fb-group-name', group.name);
  var privacy = div('fb-group-privacy', group.privacy.toLowerCase() + ' group');
  html += div('fb-group-cover-text', name + privacy);

  var joined = '<img class="fb-group-joined-image" src="/media/joined.jpg"  alt="joined group" />';

  if (group.cover) {
    html += '<img class="fb-group-cover" src="' + group.cover.source + '" alt="group pic">';
    html += joined;
    html += '</img>';
  }
  else {
    html += div('fb-group-cover', joined);
  }

  if (group.description) {
    html += div('fb-group-description', group.description);
  }

  html += '</div>';

  var $el = $(html);
  return $el;
};

module.exports.renderedDemographicText = function _renderedDemographicText(text) {
  var html = div('fb-element fb-demographic-text', text);

  var $el =  $(html);
  $el.css('font-size', kt.randInt(24, 48) + 'px');
  if (Math.random() < 0.75) {
    $el.css('font-weight', 'bold');
  }

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

function div(className, content) {
  return '<div class="' + className + '">' + content + '</div>';
}

function span(className, content) {
  return '<span class="' + className + '">' + content + '</span>';
}
