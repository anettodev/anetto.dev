#!/usr/bin/env node
/*
 * Refreshes src/data/youtube.json and src/assets/youtube/: Antonio's
 * YouTube playlist (YOUTUBE_PLAYLIST in src/lib/site.ts), behind the
 * videos container under the identity card (VideosPlayer.astro).
 *
 *   npm run youtube:refresh
 *
 * YouTube's tokenless playlist feeds answer 404 since 2026, so this reads
 * the YouTube Data API v3 with an API key: YOUTUBE_API_KEY from the
 * environment (Antonio's Keychain locally, a GitHub secret in CI). The key
 * travels in the X-goog-api-key header, never in an address, so it can't
 * leak into a log; nothing secret is printed. A key reads Public and
 * Unlisted playlists, not Private ones. Each run costs about one quota
 * unit per 50 videos, of the free 10,000 a day.
 *
 * Kept: the playlist's title, channel and link, then up to MAX_VIDEOS
 * videos in the playlist's order, each with its title, channel, link and
 * thumbnail (YouTube's 320×180), downloaded into
 * src/assets/youtube/<id>.<ext> so visitors load nothing from YouTube until
 * they open a player. Private and deleted videos are left out, and
 * thumbnails of videos no longer listed are removed.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { YOUTUBE_PLAYLIST } from "../src/lib/site.ts";

const API = "https://www.googleapis.com/youtube/v3";
const MAX_VIDEOS = 50;
const MAX_THUMB_BYTES = 2_000_000;
const OUT = fileURLToPath(new URL("../src/data/youtube.json", import.meta.url));
const THUMBS = fileURLToPath(
  new URL("../src/assets/youtube/", import.meta.url),
);
const THUMB_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// YouTube's IDs (playlists and videos) are URL-safe base64.
const ID = /^[A-Za-z0-9_-]+$/;

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

const key = process.env.YOUTUBE_API_KEY?.trim();
if (!key) {
  fail('Set YOUTUBE_API_KEY first (PLAN.md, "YouTube playlist").');
}
const playlistId =
  /[?&]list=([^&#]+)/.exec(YOUTUBE_PLAYLIST)?.[1] ?? YOUTUBE_PLAYLIST.trim();
if (!playlistId) fail("Set YOUTUBE_PLAYLIST in src/lib/site.ts first.");
if (!ID.test(playlistId)) {
  fail(`YOUTUBE_PLAYLIST: "${YOUTUBE_PLAYLIST}" isn't a playlist link or ID.`);
}

async function api(path, params) {
  const url = new URL(`${API}/${path}`);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { headers: { "X-goog-api-key": key } });
  const body = await response.json().catch(() => ({}));
  if (response.ok) return body;
  const reason = body.error?.errors?.[0]?.reason ?? "";
  const message = body.error?.message ?? "";
  // A script sends no referer, so a key limited to websites refuses it.
  const hint =
    reason === "quotaExceeded"
      ? "\nThe daily quota is used up; it resets at midnight Pacific time."
      : /referer/i.test(message)
        ? "\nThe key is limited to websites: set its application restriction to None (keep the API restriction to YouTube Data API v3). Changes can take five minutes."
        : response.status === 403
          ? "\nCheck that YouTube Data API v3 is enabled for the key's project and the key is restricted to it, not to other APIs."
          : "";
  fail(
    `YouTube answered ${response.status} for /${path}:`,
    `${message} ${reason}${hint}`,
  );
}

const { items: [playlist] = [] } = await api("playlists", {
  part: "snippet,status",
  id: playlistId,
});
if (!playlist) {
  fail(
    `No playlist ${playlistId}: check the link, and that it's Public or Unlisted.`,
  );
}

const entries = [];
let pageToken = "";
do {
  const page = await api("playlistItems", {
    part: "snippet,status",
    playlistId,
    maxResults: "50",
    ...(pageToken && { pageToken }),
  });
  entries.push(...(page.items ?? []));
  pageToken = page.nextPageToken ?? "";
} while (pageToken && entries.length < MAX_VIDEOS);

// Private and deleted videos stay in a playlist as "Private video" /
// "Deleted video", without an owner channel.
const playable = entries
  .filter(
    (entry) =>
      entry.status?.privacyStatus !== "private" &&
      entry.snippet?.videoOwnerChannelTitle &&
      ID.test(entry.snippet?.resourceId?.videoId ?? ""),
  )
  .slice(0, MAX_VIDEOS);

/* ---------- Thumbnails ---------- */

mkdirSync(THUMBS, { recursive: true });
const onDisk = new Map(
  readdirSync(THUMBS).map((file) => [file.replace(/\.[a-z]+$/, ""), file]),
);

/** Downloads the thumbnail, or keeps the one on disk if that fails. */
async function thumbOf(id, thumbnails = {}) {
  const image = thumbnails.medium ?? thumbnails.high ?? thumbnails.default;
  try {
    if (!image?.url) throw new Error("no thumbnail");
    const response = await fetch(image.url);
    const type = (response.headers.get("content-type") ?? "").split(";")[0];
    const ext = THUMB_TYPES[type.trim()];
    if (!response.ok || !ext) throw new Error(`${response.status} ${type}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_THUMB_BYTES) {
      throw new Error(`${bytes.length} bytes`);
    }
    const file = `${id}.${ext}`;
    writeFileSync(`${THUMBS}${file}`, bytes);
    return file;
  } catch {
    return onDisk.get(id) ?? null; // None: the row shows a blank tile.
  }
}

const videos = [];
for (const entry of playable) {
  const id = entry.snippet.resourceId.videoId;
  videos.push({
    id,
    title: entry.snippet.title,
    channel: entry.snippet.videoOwnerChannelTitle,
    link: `https://www.youtube.com/watch?v=${id}&list=${playlistId}`,
    thumb: await thumbOf(id, entry.snippet.thumbnails),
  });
}

const kept = new Set(videos.map((video) => video.thumb).filter(Boolean));
for (const file of readdirSync(THUMBS)) {
  if (!kept.has(file)) rmSync(`${THUMBS}${file}`);
}

const snapshot = {
  // The local date (en-CA formats it YYYY-MM-DD).
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  source: "youtube",
  playlist: {
    id: playlistId,
    title: playlist.snippet.title,
    channel: playlist.snippet.channelTitle,
    link: `https://www.youtube.com/playlist?list=${playlistId}`,
  },
  videos,
};
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `"${playlist.snippet.title}" (${playlist.status?.privacyStatus ?? "?"}): ${videos.length} videos, ${entries.length - playable.length} private or deleted left out, ${kept.size} thumbnails -> ${OUT}`,
);
