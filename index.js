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
  const resolutions = slot.value && slot.resolutions && slot.resolutions.resolutionsPerAuthority;
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
  if(error && error.statusCode == 403) {
    this.emit(':tellWithLinkAccountCard', 'You must first link your Spotify account in the Alexa app.');
  } else {
    this.emit(':tell', 'Sorry, something went wrong.');
  }
}

let handlers = {
  'LaunchRequest': function() {
    if(!isLinked(this)) return;
    this.emit(':ask',
      '<s>What do you want to hear?</s>' +
        '<s>I can play musical genres by name or at random.</s>'
    );
  },
  'AMAZON.HelpIntent': function() {
    this.emit(':askWithCard',
      '<s>You can tell me to play any musical genre, such as ' +
        sayName(Genre.random().name) + ', or ' + sayName(Genre.random().name) + '.</s> ' +
        '<s>Try asking what else I can play, or to play something random.</s> ' +
        '<s>You can also ask to play or list similar genres, or to follow a genre playlist on your Spotify account.</s> ' +
        '<s>What do you want to do?</s>',
      '<s>What do you want to do?</s>',
      'Some Things You Can Do',
      'Play music: "Play ' + Genre.random().name + '" or "Play a random genre" or "Play something similar"\n\n' +
        'Explore: "What can I play?" or "What else is like this?"\n\n' +
        'Save your discoveries on Spotify: "Follow this genre"'
    );
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Goodbye.');
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Goodbye.');
  },
  'ListGenresIntent': function() {
    let genreNames = new Array(8).fill(null).map(function() { return Genre.random().name; });
    this.emit(':tell',
      "Here are a few of the genres I can play. " + genreNames.map(sayName).join(". "),
      "Some Example Genres",
      genreNames.join(", ")
    );
  },
  'PlayRandomGenreIntent': function() {
    if(!isLinked(this)) return;

    const genre = Genre.random();
    this.attributes.lastGenreName = genre.name;
    this.emit(':tell', "Ok, here's some " + sayName(genre.name) + ".");

    const player = new Player(this);
    return player.playPlaylist(genre.uri).then(null, onAPIError.bind(this));
  },
  'PlayNamedGenreIntent': function() {
    if(!isLinked(this)) return;

    const spokenGenreName = this.event.request.intent.slots.genreName.value;
    let genreName = resolveSlot(this.event.request.intent.slots.genreName) || spokenGenreName;
    if(genreName) genreName = genreName.toLowerCase();
    const genre = Genre.find(genreName);

    if(genre) {
      this.attributes.lastGenreName = genre.name;
      this.emit(':tell', "Ok, here's some " + sayName(genre.name) + ".");

      const player = new Player(this);
      return player.playPlaylist(genre.uri).then(null, onAPIError.bind(this));
    } else {
      if(spokenGenreName) {
        this.emit(':tell', "Sorry, I couldn't find a genre for " + spokenGenreName + ".");
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
  'ListSimilarGenresIntent': function() {
    const player = new Player(this);
    return player.getCurrentGenre().then(function(currentGenre) {
      if(currentGenre.similar.length == 0) throw "no similar genres found";
      const similarNames = currentGenre.similar.map(function(g) { return g.name; });
      this.emit(':tell',
        "Here are some genres similar to " + sayName(currentGenre.name) + ". " +
          similarNames.map(sayName).join(". ")
      );
    }.bind(this)).then(null, function(error) {
      if(typeof error == "string" && error.indexOf("no genre") == 0) {
        this.emit(':tell', "You must play a genre before I can tell you similar genres.");
      } else {
        console.log(error);
        this.emit(':tell', "Sorry, I couldn't find anything.");
      }
    }.bind(this));
  },
  'PlaySimilarGenreIntent': function() {
    const player = new Player(this);
    return player.getCurrentGenre().then(function(currentGenre) {
      if(currentGenre.similar.length == 0) throw "no similar genres found";
      const newGenre = currentGenre.similar[Math.floor(Math.random() * currentGenre.similar.length)];
      this.attributes.lastGenreName = newGenre.name;
      this.emit(':tell', "Ok, here's some " + sayName(newGenre.name) + ".");
      return player.playPlaylist(newGenre.uri);
    }.bind(this)).then(null, function(error) {
      if(typeof error == "string" && error.indexOf("no genre") == 0) {
        this.emit(':tell', "You must play a genre before I can play similar genres.");
      } else {
        console.log(error);
        this.emit(':tell', "Sorry, I couldn't find anything.");
      }
    }.bind(this));
  },
  'FollowPlaylistIntent': function() {
    const player = new Player(this);
    return player.spotify.getMyCurrentPlaybackState().then(function(data) {
      const uri = data.body && data.body.context && data.body.context.uri;
      if(uri && uri.indexOf("spotify:user:") == 0) {
        const uriParts = uri.split(':');
        const user = uriParts[2], id = uriParts[4];
        return player.spotify.followPlaylist(user, id, { public: false }).then(function() {
          this.emit(':tell', "Ok, you now follow this playlist.");
        }.bind(this));
      } else {
        this.emit(':tell', "I couldn't find a playlist to follow.");
      }
    }.bind(this)).then(null, onAPIError.bind(this));
  },
  'UnfollowPlaylistIntent': function() {
    const player = new Player(this);
    return player.spotify.getMyCurrentPlaybackState().then(function(data) {
      const uri = data.body && data.body.context && data.body.context.uri;
      if(uri && uri.indexOf("spotify:user:") == 0) {
        const uriParts = uri.split(':');
        const user = uriParts[2], id = uriParts[4];
        return player.spotify.unfollowPlaylist(user, id).then(function() {
          this.emit(':tell', "Ok, you no longer follow this playlist.");
        }.bind(this));
      } else {
        this.emit(':tell', "I couldn't find a playlist to unfollow.");
      }
    }.bind(this)).then(null, onAPIError.bind(this));
  },
  'SelectSpotifyDeviceIntent': function() {
    if(!isLinked(this)) return;

    const player = new Player(this);
    return player.getCurrentDevice().then(function(device) {
      this.attributes.spotifyDeviceMap = this.attributes.spotifyDeviceMap || {};
      this.attributes.spotifyDeviceMap[this.event.context.System.device.deviceId] = device.id;
      this.emit(':tell', "Ok, I'll play on the device " + sayName(device.name) + " from now on.");
    }.bind(this), function(error) {
      console.log(error);
      this.emit(':tell', "I couldn't find a device. Try playing a song on Spotify first.");
    }.bind(this));
  },
  'DeselectSpotifyDeviceIntent': function() {
    if(!isLinked(this)) return;
    if(this.attributes.spotifyDeviceMap) {
      delete this.attributes.spotifyDeviceMap[this.event.context.System.device.deviceId];
    }
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
