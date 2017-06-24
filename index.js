/* eslint-disable  func-names */
/* eslint-disable  dot-notation */
/* eslint-disable  new-cap */
/* eslint quote-props: ['error', 'consistent']*/

'use strict';

const Alexa = require('alexa-sdk');
const genrePlaylists = require('./genre_playlists');
const genres = Object.keys(genrePlaylists);
const APP_ID = 'amzn1.ask.skill.548760a3-cde1-4633-944a-ceeb2d8e0a86';

var handlers = {
  'PlayGenreIntent': function() {
    var genreSlot = this.event.request.intent.slots.genreName, genre;
    if(genreSlot) genre = genreSlot.value;
    if(!genre) genre = genres[Math.floor(Math.random() * genres.length)];

    this.emit(':tell', 'Ok, playing some ' + genre + '.');
  }
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
