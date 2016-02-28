
var TEST_MODE = true;

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
  function limit(field) {
    var count = TEST_MODE ? 50 : 666;
    return field + '.limit(' + count + ')';
  }

  var photosField = limit('photos') + '{width,height,name,picture,comments.summary(1),likes.summary(1)}';
  var albumsField = limit('albums') + '{count,created_time,description,location,name,' + limit('photos') + '{picture,name}}';
  var postsField = limit('posts') + '{created_time,description,link,message,picture,shares,likes.summary(1),comments.summary(1)}';
  var friendsField = limit('friends');
  var eventsField = limit('events') + '{description,cover,name,owner,start_time,attending_count,declined_count,maybe_count,noreply_count,place}';
  var likesField = limit('likes') + '{about,category,cover,description,name,likes}';
  var demographicFields = 'age_range,email,name,cover,picture';
  var combinedFields = [
    photosField,
    albumsField,
    postsField,
    friendsField,
    eventsField,
    likesField,
    demographicFields
  ].join(',');
  api('/me?fields=' + combinedFields, callback);
};
