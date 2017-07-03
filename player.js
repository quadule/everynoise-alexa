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
  if(this.deviceId) options.device_id = this.deviceId;
  return this.spotify.startMyPlayback(options);
};

Player.prototype.getCurrentDevice = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    if(!data.body.device) throw 'No device found.';
    return data.body.device;
  });
}

module.exports = Player;
