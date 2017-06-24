/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/

'use strict';

const APP_ID = 'amzn1.ask.skill.548760a3-cde1-4633-944a-ceeb2d8e0a86';
const Alexa = require('alexa-sdk');
const SpotifyWebApi = require('spotify-web-api-node');
const genrePlaylists = require('./genre_playlists');
const genres = Object.keys(genrePlaylists);

function escapeResponse(response) {
  return response.replace("&", "&amp;");
}

var handlers = {
  'LaunchRequest': function() {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    this.emit(':ask',
      'What do you want to hear? You could say "play ' + genre + '", or "random".',
      'What do you want to hear?'
    );
  },
  'PlayGenreIntent': function() {
    // console.log("session: " + JSON.stringify(this.event.session));
    console.log("request: " + JSON.stringify(this.event.request));

    if(!this.event.session.user.accessToken) {
      this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
      return;
    }

    const spokenGenre = this.event.request.intent.slots.genreName.value;
    const resolutions = spokenGenre && this.event.request.intent.slots.genreName.resolutions.resolutionsPerAuthority;
    const resolution = resolutions && resolutions.find(function(resolution) { return resolution.status.code == 'ER_SUCCESS_MATCH' });
    const value = resolution && resolution.values && resolution.values[0] && resolution.values[0].value;
    var genre = value && value.name;

    if(!genre || genres.indexOf(genre) == -1) {
      if(spokenGenre) {
        this.emit(':tellWithCard',
          "Sorry, I couldn't find a genre for " + spokenGenre + ".",
          "Play some " + spokenGenre,
          "Sorry, I couldn't find a genre for " + spokenGenre + "."
        );
        return;
      } else {
        genre = genres[Math.floor(Math.random() * genres.length)];
        this.emit(':tellWithCard',
          "Ok, here's some " + escapeResponse(genre) + ".",
          "Play a random genre",
          "Here's some " + genre + "."
        );
      }
    } else {
      this.emit(':tellWithCard',
        "Ok, here's some " + escapeResponse(genre) + ".",
        "Play some " + genre,
        "Here's some " + genre + "."
      );
    }

    console.log("genre: " + genre);
    const playlistUri = genrePlaylists[genre];
    console.log("uri: " + playlistUri);

    const spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      accessToken: this.event.session.user.accessToken,
      refreshToken: this.event.session.user.refreshToken
    });

    spotify.getMyDevices().then(function(data) {
      const device = data.body.devices.find(function(device) {
        return device.name.indexOf("Echo") != -1;
      });

      if(device) {
        spotify.startMyPlayback({
          device_id: device.id,
          context_uri: playlistUri
        }).then(function() {}, console.log);
      } else {
        console.log("no echo found");
      }
    }, console.log);
  }
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
