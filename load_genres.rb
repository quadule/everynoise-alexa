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
      name.gsub("-", " "),
      name.gsub(/^nu[- ](\w+)/, 'new \1').gsub("-", " "),
      name.gsub(/(?<=[[:alpha:]])(core|folk|gaze|pop|punk|rock)$/, ' \1').gsub("-", " "),
      ("acapella" if name == "a cappella")
    ].compact.uniq - [name]
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
end.sort_by(&:name)

if genres.size < 1500
  raise "Too few genres found (#{genres.size} for #{rows.size} rows)"
end

File.open("genre_playlists.js", "w") do |f|
  f << "module.exports = "
  f << JSON.pretty_generate(genres.map(&:to_js))
  f << ";"
end

model_path = File.join(__dir__, "models/en-US.json")
model = JSON.parse(open(model_path).read)
types = model.fetch("interactionModel").fetch("languageModel").fetch("types")
unless type = types.find { |t| t["name"] == "EVERYNOISE_GENRES" }
  types << { "name" => "EVERYNOISE_GENRES" }
end
type["values"] = genres.map(&:to_model)

File.open(model_path, "w") do |f|
  f << JSON.pretty_generate(model)
end
