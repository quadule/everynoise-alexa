const Genre = {
  all: [],
  byName: {},
  names: [],
  load: function(playlists) {
    playlists.forEach(function(playlist) {
      Genre.all.push(playlist);
      Genre.names.push(playlist.name);
      Genre.byName[playlist.name] = Genre.byName[playlist.name] || playlist;
      playlist.alternatives.forEach(function(altName) {
        Genre.byName[altName] = Genre.byName[altName] || playlist;
      });
    })
  },
  find: function(name) {
    return this.byName[name];
  },
  random: function() {
    return this.all[Math.floor(Math.random() * this.all.length)];
  }
};

Genre.load(require('./genre_playlists'));
module.exports = Genre;
