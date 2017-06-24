require "open-uri"
require "nokogiri"
require "json"
require "byebug"

html = open("http://everynoise.com/everynoise1d.cgi?scope=all")
doc = Nokogiri::HTML(html)

rows = doc.css("body > table > tr")

SPOTIFY_ID = /[A-Za-z0-9]{22}/
PLAYLIST_URI = /spotify:user:thesoundsofspotify:playlist:#{SPOTIFY_ID}/

genres = rows.reduce({}) do |genres, row|
  name = row.at("td.note:last").text
  link = row.at("a.note")[:href]
  uri = link[PLAYLIST_URI]

  genres[name] ||= uri if uri
  genres
end

if genres.size < 1500
  raise "Too few genres found (#{genres.size} for #{rows.size} rows)"
end

File.open("genre_playlists.js", "w") do |f|
  f << "module.exports = "
  f << JSON.pretty_generate(genres)
  f << ";"
end

puts genres.keys.sort.join("\n")
