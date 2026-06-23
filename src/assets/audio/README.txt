Drop your song files in THIS folder using lowercase names, e.g.:

  song1.mp3
  song2.mp3
  song3.mp3
  song4.mp3

These names are referenced in src/assets/data/wedding.json under "music" -> "tracks".
IMPORTANT: filenames are case-sensitive on the deployed host (Vercel/Linux),
so the name here must match the "url" in wedding.json EXACTLY (use lowercase).

How it works:
- Each time the website is opened, the player picks ONE random track to play.
- When a track finishes, it rolls another random track and keeps playing.
- To add/remove songs or rename them, just edit the "tracks" list in
  src/assets/data/wedding.json (title = what shows in the player panel,
  url = path to the file in this folder). Add as many as you like.

Note: most browsers block autoplay-with-sound until the visitor interacts
with the page, so playback starts on the first tap/click if it can't autostart.
