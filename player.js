const SpotifyWebApi = require('spotify-web-api-node');

function Player(handler) {
  this.handler = handler;
  this.spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    accessToken: handler.event.session.user.accessToken
  });
}

Player.prototype.playPlaylist = function(uri) {
  const options = { context_uri: uri }
  if(this.handler.attributes.spotifyDeviceId) options.device_id = this.handler.attributes.spotifyDeviceId;
  this.spotify.startMyPlayback(options).then(function() {}, console.log);
};

Player.prototype.getCurrentDevice = function() {
  return this.spotify.getMyCurrentPlaybackState().then(function(data) {
    console.log(JSON.stringify(data.body));
    if(!data.body.device) throw 'No device found.'
    return data.body.device;
  });
}

module.exports = Player;
