export default async function handler(req, res) {
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  // Get access token
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    return res.status(400).json({ error: tokenData.error });
  }

  const access_token = tokenData.access_token;

  // Get now playing
  const nowPlayingRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (nowPlayingRes.status === 204 || nowPlayingRes.status > 400) {
    return res.json({ isPlaying: false });
  }

  const song = await nowPlayingRes.json();

  const result = {
    isPlaying: song.is_playing,
    title: song.item?.name,
    artist: song.item?.artists?.map((a) => a.name).join(", "),
    album: song.item?.album?.name,
    albumImageUrl: song.item?.album?.images[0]?.url,
    songUrl: song.item?.external_urls?.spotify,
    progress: song.progress_ms,
    duration: song.item?.duration_ms,
  };

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
  res.json(result);
}

