
var kt = require('kutility');
var moment = require('moment');
var fbRenderer = require('./fb-renderer');

var DelayBeforePhotoWaterfall = 6666;
var DelayBeforePostsWaterfall = 15666;
var DelayBeforeDataWaterfall = 23666;
var DelayBeforeDemographicWaterfall = 33666;

var $container, $photosLayer, $albumsLayer, $postsLayer, $likesLayer, $eventsLayer, $placesLayer, $groupsLayer, $demographicLayer, orderedLayers;
$(function() {
  $container = $('#content-container');

  function makeLayer(id) { var $layer = $('<div class="content-layer" id="' + id + '"></div>'); $container.append($layer); return $layer; }

  $photosLayer = makeLayer('photos-layer');
  $albumsLayer = makeLayer('albums-layer');
  $postsLayer = makeLayer('posts-layer');
  $likesLayer = makeLayer('likes-layer');
  $eventsLayer = makeLayer('events-layer');
  $placesLayer = makeLayer('places-layer');
  $groupsLayer = makeLayer('groups-layer');
  $demographicLayer = makeLayer('demographic-layer');
  orderedLayers = [$photosLayer, $albumsLayer, $postsLayer, $likesLayer, $eventsLayer, $placesLayer, $demographicLayer];
});

var updateFunctions = [];
var shouldUpdate = true;

/// Public

module.exports.start = function _start(dump) {
  if (dump.albums) {
    handleAlbums(dump.albums.data);
  }

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
    if (dump.tagged_places) {
      handlePlaces(dump.tagged_places.data);
    }
    // TODO: request groups access
    // if (response.groups) {
    //   handleGroups(response.groups.data);
    // }
  }, DelayBeforeDataWaterfall);

  setTimeout(function() {
    setupDemographicStream(dump);
  }, DelayBeforeDemographicWaterfall);
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

  var xTranslationMagnitude = Math.pow(normalizedXPercent, 1) * 100;
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
    minDelay: 400,
    delayVariance: 1000
  });
}

function handlePosts(posts) {
  if (!posts) { return; }

  setupDataStream(posts, fbRenderer.renderedPost, $postsLayer);
}

function handleLikes(likes) {
  if (!likes) { return; }

  setupDataStream(likes, fbRenderer.renderedLike, $likesLayer);
}


function handleEvents(events) {
  if (!events) { return; }

  setupDataStream(events, fbRenderer.renderedEvent, $eventsLayer, {minWidth: 300, widthVariance: 200});
}

function handlePlaces(places) {
  if (!places) { return; }

  setupDataStream(places, fbRenderer.renderedPlace, $placesLayer);
}

function handleGroups(groups) {
  if (!groups) { return; }

  setupDataStream(groups, fbRenderer.renderedGroup, $groupsLayer);
}

function setupDemographicStream(fbData) {
  var demographicText = [];

  if (fbData.age_range.min) {
    demographicText.push(fbData.name + ' is at least ' + fbData.age_range.min + ' years old');
  }

  if (fbData.bio) {
    demographicText.push(fbData.name + "'s bio: " + fbData.bio);
  }

  if (fbData.birthday) {
    demographicText.push(fbData.name + ' was born on ' + fbData.birthday);
  }

  if (fbData.education) {
    fbData.education.forEach(function(education) {
      var text = fbData.name + ' attended ' + education.school.name;
      if (education.year) { text += ' until ' + education.year.name; }
      demographicText.push(text);
    });
  }

  if (fbData.family && fbData.family.data) {
    fbData.family.data.forEach(function(family) {
      demographicText.push(family.name + ' is ' + fbData.name + "'s " + family.relationship);
    });
  }

  if (fbData.hometown) {
    demographicText.push(fbData.hometown + ' is ' + fbData.name + "'s hometown");
  }

  if (fbData.location) {
    demographicText.push(fbData.name + ' lives in ' + fbData.location.name);
  }

  if (fbData.relationship_status) {
    demographicText.push(fbData.name + ' is ' + fbData.relationship_status);
  }

  if (fbData.work) {
    fbData.work.forEach(function(work) {
      var text = fbData.name + ' worked at ' + work.employer.name;
      if (work.location) { text += ' at ' + work.location.name; }
      if (work.position) { text += ' with the title of ' + work.position.name; }
      if (work.start_date || work.end_date) {
        var start = work.start_date ? moment(work.start_date).format('MMMM YYYY') : null;
        var end = work.end_date ? moment(work.end_date).format('MMMM YYYY') : null;
        if (start && end) {
          text += ' from ' + start + ' until ' + end;
        }
        else if (start) {
          text += ', starting on ' + start;
        }
        else {
          text += ' until ' + end;
        }
      }
      demographicText.push(text);
    });
  }

  demographicText = kt.shuffle(demographicText);

  setupDataStream(demographicText, fbRenderer.renderedDemographicText, $demographicLayer);
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
  var minSpeed = options.minSpeed || 4;
  var maxSpeed = options.maxSpeed || 10;
  var minDelay = options.minDelay || 3000;
  var delayVariance = options.delayVariance || 5000;

  var dataIndex = 0;
  var activeRenderedElements = [];

  function doNextItem() {
    var delay = Math.random() * delayVariance + minDelay;
    setTimeout(doNextItem, delay);

    if (!shouldUpdate) {
      return;
    }

    if (dataIndex >= data.length) {
      dataIndex = 0;
    }
    var item = data[dataIndex++];

    var $html = renderer(item);
    var width = Math.random() * widthVariance + minWidth;
    $html.css('width', width + 'px');
    $html.css('left', (Math.random() * (window.innerWidth - width) * 1.15) + 'px');
    $html.css('top', '0');
    $html._speed = kt.randInt(minSpeed, maxSpeed);
    $html._yOffset = -500;
    updateYTranslation($html);

    activeRenderedElements.push($html);
    $layer.append($html);
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

/// Util

function updateYTranslation($html, speed) {
  if (speed) {
    $html._yOffset += speed;
  }

  $html.css('transform', 'translateY(' + $html._yOffset + 'px)');
}

function removeFromArray(arr, el) {
  var idx = arr.indexOf(el);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}
