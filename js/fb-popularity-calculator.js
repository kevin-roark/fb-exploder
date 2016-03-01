
var fbRenderer = require('./fb-renderer');
var multiline = require('./lib/multiline');
var color = require('./color');
var celebrities = require('./celebrities');

var PiecesToShow = 3;
var LikeValue = 1;
var CommentValue = 2;
var ShareValue = 3;

var apiHost = 'http://localhost:3000';

var $container;
$(function() {
  $container = $('#content-container');
});

/// State

module.exports.start = function _start(dump, finishedCallback) {
  var hasEnteredSharingState = false;
  var hasReceivedPercentile = false;

  var bestPhotos = dump.photos ? calculateBestElements(dump.photos.data, calculateStandardPoints) : [];
  var bestPosts = dump.posts ? calculateBestElements(dump.posts.data, calculateStandardPoints) : [];
  var bestLikes = dump.likes ? calculateBestElements(dump.likes.data, calculateLikePoints) : [];
  var bestEvents = dump.events ? calculateBestElements(dump.events.data, calculateEventPoints) : [];
  var bestContent = {photos: bestPhotos, posts: bestPosts, likes: bestLikes, events: bestEvents};
  bestContent.totalPoints = calculateTotalPoints(bestContent);

  populateBestContentWithPercentile(bestContent, function() {
    hasReceivedPercentile = true;
  });

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

    hasEnteredSharingState = true;

    enterSharingState(bestContent, finishedCallback);
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

  setTimeout(function() {
    if (!hasEnteredSharingState) {
      $('.popularity-zone').fadeOut(3000);
      setTimeout(finishedCallback, 3000);
    }
  }, 15 * 1000);
};

function enterSharingState(bestContent, finishedCallback) {
  var hasSharedToFacebook = false;
  var lastCelebrityHeadClickTime = new Date();

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
    $canvas.css('width', '100%');
    $popularityShareZone.append($canvas);
    $popularityShareZone.fadeIn();

    var context = compositeCanvas.getContext('2d');

    celebrities.forEach(function(celeb, idx) {
      var percent = bestContent.percentile ? Math.round(bestContent.percentile) : 50;
      var headIsDisabled = (idx * 5) > percent;

      var $head = $('<div class="celebrity-head">');
      $head.append($('<img class="offset-celebrity-head" src="media/celebrity_heads/' + celeb.image + '">'));
      $head.append($('<img class="celebrity-head-image" src="media/celebrity_heads/' + celeb.image + '">'));
      $head.append($('<div class="celebrity-name">' + celeb.name + '</div>'));
      if (headIsDisabled) {
        $head.addClass('disabled');
        $head.append($('<div class="celebrity-head-disabler">'));
      }
      $head.hover(function() {
        var text = headIsDisabled ? "You (scum) Haven't Earned The Right to interface with " + celeb.name : celeb.bio;
        $celebrityHeadBio.text(text);
      });
      $head.click(function() {
        if (hasSharedToFacebook || headIsDisabled) {
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
        drawImageFromUrl('media/celebrity_heads/' + celeb.image, compositeCanvas.getContext('2d'), randomRect);

        lastCelebrityHeadClickTime = new Date();
      });
      $celebrityHeadZone.append($head);

      if (idx === 0) {
        $celebrityHeadBio.text(celeb.bio);
      }
    });

    setTimeout(function() {
      $celebrityHeadZone.fadeIn();
      $celebrityHeadBio.fadeIn();

      setTimeout(function() {
        var percent = bestContent.percentile ? Math.round(bestContent.percentile) : 50;
        var celebrityTipText = 'Your Life Score of <i>' + bestContent.totalPoints +
          '</i> places you in the <i>top ' + percent + '%</i> of all Facebook Users and has earned you some valuable celebrities!' +
          ' Click their heads to personalize your Life in Review Collage, then share to Facebook below!';
        var $celebrityHeadTip = $('<div class="celebrity-head-tip">' + celebrityTipText + '</div>');
        $('body').append($celebrityHeadTip);

        var $shareButton = $('<div class="shadow-button facebook-style-button" id="facebook-share-button">Share To Facebook Now</div>');
        $shareButton.click(function() {
          if (!hasSharedToFacebook) {
            hasSharedToFacebook = true;
            $('.celebrity-head').css('pointer', 'auto');

            shareCanvasToFacebook(compositeCanvas, function() {
              goHome();
            });
          }
        });
        $('body').append($shareButton);

        var $skipShareButton = $('<div class="shadow-button" id="skip-share-button">Skip The Share Please</div>');
        $skipShareButton.click(function() {
          goHome();
        });
        $('body').append($skipShareButton);

        $celebrityHeadTip.fadeIn();
        setTimeout(function() {
          $shareButton.fadeIn();
          $skipShareButton.fadeIn();
        }, 500);
      }, 500);
    }, 800);
  });

  var idleInterval = setInterval(function() {
    var now = new Date();
    var timeSinceLastCelebrityHeadClick = now - lastCelebrityHeadClickTime;
    if (timeSinceLastCelebrityHeadClick > 24 * 1000) {
      goHome();
      clearInterval(idleInterval);
    }
  }, 500);

  var hasGoneHome = false;
  function goHome() {
    if (hasGoneHome) {
      return;
    }
    hasGoneHome = true;

    $popularityShareWrapper.fadeOut(1000);
    $celebrityHeadZone.fadeOut(1000);
    $celebrityHeadBio.fadeOut(1000);
    $('.celebrity-head-tip').fadeOut(1000);
    $('#facebook-share-button').fadeOut(1000);
    $('#skip-share-button').fadeOut(1000);
    $('.popularity-zone').fadeOut(3000);

    var $thanks = $('<div class="dreamy-message">').text('Thanks for Using!').css('display', 'none');
    $('body').append($thanks);
    $thanks.fadeIn(1000);
    setTimeout(function() {
      $thanks.fadeOut(1000);
    }, 3666);

    setTimeout(finishedCallback, 3000);
  }
}

function shareCanvasToFacebook(canvas, callback) {
  // share image first
  uploadCanvasToCloudinary(canvas, function(error, imageURL) {
    console.log(imageURL);
    shareToFacebookWithImageURL(imageURL);

    function shareToFacebookWithImageURL(imageURL) {
      var options = {
        method: 'feed',
        link: 'www.lifeinreview.com',
        picture: imageURL,
        caption: 'Check out my Life in Review Score! Please tell me yours?',
        description: 'Life in Review scores you!'
      };
      if (imageURL) {
        options.picture = imageURL;
      }

      window.FB.ui(options, function(response) {
        var success = response && !response.error_code;
        if (callback) {
          callback(success);
        }
      });
    }
  });
}

function uploadCanvasToCloudinary(canvas, callback) {
  var $loading = $('<div class="dreamy-message">').text('Loading...').css('display', 'none');
  $('body').append($loading);
  $loading.fadeIn();

  var $input = $('<input/>').attr('type', 'file').attr('name', 'imageFileInput');
  $input.unsigned_cloudinary_upload('tokggrfz', { cloud_name: 'carmichael-payamps'})
        .bind('cloudinarydone', function(e, data) {
          $loading.fadeOut();

          if (data.result && data.result.url) {
            if (callback) {
              callback(null, data.result.url);
            }
          }
          else {
            console.log('failed to upload image to cloudinary...');
            console.log(e);
            if (callback) {
              callback(e, null);
            }
          }
        });

  var data = canvas.toDataURL('image/jpeg');
  $input.fileupload('option', 'formData').file = data;
  $input.fileupload('add', { files: [data] });
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

function calculateTotalPoints(bestContent) {
  var totalPoints = 0;

  bestContent.photos.forEach(function(photo) {
    totalPoints += calculateStandardPoints(photo);
  });

  bestContent.posts.forEach(function(post) {
    totalPoints += calculateStandardPoints(post);
  });

  bestContent.events.forEach(function(event) {
    totalPoints += Math.round(calculateEventPoints(event) * 0.000005);
  });

  bestContent.likes.forEach(function(like) {
    totalPoints += Math.round(calculateLikePoints(like) * 0.000005);
  });

  return totalPoints;
}

function populateBestContentWithPercentile(bestContent, callback) {
  var endpoint = apiHost + '/score';
  $.post(endpoint, {score: bestContent.totalPoints}, function(data) {
    bestContent.percentile = data.percentile;
    if (callback) {
      callback();
    }
  });
}

/// Dom Rendering

function renderedBestPhotos(photos) {
  var $el = $('<div class="popularity-section"></div>');

  $el.append($('<div class="popularity-section-header">Your Best And Most Popular Photos</div>'));

  for (var i = 0; i < photos.length; i++) {
    var photo = photos[i];
    var image = photo.images && photo.images.length > 0 ? photo.images[0].source : photo.picture;
    var $wrapper = $('<div class="popularity-fb-element-wrapper"><img class="popularity-element" src="' + image + '"/></div>');
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

    var $post = fbRenderer.renderedPost(posts[i], {attemptHighResolution: true});
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
  canvas.width = 1200;
  canvas.height = 630;

  var context = canvas.getContext('2d');

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 20;
  context.shadowOffsetX = 12;
  context.shadowOffsetY = 12;

  var imagesToLoad = 0;
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
    imagesToLoad += 1;

    var width = (Math.random() * 0.25 + 0.2) * canvas.width;
    var height = (photo.height / photo.width) * width;
    var x = (canvas.width - width * 0.8) * Math.random();
    var y = (canvas.height - height * 0.8) * Math.random();
    drawImageFromUrl(photo.picture, context, {x: x, y: y, w: width, h: height}, imageFinishedDrawing);
  });

  bestContent.posts.forEach(function(post) {
    if (post.picture) {
      imagesToLoad += 1;
      drawArbitraryImage(post.picture, imageFinishedDrawing);
    }
  });

  bestContent.events.forEach(function(event) {
    if (event.cover && event.cover.source) {
      imagesToLoad += 1;
      drawArbitraryImage(event.cover.source, imageFinishedDrawing);
    }
  });

  bestContent.likes.forEach(function(like) {
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
    var brandSquareY = canvas.height/2 - brandSquareHeight/2;
    var textX = brandSquareX + 10;
    var textWidth = brandSquareWidth - 20;
    var percentile = bestContent.percentile ? Math.round(bestContent.percentile * 10) / 10 : 50;

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
    context.fillText(bestContent.totalPoints, canvas.width/2, brandSquareY + 180, brandSquareWidth - 20);
    context.restore();

    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.75)';
    context.shadowBlur = 8;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.fillStyle = 'rgb(255, 255, 5)';
    context.font = 'bold 140px "Times New Roman"';
    var percentText = percentile + '%';
    context.fillText(percentText, canvas.width - context.measureText(percentText).width, 120);
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
      y = -40 + ((canvas.height + 80) * Math.random());
    }
    else {
      x = (canvas.width - width) * Math.random();
      y = (canvas.height * 0.8) * Math.random();
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
