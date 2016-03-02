
var kt = require('kutility');
var fbRenderer = require('./fb-renderer');
var ScoreKeeper = require('./scorekeeper');

var DelayBeforePhotoWaterfall = 9999;
var DelayBeforePostsWaterfall = 35666;
var DelayBeforeDataWaterfall = 53666;
var DelayBeforeStaticStack = 60000;



var $container, $photosLayer, $albumsLayer, $postsLayer, $likesLayer, $eventsLayer, $staticLayer, orderedLayers, scorekeeper;
$(function() {
  $container = $('#content-container');

  function makeLayer(id) { var $layer = $('<div class="content-layer" id="' + id + '"></div>'); $container.append($layer); return $layer; }

  $photosLayer = makeLayer('photos-layer');
  $albumsLayer = makeLayer('albums-layer');
  $postsLayer = makeLayer('posts-layer');
  $likesLayer = makeLayer('likes-layer');
  $eventsLayer = makeLayer('events-layer');
  $staticLayer = makeLayer('static-layer');
  orderedLayers = [$photosLayer, $albumsLayer, $postsLayer, $likesLayer, $eventsLayer, $staticLayer];

  scorekeeper = new ScoreKeeper();
});

var updateFunctions = [];
var shouldUpdate = true;

/// Public

module.exports.start = function _start(dump) {
  if (dump.albums) {
    handleAlbums(dump.albums.data);

  setTimeout(function() {
    if (dump.photos) {
      handlePhotos(dump.photos.data);
    }
  }, DelayBeforePhotoWaterfall);

  setTimeout(function() {
    if (dump.posts) {
      handlePosts(dump.posts.data);
    }
  }, DelayBeforePostsWaterfall);

  setTimeout(function() {
    if (dump.likes) {
      handleLikes(dump.likes.data);
    }
    if (dump.events) {
      handleEvents(dump.events.data);
    }
  }, DelayBeforeDataWaterfall);
};

module.exports.update = function _update() {
  for (var i = 0; i < updateFunctions.length; i++) {
    updateFunctions[i]();
  }
};

module.exports.mouseUpdate = function _mouseUpdate(x) {
  // nice reference for 3d css effects: http://tympanus.net/Development/StackEffects/

  var xPercent = x / window.innerWidth;
  var halfWidth = window.innerWidth / 2;
  var normalizedXPercent = xPercent > 0.5 ? (x - halfWidth) / halfWidth : (halfWidth - x) / halfWidth;

  var containerRotation = 0; //xPercent * 10 - 5;
  $container.css('transform', 'rotateY(' + containerRotation + 'deg)');

  var xTranslationMagnitude = Math.pow(normalizedXPercent, 1) * 400;
  if (xPercent < 0.5) xTranslationMagnitude = -xTranslationMagnitude;

  for (var i = 0; i < orderedLayers.length; i++) {
    var $layer = orderedLayers[i];
    var xTranslation = (i / (orderedLayers.length - 1)) * xTranslationMagnitude;
    var yTranslation = 0;
    $layer.css('transform', 'translate(' + xTranslation + 'px, ' + yTranslation + 'px)');
  }
};

module.exports.setShouldUpdate = function _setShouldUpdate(should) {
  shouldUpdate = should;
};

/// Private

function handlePhotos(photos) {
  if (!photos) {
    return;
  }

  var PhotoOffscreenBuffer = 200;

  var photoIndex = 0;
  var activeRenderedPhotos = [];

  var columnWidths = kt.shuffle([0.3, 0.2, 0.15, 0.15, 0.1, 0.05, 0.05]);
  var columnSpeeds = kt.shuffle([2, 2, 2, 3, 3, 4, 5]);
  var columnOffsets = [0];
  for (var offsetIndex = 1; offsetIndex < columnWidths.length; offsetIndex++) {
    var accumlatedOffset = columnOffsets[offsetIndex - 1];
    var lastItemWidth = columnWidths[offsetIndex - 1];
    columnOffsets.push(accumlatedOffset + lastItemWidth);
  }

  function nextPhoto() {
    if (photoIndex >= photos.length) {
      photoIndex = 0;
    }
    return photos[photoIndex++];
  }

  function addPhotoToColumn(idx) {
    var photo = nextPhoto();

    var width = columnWidths[idx];
    var leftOffset = columnOffsets[idx];

    var $html = fbRenderer.renderedPhoto(photo);
    $html.css('left', (leftOffset * 100) + '%');
    $html.css('width', (width * 100) + '%');
    $html.css('top', 0);

    $html._columnIndex = idx;
    $html._renderedHeight = (photo.height / photo.width) * width; // unit is decimal percentage of window width
    $html._yOffset = -($html._renderedHeight * window.innerWidth) - PhotoOffscreenBuffer;
    updateYTranslation($html);

    activeRenderedPhotos.push($html);
    $photosLayer.append($html);
  }

  for (var i = 0; i < columnWidths.length; i++) {
    addPhotoToColumn(i);
  }

  updateFunctions.push(function updatePhotos() {
    for (var i = 0; i < activeRenderedPhotos.length; i++) {
      var $html = activeRenderedPhotos[i];

      // move it down
      var speed = columnSpeeds[$html._columnIndex];
      updateYTranslation($html, speed);

      // add a new guy if necessary
      if ($html._yOffset > -PhotoOffscreenBuffer && !$html._hasBecomeVisible) {
        addPhotoToColumn($html._columnIndex);
        $html._hasBecomeVisible = true;
      }

      // trim if now offscreen
      if ($html._yOffset > window.innerHeight) {
        $html.remove();
        removeFromArray(activeRenderedPhotos, $html);
      }
    }
  });
}

function handleAlbums(albums) {
  if (!albums) { return; }

  // gather the photos
  var albumPhotos = [];
  for (var i = 0; i < albums.length; i++) {
    var album = albums[i];
    if (!album.photos) { continue; }

    var photos = album.photos.data;
    for (var j = 0; j < photos.length; j++) {
      albumPhotos.push(photos[j]);
    }
  }

  setupDataStream(albumPhotos, fbRenderer.renderedAlbumPhoto, $albumsLayer, {
    minWidth: 100,
    widthVariance: 350,
    minDelay: 200,
    delayVariance: 1000
  });
  setTimeout(function() {
    setupStaticDataStack(albumPhotos, fbRenderer.renderedAlbumPhoto, {
      minWidth: 100,
      widthVariance: 350
    });
  }, DelayBeforeStaticStack);
}

function handlePosts(posts) {
  if (!posts) { return; }

  setupDataStream(posts, fbRenderer.renderedPost, $postsLayer);
  setTimeout(function() {
    setupStaticDataStack(posts, fbRenderer.renderedPost);
  }, DelayBeforeStaticStack);
}

function handleLikes(likes) {
  if (!likes) { return; }

  setupDataStream(likes, fbRenderer.renderedLike, $likesLayer);
  setTimeout(function() {
    setupStaticDataStack(likes, fbRenderer.renderedLike, {minDelay: 1000});
  }, DelayBeforeStaticStack);
}

function handleEvents(events) {
  if (!events) { return; }

  setupDataStream(events, fbRenderer.renderedEvent, $eventsLayer, {minWidth: 300, widthVariance: 200, minDelay: 1500});
  setTimeout(function() {
    setupStaticDataStack(events, fbRenderer.renderedEvent, {
      minWidth: 300,
      widthVariance: 200,
      minDelay: 1000,
      delayDecayRate: 0.9985
    });
  }, DelayBeforeStaticStack);
}

function setupDataStream(data, renderer, $layer, options) {
  if (!data || !renderer || !$layer) {
    return;
  }
  if (!options) {
    options = {};
  }

  var minWidth = options.minWidth || 200;
  var widthVariance = options.widthVariance || 150;
  var widthVarianceGrowthRate = options.widthVarianceGrowthRate || 1.0000;
  var maxWidthVariance = options.maxWidthVariance || window.innerWidth * 0.75;
  var minSpeed = options.minSpeed || 1.5;
  var maxSpeed = options.maxSpeed || 9.5;
  var minDelay = options.minDelay || 1000;
  var delayVariance = options.delayVariance || 1200;
  var totalStreamTime = options.totalStreamTime || 3.5 * 60000; // 3.5 minutes

  var dataIndex = 0;
  var activeRenderedElements = [];
  var stillStreaming = true;

  setTimeout(function() {
    stillStreaming = false;
    widthVarianceGrowthRate = 1.0003;
    maxWidthVariance= window.innerWidth * 0.55;
  }, totalStreamTime);

  function doNextItem() {
    if (stillStreaming) {
      var delay = Math.random() * delayVariance + minDelay;
      setTimeout(doNextItem, delay);
    }

    if (!shouldUpdate) {
      return;
    }

    scorekeeper.addScore(1);

    if (dataIndex >= data.length) {
      dataIndex = 0;
    }
    var item = data[dataIndex++];

    var $html = renderer(item);
    var width = Math.random() * widthVariance + minWidth;
    $html.css('width', width + 'px');
    $html.css('left', (Math.random() * (window.innerWidth - width) * 1.15) + 'px');
    $html.css('top', '0');
    $html._speed = (Math.random() * (maxSpeed - minSpeed)) + minSpeed;
    $html._yOffset = -500;
    updateYTranslation($html);

    activeRenderedElements.push($html);
    $layer.append($html);

    widthVariance = Math.pow(widthVariance, widthVarianceGrowthRate);
    widthVariance = Math.min(maxWidthVariance, widthVariance);
  }

  doNextItem();

  updateFunctions.push(function updateItems() {
    for (var i = 0; i < activeRenderedElements.length; i++) {
      var $html = activeRenderedElements[i];
      updateYTranslation($html, $html._speed);

      // trim if now offscreen
      if ($html._yOffset > window.innerHeight + 20) {
        $html.remove();
        removeFromArray(activeRenderedElements, $html);
      }
    }
  });
}

function setupStaticDataStack(data, renderer, options) {
  if (!data || !renderer) {
    return;
  }
  if (!options) {
    options = {};
  }

  var minWidth = options.minWidth || 200;
  var minDelay = options.minDelay || 150;
  var widthVariance = options.widthVariance || 200;
  var widthVarianceGrowthRate = options.widthVarianceGrowthRate || 1.0000;
  var maxWidthVariance = options.maxWidthVariance || window.innerWidth * 0.75;
  var elementLifespan = options.elementLifespan || 4000;
  var initialDelayBetweenElements = options.initialDelayBetweenElements || 5000;
  var delayDecayRate = options.delayDecayRate || 0.997; // exponential
  var totalStreamTime = options.totalStreamTime || 3.5 * 60000; // 3.5 minutes
  var fadeTime = options.fadeTime || 400;
  var fadeDecayRate = options.fadeDecayRate || 0.9995;
  var minFadeTime = options.minFadeTime || 25;
  var growWidth = options.growWidth || false;
  var currentDelayBetweenElements = initialDelayBetweenElements;

  setTimeout(function() {
    widthVarianceGrowthRate = 1.0002;
    maxWidthVariance= window.innerWidth * 0.55;
    growWidth = true;
  }, totalStreamTime);

  stackData();

  function stackData() {
    var item = kt.choice(data);
    var $html = renderer(item);
    var width = Math.random() * widthVariance + minWidth;
    $html.css('display', 'none');
    $html.css('width', width + 'px');
    $html.css('left', (Math.random() * (window.innerWidth - width) * 1.15) + 'px');
    $html.css('top', (Math.random() * (window.innerHeight - width * 1.25)) + 'px');

    $staticLayer.append($html);
    $html.fadeIn(fadeTime);

    // Exponential method for fade decrease
    // fadeTime = Math.pow(fadeTime, fadeDecayRate);
    // if (fadeTime < minFadeTime){
    //   fadeTime = minFadeTime;
    // }

    // Scaled method for fade decrease
    fadeTime = currentDelayBetweenElements / 11;
    if (fadeTime < minFadeTime) {
      fadeTime = minFadeTime;
    }

    setTimeout(function() {
      $html.fadeOut(fadeTime);
    }, elementLifespan + 400); // fade in delay

    setTimeout(stackData, currentDelayBetweenElements);

    currentDelayBetweenElements = Math.pow(currentDelayBetweenElements, delayDecayRate);
    currentDelayBetweenElements = Math.max(currentDelayBetweenElements, minDelay);
    // widthVariance = Math.pow(widthVariance, widthVarianceGrowthRate); This is very hard to control

    if (growWidth) {
      widthVariance = widthVariance + 0.4;
    }

    widthVariance = Math.min(maxWidthVariance, widthVariance);
    scorekeeper.addScore(1);
  }
}

/// Util

function updateYTranslation($html, speed) {
  if (speed) {
    $html._yOffset = $html._yOffset + speed;
  }

  $html.css('transform', 'translateY(' + $html._yOffset + 'px)');
}

function removeFromArray(arr, el) {
  var idx = arr.indexOf(el);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}
}
