const Genre = require('./genre');
const SpotifyWebApi = require('spotify-web-api-node');

function Player(handler) {
  this.spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: handler.event.session.user.accessToken
  });
  this.deviceId = handler.attributes.spotifyDeviceMap && handler.attributes.spotifyDeviceMap[handler.event.context.System.device.deviceId];
}

function playlistIdFromUri(uri) {
  const parts = uri.split(':');
  return parts[parts.length - 1];
}

Player.prototype.playPlaylist = function(uri) {
  const options = { context_uri: uri }
  if(this.deviceId) {
    options.device_id = this.deviceId;
    return this.spotify.play(options).then(function() {
      setTimeout(this.checkCurrentDeviceAndTransfer.bind(this), 2000);
    }.bind(this));
  } else {
    return this.spotify.play(options);
  }
};

Player.prototype.followPlaylist = function(uri) {
  const id = playlistIdFromUri(uri);
  return this.spotify.followPlaylist(id, { public: false });
};

Player.prototype.unfollowPlaylist = function(uri) {
  const id = playlistIdFromUri(uri);
  return this.spotify.unfollowPlaylist(id);
};

Player.prototype.getCurrentDevice = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    if(!data.body.device) throw 'No device found.';
    return data.body.device;
  });
};

Player.prototype.getCurrentPlaybackState = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    if(!data.body.item) throw 'No item found.';
    return data.body;
  });
};

Player.prototype.getCurrentGenre = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    const genre = data.body && data.body.context && Genre.byUri[data.body.context.uri];
    if(genre) {
      const id = playlistIdFromUri(genre.uri);
      return this.spotify.getPlaylist(id, { fields: "description" }).then(function(data) {
        genre.similar = Genre.similarFromDescription(data.body.description);
        return genre;
      });
    } else {
      if(data.body && data.body.context) {
        throw "no genre: for " + data.body.context.uri;
      } else {
        throw "no genre: missing playback context";
      }
    }
  }.bind(this));
};

Player.prototype.checkCurrentDeviceAndTransfer = function() {
  return this.getCurrentDevice().then(function(device) {
    if(device.id != this.deviceId) {
      this.spotify.transferMyPlayback({ deviceIds: [this.deviceId], play: true })
    }
  }.bind(this));
};

module.exports = Player;
