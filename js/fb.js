
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
    'user_hometown',
    'user_relationship_details'
  ].join(',');
  window.FB.login(callback, {scope: scope});
};

var api = module.exports.api = function(endpoint, callback) {
  window.FB.api(endpoint, callback);
};

module.exports.meDump = function(callback) {
  var photosField = 'photos.limit(666){width,height,name,updated_time,picture,comments,tags,likes}';
  var albumsField = 'albums.limit(666){count,created_time,description,location,name,photos.limit(666){picture,name}}';
  var postsField = 'posts.limit(666){created_time,description,link,message,picture,shares,message_tags}';
  var placesField = 'tagged_places.limit(666){created_time,place{name}}';
  var friendsField = 'friends.limit(5000)';
  var eventsField = 'events.limit(666){description,cover,name,owner,start_time,attending_count,declined_count,maybe_count,noreply_count}';
  var likesField = 'likes.limit(666){about,category,cover,description,name,likes}';
  var groupsField = 'groups.limit(666){cover,description,name,privacy}';
  var demographicFields = 'family{name},about,age_range,bio,birthday,education,email,name,hometown{name},location{name},political,relationship_status,religion,work,cover';
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
