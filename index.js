/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/

'use strict';

const APP_ID = 'amzn1.ask.skill.548760a3-cde1-4633-944a-ceeb2d8e0a86';
const Alexa = require('alexa-sdk');
const Genre = require('./genre');
const Player = require('./player');

function escapeResponse(response) {
  return response.replace("&", "&amp;");
}

function resolveSlot(slot) {
  const resolutions = slot.value && slot.resolutions.resolutionsPerAuthority;
  const resolution = resolutions && resolutions.find(function(resolution) { return resolution.status.code == 'ER_SUCCESS_MATCH' });
  const value = resolution && resolution.values && resolution.values[0] && resolution.values[0].value;
  return value && value.name;
}

let handlers = {
  'LaunchRequest': function() {
    this.emit('AMAZON.HelpIntent');
  },
  'AMAZON.HelpIntent': function() {
    if(!this.event.session.user.accessToken) {
      this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
      return;
    }

    const genre = Genre.random();
    this.emit(':ask',
      'What do you want to hear? You could say "play ' + escapeResponse(genre.name) + '", or "random".',
      'What do you want to hear?'
    );
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Ok, goodbye.');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Ok, goodbye.');
  },
  'PlayRandomGenreIntent': function() {
    console.log("event: " + JSON.stringify(this.event));

    if(!this.event.session.user.accessToken) {
      this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
      return;
    }

    const genre = Genre.random();
    this.emit(':tellWithCard',
      "Ok, here's some " + escapeResponse(genre.name) + ".",
      "Play a random genre",
      "Here's some " + genre.name + "."
    );
    const player = new Player(this);
    player.playPlaylist(genre.uri);
  },
  'PlayNamedGenreIntent': function() {
    console.log("event: " + JSON.stringify(this.event));

    if(!this.event.session.user.accessToken) {
      this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
      return;
    }

    const spokenGenreName = this.event.request.intent.slots.genreName.value;
    let genreName = resolveSlot(this.event.request.intent.slots.genreName) || spokenGenreName;
    genreName = genreName || spokenGenreName;
    if(genreName) genreName = genreName.toLowerCase();
    const genre = Genre.find(genreName);
    const player = new Player(this);

    if(genre) {
      this.emit(':tellWithCard',
        "Ok, here's some " + escapeResponse(genre.name) + ".",
        "Play some " + genre.name,
        "Here's some " + genre.name + "."
      );

      console.log("genre: " + genre.name);
      console.log("uri: " + genre.uri);

      player.playPlaylist(genre.uri);
    } else {
      if(spokenGenreName) {
        this.emit(':tellWithCard',
          "Sorry, I couldn't find a genre for " + spokenGenreName + ".",
          "Play some " + spokenGenreName,
          "Sorry, I couldn't find a genre for " + spokenGenreName + "."
        );
        return;
      } else {
        this.emit('Unhandled');
      }
    }
  },
  'SelectSpotifyDeviceIntent': function() {
    if(!this.event.session.user.accessToken) {
      this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
      return;
    }

    const player = new Player(this);
    return player.getCurrentDevice().then(function(device) {
      this.attributes.spotifyDeviceId = device.id;
      this.emit(':tell', "Ok, I'll use the device " + escapeResponse(device.name) + " from now on.");
    }.bind(this), function(error) {
      console.log(error);
      delete this.attributes.spotifyDeviceId;
      this.emit(':tell', "I couldn't find a device. Try playing a song on Spotify first.");
    }.bind(this));
  },
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.emit(':tell', "Sorry, I didn't get that.");
    this.emit('AMAZON.HelpIntent');
  }
};

exports.handler = function(event, context, callback) {
  let alexa = Alexa.handler(event, context, callback);
  alexa.appId = APP_ID;
  alexa.dynamoDBTableName = 'EverynoiseSkillTable';
  alexa.registerHandlers(handlers);
  alexa.execute();
};
