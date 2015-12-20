
var TWEEN = require('tween.js');
var kt = require('kutility');

require('./shims');
var fb = require('./fb');
var fbRenderer = require('./fb-renderer');
var LoadingView = require('./loading-view');

$(function() {

  /// state

  var $container = $('#content-container');
  var $photosLayer = $('#photos-layer');
  var $albumsLayer = $('#albums-layer');
  var $postsLayer = $('#posts-layer');
  var $likesLayer = $('#likes-layer');
  var $eventsLayer = $('#events-layer');
  var $placesLayer = $('#places-layer');
  var $groupsLayer = $('#groups-layer');
  var orderedLayers = [$photosLayer, $albumsLayer, $postsLayer, $likesLayer, $eventsLayer, $placesLayer, $groupsLayer];
  var $facebookLoginButton = $('#facebook-login-button');
  var loadingView = new LoadingView({
    $el: $('#loading-view'),
    baseText: 'CRUNCHING YOUR FACEBOOK'
  });
  var updateFunctions = [];
  var shouldUpdate = true;

  update();

  fb.init(function() {
    $facebookLoginButton.fadeIn();
  });

  $(window).mousemove(function(ev) {
    // nice reference for 3d css effects: http://tympanus.net/Development/StackEffects/

    var xPercent = ev.clientX / window.innerWidth;
    var halfWidth = window.innerWidth / 2;
    var normalizedXPercent = xPercent > 0.5 ? (ev.clientX - halfWidth) / halfWidth : (halfWidth - ev.clientX) / halfWidth;

    var containerRotation = xPercent * 10 - 5;
    $container.css('transform', 'rotateY(' + containerRotation + 'deg)');

    var xTranslationMagnitude = Math.pow(normalizedXPercent, 1) * 100;
    if (xPercent < 0.5) xTranslationMagnitude = -xTranslationMagnitude;

    for (var i = 0; i < orderedLayers.length; i++) {
      var $layer = orderedLayers[i];
      var xTranslation = ((i + 1) / orderedLayers.length) * xTranslationMagnitude;
      var yTranslation = 0;
      $layer.css('transform', 'translate(' + xTranslation + 'px, ' + yTranslation + 'px)');
    }
  });

  $(document).keypress(function(ev) {
    var key = ev.which;
    if (key === 32) {
      shouldUpdate = !shouldUpdate;
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
      fbRenderer.init(response);

      if (response.photos) {
        handlePhotos(response.photos.data);
      }
      if (response.albums) {
        handleAlbums(response.albums.data);
      }
      if (response.posts) {
        handlePosts(response.posts.data);
      }
      if (response.likes) {
        handleLikes(response.likes.data);
      }
      if (response.events) {
        handleEvents(response.events.data);
      }
      if (response.tagged_places) {
        handlePlaces(response.tagged_places.data);
      }
      if (response.groups) {
        handleGroups(response.groups.data);
      }
    });
  }

  function update() {
    requestAnimationFrame(update);

    if (!shouldUpdate) {
      return;
    }

    TWEEN.update();

    for (var i = 0; i < updateFunctions.length; i++) {
      updateFunctions[i]();
    }
  }

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

  ///
  /// STREAMING
  ///

  function handlePhotos(photos) {
    if (!photos) {
      return;
    }

    var photoIndex = 0;
    var activeRenderedPhotos = [];

    var columnWidths = kt.shuffle([0.3, 0.2, 0.15, 0.15, 0.1, 0.05, 0.05]);
    var columnSpeeds = kt.shuffle([1, 2, 2, 2, 3, 3, 4]);
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
      $html._yOffset = -($html._renderedHeight * window.innerWidth);
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
        if ($html._yOffset > 0 && !$html._hasBecomeVisible) {
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

    function doNexItem() {
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

      var delay = Math.random() * delayVariance + minDelay;
      setTimeout(doNexItem, delay);
    }

    doNexItem();

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

});
