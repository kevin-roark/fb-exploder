
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
    'user_managed_groups',
    'user_about_me',
    'user_birthday',
    'user_relationships',
    'user_tagged_places',
    'user_work_history',
    'user_education_history',
    'user_location',
    'user_religion_politics',
    'user_events',
    'user_hometown'
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

  var photosField = limit('photos') + '{width,height,name,updated_time,picture,comments,tags,likes}';
  var albumsField = limit('albums') + '{count,created_time,description,location,name,' + limit('photos') + '{picture,name}}';
  var postsField = limit('posts') + '{created_time,description,link,message,picture,shares,message_tags,likes,comments}';
  var placesField = limit('tagged_places') + '{created_time,place{name}}';
  var friendsField = limit('friends');
  var eventsField = limit('events') + '{description,cover,name,owner,start_time,attending_count,declined_count,maybe_count,noreply_count,place}';
  var likesField = limit('likes') + '{about,category,cover,description,name,likes}';
  var groupsField = limit('groups') + '{cover,description,name,privacy}';
  var demographicFields = 'family{name},about,age_range,bio,birthday,education,email,name,hometown{name},location{name},political,relationship_status,religion,work,cover,picture';
  var combinedFields = [
    photosField,
    albumsField,
    postsField,
    placesField,
    friendsField,
    eventsField,
    likesField,
    groupsField,
    demographicFields
  ].join(',');
  api('/me?fields=' + combinedFields, callback);
};
