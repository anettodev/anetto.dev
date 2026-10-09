#!/usr/bin/env node
/*
 * Refreshes src/data/playlist.json and src/assets/music/playlist.jpg: the
 * title and cover the collapsed Apple Music bar under the identity card
 * shows (MusicPlayer.astro), so the page loads nothing from Apple until a
 * visitor opens the player.
 *
 *   npm run music:refresh
 *
 * No token: it reads the playlist's public page (APPLE_MUSIC_PLAYLIST in
 * src/lib/site.ts). Its og:title gives the name ("BitsNBytes by … on Apple
 * Music"); its og:image is a 1200×630 card whose base address also serves
 * the square cover, so the size at the end is swapped for 240×240.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { APPLE_MUSIC_PLAYLIST } from "../src/lib/site.ts";

const OUT = fileURLToPath(
  new URL("../src/data/playlist.json", import.meta.url),
);
const COVERS = fileURLToPath(new URL("../src/assets/music/", import.meta.url));
const COVER_SIZE = 240;
const HEADERS = { "User-Agent": "anetto.dev playlist refresh" };

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

if (!APPLE_MUSIC_PLAYLIST) fail("No APPLE_MUSIC_PLAYLIST in src/lib/site.ts.");

const response = await fetch(APPLE_MUSIC_PLAYLIST, { headers: HEADERS });
if (!response.ok) fail(`Apple Music answered ${response.status}.`);
const page = await response.text();

const unescape = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const meta = (property) => {
  const tag = page.match(
    new RegExp(`<meta[^>]+property="${property}"[^>]*>`, "i"),
  )?.[0];
  const content = tag?.match(/content="([^"]*)"/)?.[1];
  return content ? unescape(content) : null;
};

const ogTitle = meta("og:title");
const ogImage = meta("og:image");
if (!ogTitle || !ogImage) fail("The playlist page has no og:title/og:image.");

const title = ogTitle.replace(/\s+by\s+.+?\s+on Apple Music$/i, "").trim();
const coverUrl = ogImage.replace(
  /\/[^/]+$/,
  `/${COVER_SIZE}x${COVER_SIZE}bb.jpg`,
);
const cover = await fetch(coverUrl, { headers: HEADERS });
const type = cover.headers.get("content-type") ?? "";
if (!cover.ok || !type.startsWith("image/")) {
  fail(`Cover ${coverUrl} answered`, `${cover.status} ${type}`);
}
mkdirSync(COVERS, { recursive: true });
writeFileSync(`${COVERS}playlist.jpg`, Buffer.from(await cover.arrayBuffer()));

const snapshot = {
  // The local date (en-CA formats it YYYY-MM-DD).
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  link: APPLE_MUSIC_PLAYLIST,
  title,
  cover: "playlist.jpg",
};
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`"${title}" and its cover -> ${OUT}`);
