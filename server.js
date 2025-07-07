const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/now-playing", async (req, res) => {
  try {
    const token = await getAccessToken(); // we'll handle refresh too
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204 || response.data === "") {
      return res.status(200).json({ isPlaying: false });
    }

    const { item, is_playing, progress_ms } = response.data;

    const song = {
      isPlaying: is_playing,
      title: item.name,
      artist: item.artists.map((artist) => artist.name).join(", "),
      album: item.album.name,
      albumImageUrl: item.album.images[0].url,
      songUrl: item.external_urls.spotify,
      progress: progress_ms,
      duration: item.duration_ms,
    };

    return res.status(200).json(song);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch now playing" });
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// Token Refresh
async function getAccessToken() {
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

  const response = await axios.post("https://accounts.spotify.com/api/token", new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
  }), {
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data.access_token;
}

