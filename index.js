/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/

'use strict';

const APP_ID = 'amzn1.ask.skill.548760a3-cde1-4633-944a-ceeb2d8e0a86';
const Alexa = require('alexa-sdk');
const Genre = require('./genre');
const Player = require('./player');

function sayName(name) {
  return '<prosody volume="x-loud">' + name.replace("&", "&amp;") + '</prosody>';
}

function resolveSlot(slot) {
  const resolutions = slot.value && slot.resolutions.resolutionsPerAuthority;
  const resolution = resolutions && resolutions.find(function(resolution) { return resolution.status.code == 'ER_SUCCESS_MATCH' });
  const value = resolution && resolution.values && resolution.values[0] && resolution.values[0].value;
  return value && value.name;
}

function isLinked(handler) {
  if(handler.event.session.user.accessToken) {
    return true;
  } else {
    handler.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
    return false;
  }
}

function onAPIError(error) {
  console.log(error);
  this.emit(':tell', 'Sorry, something went wrong.');
}

let handlers = {
  'LaunchRequest': function() {
    if(!isLinked(this)) return;
    this.emit(':ask', 'What do you want to hear?');
  },
  'AMAZON.HelpIntent': function() {
    const genre = Genre.random();
    this.emit(':ask',
      '<s>You can tell me to play any musical genre, such as ' +
        sayName(Genre.random().name) + ' or ' + sayName(Genre.random().name) + '.</s>' +
        '<s>You also can ask what else I can play, or to play something random.</s>',
      'What do you want to do?'
    );
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye.');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye.');
  },
  'ListGenresIntent': function() {
    let genreNames = new Array(6).fill(null).map(function() { return Genre.random().name; });
    this.emit(':tellWithCard',
      "Here are a few of the genres I can play. " + genreNames.map(sayName).join(". "),
      "What can I play?",
      "Examples: " + genreNames.join(", ")
    );
  },
  'PlayRandomGenreIntent': function() {
    console.log("event: " + JSON.stringify(this.event));
    if(!isLinked(this)) return;

    const genre = Genre.random();
    this.attributes.lastGenreName = genre.name;

    const player = new Player(this);
    return player.playPlaylist(genre.uri).then(
      function() {
        this.emit(':tellWithCard',
          "Ok, here's some " + sayName(genre.name) + ".",
          "Play a random genre",
          "Here's some " + genre.name + "."
        );
      }.bind(this),
      onAPIError.bind(this)
    );
  },
  'PlayNamedGenreIntent': function() {
    console.log("event: " + JSON.stringify(this.event));
    if(!isLinked(this)) return;

    const spokenGenreName = this.event.request.intent.slots.genreName.value;
    let genreName = resolveSlot(this.event.request.intent.slots.genreName) || spokenGenreName;
    genreName = genreName || spokenGenreName;
    if(genreName) genreName = genreName.toLowerCase();
    const genre = Genre.find(genreName);

    if(genre) {
      console.log("genre: " + genre.name);
      console.log("uri: " + genre.uri);
      this.attributes.lastGenreName = genre.name;

      const player = new Player(this);
      return player.playPlaylist(genre.uri).then(
        function() {
          this.emit(':tellWithCard',
            "Ok, here's some " + sayName(genre.name) + ".",
            "Play some " + genre.name,
            "Here's some " + genre.name + "."
          );
        }.bind(this),
        onAPIError.bind(this)
      );
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
  'CurrentGenreIntent': function() {
    if(this.attributes.lastGenreName) {
      this.emit(':tell', "I last played some " + sayName(this.attributes.lastGenreName) + ".");
    } else {
      this.emit(':tell', "I haven't played anything yet.");
    }
  },
  'SelectSpotifyDeviceIntent': function() {
    if(!isLinked(this)) return;

    const player = new Player(this);
    return player.getCurrentDevice().then(function(device) {
      this.attributes.spotifyDeviceId = device.id;
      this.emit(':tell', "Ok, I'll play on the device " + sayName(device.name) + " from now on.");
    }.bind(this), function(error) {
      console.log(error);
      delete this.attributes.spotifyDeviceId;
      this.emit(':tell', "I couldn't find a device. Try playing a song on Spotify first.");
    }.bind(this));
  },
  'DeselectSpotifyDeviceIntent': function() {
    if(!isLinked(this)) return;
    delete this.attributes.spotifyDeviceId;
    this.emit(':tell', "Ok, I'll play on your last used device from now on.");
  },
  'SessionEndedRequest': function() {
    this.emit(':saveState', true);
  },
  'Unhandled': function() {
    this.emit(':tell', "Sorry, I didn't get that.");
  }
};

exports.handler = function(event, context, callback) {
  let alexa = Alexa.handler(event, context, callback);
  alexa.appId = APP_ID;
  alexa.dynamoDBTableName = 'EverynoiseSkillTable';
  alexa.registerHandlers(handlers);
  alexa.execute();
};
