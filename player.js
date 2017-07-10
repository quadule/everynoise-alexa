const SpotifyWebApi = require('spotify-web-api-node');

function Player(handler) {
  this.spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: handler.event.session.user.accessToken
  });
  this.deviceId = handler.attributes.spotifyDeviceId;
}

Player.prototype.playPlaylist = function(uri) {
  const options = { context_uri: uri }
  if(this.deviceId) {
    options.device_id = this.deviceId;
    return this.spotify.startMyPlayback(options).then(function() {
      setTimeout(this.checkCurrentDeviceAndTransfer.bind(this), 1000);
    }.bind(this));
  } else {
    return this.spotify.startMyPlayback(options);
  }
};

Player.prototype.getCurrentDevice = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    if(!data.body.device) throw 'No device found.';
    return data.body.device;
  });
};

Player.prototype.checkCurrentDeviceAndTransfer = function() {
  return this.getCurrentDevice().then(function(device) {
    if(device.id != this.deviceId) {
      this.spotify.transferMyPlayback({ deviceIds: [this.deviceId], play: true })
    }
  }.bind(this));
};

module.exports = Player;
