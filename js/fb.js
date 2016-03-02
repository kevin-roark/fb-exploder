
var TEST_MODE = false;

module.exports.init = function(callback) {
  window.fbAsyncInit = function() {
    window.FB.init({
      appId      : '112359899129533',
      xfbml      : true,
      cookie     : true,
      version    : 'v2.5'
    });

    if (callback) {
      callback();
    }
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
};

module.exports.login = function(callback) {
  var scope = [
    'public_profile',
    'user_photos',
    'user_friends',
    'user_likes',
    'user_posts',
    'user_events'
  ].join(',');
  window.FB.login(callback, {scope: scope});
};

var api = module.exports.api = function(endpoint, callback) {
  window.FB.api(endpoint, callback);
};

module.exports.meDump = function(callback) {
  function limit(field, count) {
    if (!count) count = TEST_MODE ? 50 : 666;

    return field + '.limit(' + count + ')';
  }

  var photosField = limit('photos', 400) + '{width,height,name,picture,images,comments.summary(1),likes.summary(1)}';
  var albumsField = limit('albums') + '{count,created_time,description,location,name,' + limit('photos') + '{picture,name,images}}';
  var postsField = limit('posts', 360) + '{created_time,description,link,message,picture,shares,likes.summary(1),comments.summary(1),attachments}';
  var friendsField = limit('friends');
  var eventsField = limit('events') + '{description,cover,name,owner,start_time,attending_count,declined_count,maybe_count,noreply_count,place}';
  var likesField = limit('likes') + '{about,category,cover,description,name,likes}';
  var demographicFields = 'age_range,email,name,cover,picture';

  var numberOfCalls = TEST_MODE ? 1 : 4;
  if (TEST_MODE) {
    var combinedFields = [
      photosField,
      albumsField,
      postsField,
      friendsField,
      eventsField,
      likesField,
      demographicFields
    ].join(',');
    api('/me?fields=' + combinedFields, fbCallDidFinish);
  }
  else {
    api('/me?fields=' + [eventsField, likesField, demographicFields].join(','), fbCallDidFinish);
    api('/me?fields=' + albumsField, fbCallDidFinish);

    api('/me?fields=' + [postsField, friendsField].join(','), function(response) {
      console.log(response);
      if (!response.posts || !response.posts.data || !response.posts.paging || !response.posts.paging.next) {
        fbCallDidFinish(response);
        return;
      }

      var pagesAddedCount = 0;
      var desiredPagesToAdd = 1;

      function getNextPage(nextPageURL) {
        pagesAddedCount += 1;

        $.get(nextPageURL, function(pageResponse) {
          Array.prototype.push.apply(response.posts.data, pageResponse.data);

          if (pagesAddedCount < desiredPagesToAdd && pageResponse.paging.next) {
            getNextPage(pageResponse.paging.next);
          }
          else {
            fbCallDidFinish(response);
          }
        });
      }

      getNextPage(response.posts.paging.next);
    });

    api('/me?fields=' + photosField, function(response) {
      if (!response.photos || !response.photos.data || !response.photos.paging || !response.photos.paging.next) {
        fbCallDidFinish(response);
        return;
      }

      var pagesAddedCount = 0;
      var desiredPagesToAdd = 1;

      function getNextPage(nextPageURL) {
        pagesAddedCount += 1;

        $.get(nextPageURL, function(pageResponse) {
          Array.prototype.push.apply(response.photos.data, pageResponse.data);

          if (pagesAddedCount < desiredPagesToAdd && pageResponse.paging.next) {
            getNextPage(pageResponse.paging.next);
          }
          else {
            fbCallDidFinish(response);
          }
        });
      }

      getNextPage(response.photos.paging.next);
    });
  }

  var callsFinished = 0;
  var combinedResponses = {};
  function fbCallDidFinish(response) {
    for (var key in response) {
      if (response.hasOwnProperty(key)) {
        combinedResponses[key] = response[key];
      }
    }

    callsFinished += 1;
    if (callsFinished !== numberOfCalls) {
      return;
    }

    console.log(combinedResponses);
    callback(combinedResponses);
  }
};
