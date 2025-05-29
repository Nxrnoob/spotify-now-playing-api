const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors"); // ✅ Import cors

dotenv.config();
const app = express();

app.use(cors()); // ✅ Enable CORS for all routes

const getAccessToken = async () => {
  const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
};

app.get("/now-playing", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const result = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (result.status === 204 || result.data === "") {
      return res.json({ isPlaying: false });
    }

    const song = {
      is_playing: result.data.is_playing,
      title: result.data.item.name,
      artist: result.data.item.artists.map((a) => a.name).join(", "),
      album_image_url: result.data.item.album.images[0].url,
      song_url: result.data.item.external_urls.spotify,
    };

    res.json(song);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "Could not fetch song data." });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

