# [Every Noise at Once](http://everynoise.com) for Alexa

## Usage

Play over 1500 genres on Spotify by name or at random. Explore similar genres and music from around the world. Follow playlists for genres you discover so you can play them from Spotify anywhere.

This skill requires a Spotify Premium account to play music and follow playlists. Genre information comes from [everynoise.com](http://everynoise.com) by Glenn McDonald.

* Listen to any of the genres found on everynoise.com: "Alexa, ask Every Noise to play some Norwegian punk."
* Find out about some genres you could listen to: "Alexa, ask Every Noise what can I play?"
* Try something at random: "Alexa, ask Every Noise to play a random genre."
* Try a similar genre: "Alexa, ask Every Noise to play something else like this."
* Or list all similar genres: "Alexa, ask Every Noise for similar genres."
* Ask what you're hearing: "Alexa, ask Every Noise what is this?"
* Follow the playlist for a genre you've discovered: "Alexa, ask Every Noise to follow this playlist."

This skill can play music on any Spotify Connect compatible device, including Amazon Echo. Before using this skill, make sure that you can use the official Spotify app on a phone or computer to control playback on your device. If your Echo does not appear in the Spotify app, try saying "Alexa, Spotify Connect" first.

By default, this skill always will play music on the device you last used with Spotify. If you use Spotify on multiple devices, you may want to lock playback to a specific device:

* Lock to currently playing device: "Alexa, ask Every Noise to lock the Spotify device."
* Default to the last used device: "Alexa, ask Every Noise to always use the last device."

## Development

Run `ruby load_genres.rb` to rebuild model.json with the latest genres from everynoise.com.

Run `npm install` then `npm run export` to generate a .zip file to upload to AWS Lambda.
