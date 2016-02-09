
var fbRenderer = require('./fb-renderer');
var multiline = require('./lib/multiline');
var color = require('./color');

var PiecesToShow = 3;
var LikeValue = 1;
var CommentValue = 2;
var ShareValue = 3;

var $container;
$(function() {
  $container = $('#content-container');
});

/// State

module.exports.start = function _start(dump, finishedCallback) {
  var hasEnteredSharingState = false;

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

  var $shareButtonWrapper = $('<div style="text-align: center; width: 100%;"></div>');
  var $collageButton = $('<div class="shadow-button facebook-style-button" id="generate-collage-button">Share your own Life in Review collage!</div>');
  $collageButton.css('opacity', '0');
  $collageButton.click(function() {
    if (hasEnteredSharingState) {
      return;
    }

    enterSharingState(bestContent);
  });
  $shareButtonWrapper.append($collageButton);
  $popularityZone.append($shareButtonWrapper);

  $bestPhotos.animate({opacity: 1}, 800);
  setTimeout(function() {
    $bestPosts.animate({opacity: 1}, 800);
  }, 500);
  setTimeout(function() {
    $bestEvents.animate({opacity: 1}, 800);
  }, 1000);
  setTimeout(function() {
    $bestLikes.animate({opacity: 1}, 800);
  }, 1500);
  setTimeout(function() {
    $collageButton.animate({opacity: 1}, 800);
  }, 1600);

  //setTimeout(finishedCallback, 30000);
};

function enterSharingState(bestContent) {
  var hasSharedToFacebook = false;

  var $popularityShareWrapper = $('<div class="popularity-share-wrapper">');
  $container.append($popularityShareWrapper);
  $popularityShareWrapper.fadeIn(1500);

  var $popularityShareZone = $('<div class="popularity-share-zone">');
  $popularityShareWrapper.append($popularityShareZone);

  var $celebrityHeadZone = $('<div class="celebrity-head-zone">');
  $('body').append($celebrityHeadZone);

  var $celebrityHeadBio = $('<div class="celebrity-head-bio">');
  $('body').append($celebrityHeadBio);

  generateCompositeCanvas(bestContent, function(compositeCanvas) {
    var $canvas = $(compositeCanvas);
    $canvas.css('max-width', '100%');
    $popularityShareZone.append($canvas);
    $popularityShareZone.fadeIn();

    var context = compositeCanvas.getContext('2d');

    $.getJSON('/media/celebrities.json', function(celebrities) {
      celebrities.forEach(function(celeb, idx) {
        var $head = $('<div class="celebrity-head">');
        $head.append($('<img src="/media/celebrity_heads/' + celeb.image + '">'));
        $head.append($('<div class="celebrity-name">' + celeb.name + '</div>'));
        $head.hover(function() {
          $celebrityHeadBio.text(celeb.bio);
        });
        $head.click(function() {
          if (hasSharedToFacebook) {
            return;
          }

          var width = Math.random() * 120 + 80;
          var randomRect = {
            x: Math.random() * (compositeCanvas.width - width),
            y: Math.random() * (compositeCanvas.height - width),
            w: width,
            h: width
          };
          context.shadowColor = color.randomColor();
          drawImageFromUrl('/media/celebrity_heads/' + celeb.image, compositeCanvas.getContext('2d'), randomRect);
        });
        $celebrityHeadZone.append($head);

        if (idx === 0) {
          $celebrityHeadBio.text(celeb.bio);
        }
      });
    });

    setTimeout(function() {
      $celebrityHeadZone.fadeIn();
      $celebrityHeadBio.fadeIn();

      setTimeout(function() {
        var $celebrityHeadTip = $('<div class="celebrity-head-tip">Your Life Score has earned you valuable celebrities! Click their heads to personalize your Life in Review Collage, then share to Facebook below!</div>');
        $('body').append($celebrityHeadTip);

        var $shareButton = $('<div class="shadow-button facebook-style-button" id="facebook-share-button">Share To Facebook Now</div>');
        $shareButton.click(function() {
          if (!hasSharedToFacebook) {
            shareCanvasToFacebook(compositeCanvas);
            $('.celebrity-head').css('pointer', 'auto');
            hasSharedToFacebook = true;
          }
        });
        $('body').append($shareButton);

        $celebrityHeadTip.fadeIn();
        $shareButton.fadeIn();
      }, 500);
    }, 3000);
  });
}

function shareCanvasToFacebook(canvas) {
  var imageData = canvas.toDataURL("image/jpeg");
  console.log(imageData);
}

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

function generateCompositeCanvas(bestContent, callback) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;

  var context = canvas.getContext('2d');

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 20;
  context.shadowOffsetX = 12;
  context.shadowOffsetY = 12;

  var imagesToLoad = 0;
  var totalPoints = 0;
  var hasFinished = false;

  function imageFinishedDrawing() {
    imagesToLoad -= 1;
    if (imagesToLoad === 0) {
      finish();
    }
  }

  function finish() {
    if (hasFinished) {
      return;
    }

    hasFinished = true;

    drawTextElements();

    drawBrandElements();

    if (callback) {
      callback(canvas);
    }
  }

  bestContent.photos.forEach(function(photo) {
    totalPoints += calculateStandardPoints(photo);

    imagesToLoad += 1;

    var width = (Math.random() * 0.25 + 0.2) * canvas.width;
    var height = (photo.height / photo.width) * width;
    var x = (canvas.width - width * 0.8) * Math.random();
    var y = (canvas.height - height * 0.8) * Math.random();
    drawImageFromUrl(photo.picture, context, {x: x, y: y, w: width, h: height}, imageFinishedDrawing);
  });

  bestContent.posts.forEach(function(post) {
    totalPoints += calculateStandardPoints(post);

    if (post.picture) {
      imagesToLoad += 1;
      drawArbitraryImage(post.picture, imageFinishedDrawing);
    }
  });

  bestContent.events.forEach(function(event) {
    totalPoints += Math.round(calculateEventPoints(event) * 0.0001);

    if (event.cover && event.cover.source) {
      imagesToLoad += 1;
      drawArbitraryImage(event.cover.source, imageFinishedDrawing);
    }
  });

  bestContent.likes.forEach(function(like) {
    totalPoints += Math.round(calculateLikePoints(like) * 0.0001);

    if (like.cover && like.cover.source) {
      imagesToLoad += 1;
      drawArbitraryImage(like.cover.source, imageFinishedDrawing);
    }
  });

  function drawTextElements() {
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 1;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillStyle = "#111111";
    context.font = '20px "Helvetica, Arial, sans-serif"';
    context.__fontSize = 20;

    bestContent.posts.forEach(function(post) {
      if (post.message) {
        drawArbitraryText(post.message);
      }
    });

    bestContent.events.forEach(function(event) {
      var goingText = event.attending_count + ' going, ' + event.maybe_count + ' maybe, ' + event.noreply_count + ' not replied';
      drawArbitraryText(goingText);

      context.save();
      context.font = 'bold 24px "Times New Roman"';
      context.__fontSize = 24;
      drawArbitraryText(event.name);
      context.restore();
    });

    bestContent.likes.forEach(function(like) {
      var likeText = like.likes && like.likes > 1 ? like.likes + ' people like this.' : '1 person likes this';
      drawArbitraryText(likeText);

      context.save();
      context.font = 'bold 24px "Times New Roman"';
      context.__fontSize = 24;
      drawArbitraryText(like.name);
      context.restore();
    });
  }

  function drawBrandElements() {
    var brandSquareWidth = 450;
    var brandSquareHeight = 360;
    var brandSquareX = canvas.width/2 - brandSquareWidth/2;
    var brandSquareY = canvas.height/2 - brandSquareHeight/1.2;
    var textX = brandSquareX + 10;
    var textWidth = brandSquareWidth - 20;

    context.shadowColor = 'rgba(0, 0, 0, 0.7)';
    context.shadowBlur = 40;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    context.fillStyle = '#ffffff';
    context.fillRect(brandSquareX, brandSquareY, brandSquareWidth, brandSquareHeight);

    context.fillStyle = '#111111';
    context.shadowColor = 'rgba(0, 0, 0, 0)';
    context.font = '24px "Times New Roman"';
    context.fillText('I looked at my Life In Review...', textX, brandSquareY + 40, textWidth);

    context.save();
    context.textAlign = 'center';
    context.shadowColor = 'rgb(135, 88, 203)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.fillStyle = 'rgb(233, 30, 30)';
    context.font = 'bold 64px "Times New Roman"';
    context.fillText('I SCORED', canvas.width/2, brandSquareY + 120, brandSquareWidth - 20);
    context.fillText(totalPoints, canvas.width/2, brandSquareY + 180, brandSquareWidth - 20);
    context.restore();

    context.fillText('What do you score?', textX, brandSquareY + 240, textWidth);
    context.fillText('Let me know in the comments below.', textX, brandSquareY + 270, textWidth);

    context.textAlign = 'center';
    context.shadowColor = 'rgb(235, 233, 28)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.fillStyle = 'rgb(30, 233, 63)';
    context.font = 'bold 26px "Times New Roman"';
    context.fillText('CARMICHAEL HELPED ME', canvas.width/2, brandSquareY + 320, brandSquareWidth - 20);
  }

  function arbitraryRect(allowLeakage) {
    var width = (Math.random() * 0.25 + 0.2) * canvas.width;

    var x, y;
    if (allowLeakage) {
      x = (width * -0.2) + ((canvas.width - 0.6 * width) * Math.random());
      y = -100 + ((canvas.height + 200) * Math.random());
    }
    else {
      x = (canvas.width - width) * Math.random();
      y = (canvas.height * 0.85) * Math.random();
    }

    return {x: x, y: y, w: width};
  }

  function drawArbitraryImage(imageURL, callback) {
    var pictureRect = arbitraryRect(true);
    drawImageFromUrl(imageURL, context, pictureRect, callback);
  }

  function drawArbitraryText(text) {
    var messageRect = arbitraryRect(false);
    multiline.draw(context, text, context.__fontSize, messageRect.x, messageRect.y, messageRect.w);
  }
}

function drawImageFromUrl(url, context, rect, callback) {
  var img = new Image();
  img.setAttribute('crossOrigin', '*');

  img.onload = function() {
    if (!rect.h) {
      var aspectRatio = img.width / img.height;
      rect.h = rect.w / aspectRatio;
    }

    context.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    if (callback) {
      callback();
    }
  };

  img.src = url;
}
