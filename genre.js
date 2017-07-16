const Genre = {
  all: [],
  byName: {},
  byUri: {},
  names: [],
  load: function(playlists) {
    playlists.forEach(function(playlist) {
      Genre.all.push(playlist);
      Genre.names.push(playlist.name);
      Genre.byName[playlist.name] = Genre.byName[playlist.name] || playlist;
      Genre.byUri[playlist.uri] = Genre.byUri[playlist.uri] || playlist;
    })
  },
  find: function(name) {
    return this.byName[name];
  },
  random: function() {
    return this.all[Math.floor(Math.random() * this.all.length)];
  },
  similarFromDescription: function(description) {
    const linkRegExp = /<a href="(spotify:user:[^"]+)">([^>]+)<\/a>/g;
    const genres = [];
    var matches;
    while((matches = linkRegExp.exec(description)) !== null) {
      const genre = Genre.byUri[matches[1]];
      if(genre) genres.push(genre);
    }
    return genres;
  }
};

Genre.load(require('./genre_playlists'));
module.exports = Genre;
