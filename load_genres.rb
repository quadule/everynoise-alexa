require "open-uri"
require "nokogiri"
require "json"
require "byebug"

Genre = Struct.new(:name, :uri) do
  def id
    "genre_" + name.gsub(/[^a-z0-9]/, "_")
  end

  def synonyms
    [
      (name.gsub("-", " ") if name.include?("-")),
      (name.gsub(/^nu[- ](\w+)/, 'new \1') if name =~ /^nu[- ]/),
      (name.gsub(/^nu[- ](\w+)/, 'new\1') if name =~ /^nu[- ]/),
      (name.gsub(/([a-z])core$/, '\1 core').gsub("-", " ") if name =~ /([a-z])core$/),
      (name.gsub(/([a-z])gaze$/, '\1 gaze').gsub("-", " ") if name =~ /([a-z])gaze$/),
      (name.gsub(/([a-z])pop$/, '\1 pop').gsub("-", " ") if name =~ /([a-z])pop$/),
      (name.gsub("poppunk", "pop punk") if name.include?("poppunk")),
      ("acapella" if name == "a cappella")
    ].compact
  end

  def to_js
    {
      "name" => name,
      "uri" => uri
    }
  end

  def to_model
    {
      "id" => id,
      "name" => {
        "value" => name,
        "synonyms" => synonyms
      }
    }
  end
end

html = open("http://everynoise.com/everynoise1d.cgi?scope=all")
doc = Nokogiri::HTML(html)
rows = doc.css("body > table > tr")
SPOTIFY_ID = /[A-Za-z0-9]{22}/
PLAYLIST_URI = /spotify:user:thesoundsofspotify:playlist:#{SPOTIFY_ID}/
genres = rows.map do |row|
  name = row.at("td.note:last").text
  link = row.at("a.note")[:href]
  uri = link[PLAYLIST_URI]
  Genre.new(name, uri)
end

if genres.size < 1500
  raise "Too few genres found (#{genres.size} for #{rows.size} rows)"
end

File.open("genre_playlists.js", "w") do |f|
  f << "module.exports = "
  f << JSON.pretty_generate(genres.map(&:to_js))
  f << ";"
end

model = JSON.parse(open("model.json").read)
type = model["types"].find { |t| t["name"] == "EVERYNOISE_GENRES" }
unless type
  type = { "name" => "EVERYNOISE_GENRES" }
  model["types"] << type
end
type["values"] = genres.map(&:to_model)

File.open("model.json", "w") do |f|
  f << JSON.pretty_generate(model)
end
