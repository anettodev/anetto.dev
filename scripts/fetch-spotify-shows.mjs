#!/usr/bin/env node
/*
 * Refreshes src/data/podcasts.json and src/assets/podcasts/: the Spotify
 * shows listed in PODCASTS_SHOWN (src/lib/site.ts), in that order, behind
 * the podcasts container under the identity card (PodcastsPlayer.astro).
 *
 *   npm run podcasts:login     once: approve READ-ONLY access in the browser
 *                              (Spotify's own page; this script never sees
 *                              the password), then one test call
 *   npm run podcasts:refresh   the listed shows -> the snapshot
 *
 * Only listed shows reach the site (Antonio's choice). A listed show comes
 * from Antonio's library when he follows it, else from `GET /shows/{id}`;
 * followed shows that aren't listed are printed with their IDs, to copy
 * into the list.
 *
 * Spotify's Web API through Antonio's Development Mode app (Premium needed
 * since February 2026). SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET come
 * from the environment. The sign-in is the Authorization Code flow with the
 * client secret, scope `user-library-read` only: PKCE refresh tokens can
 * rotate, which would break unattended daily runs. A token granted more
 * than that scope is thrown away.
 *
 * The refresh token is kept outside the repo, in
 * ~/.config/anetto-dev/spotify.json, readable only by this user;
 * SPOTIFY_REFRESH_TOKEN (CI) wins over it. Nothing secret is printed.
 *
 * Since February 2026 Development Mode apps no longer get a show's
 * `publisher`, so it's read from the show's public page instead: its
 * og:description is "Podcast · <publisher> · <description>".
 *
 * Kept per show: id, name, publisher, link and a cover (the smallest image
 * ≥ 160px) downloaded into src/assets/podcasts/<id>.<ext>, so visitors load
 * nothing from Spotify until they open a player. Covers of shows no longer
 * listed are removed, the mock samples included.
 */
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PODCASTS_SHOWN } from "../src/lib/site.ts";

const API = "https://api.spotify.com/v1";
const ACCOUNTS = "https://accounts.spotify.com";
const SCOPE = "user-library-read";
const STORE_DIR = join(homedir(), ".config", "anetto-dev");
const STORE = join(STORE_DIR, "spotify.json");
const PORT = 8791;
// Spotify takes loopback IPs for redirects, not `localhost`.
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SIGN_IN_TIMEOUT = 5 * 60_000;
const MIN_COVER = 160;
const MAX_COVER_BYTES = 5_000_000;
const HEADERS = { "User-Agent": "anetto.dev podcasts refresh" };
const OUT = fileURLToPath(
  new URL("../src/data/podcasts.json", import.meta.url),
);
const COVERS = fileURLToPath(
  new URL("../src/assets/podcasts/", import.meta.url),
);
const COVER_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

/* ---------- The sign-in store (outside the repo, owner-only) ---------- */

const load = () =>
  existsSync(STORE) ? JSON.parse(readFileSync(STORE, "utf8")) : {};

function save(patch) {
  mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(
    STORE,
    `${JSON.stringify({ ...load(), ...patch }, null, 2)}\n`,
    {
      mode: 0o600,
    },
  );
  chmodSync(STORE, 0o600);
}

/* ---------- Spotify ---------- */

function basicAuth() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    fail(
      'Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first (PLAN.md, "Wire up the Spotify podcasts").',
    );
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

/** A token request; refuses any grant wider than read-only. */
async function token(params) {
  const response = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(
      `Spotify's token endpoint answered ${response.status}:`,
      body.error_description ?? body.error,
    );
  }
  const granted = (body.scope ?? "").split(/\s+/).filter(Boolean);
  if (granted.some((scope) => scope !== SCOPE)) {
    fail(`Spotify granted more than ${SCOPE} (${body.scope}); discarded.`);
  }
  return body;
}

async function api(url, accessToken) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) return response.json();
    if (response.status === 429 && attempt < 2) {
      const wait = Math.min(
        Number(response.headers.get("retry-after")) || 5,
        60,
      );
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    const body = await response.json().catch(() => ({}));
    const hint =
      response.status === 403
        ? "\nDevelopment Mode needs Premium on the app owner's account, and the signed-in account listed in the app's User Management."
        : "";
    fail(
      `Spotify answered ${response.status} for ${new URL(url).pathname}:`,
      `${body.error?.message ?? ""}${hint}`,
    );
  }
}

/* ---------- The browser's return trip (127.0.0.1, one request) ---------- */

const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

function listenForCode(state) {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", REDIRECT);
      if (url.pathname !== "/callback") {
        response.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const error =
        url.searchParams.get("state") !== state
          ? "state mismatch"
          : (url.searchParams.get("error") ?? (code ? "" : "no code returned"));
      response
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(
          error
            ? `<p>Not approved: ${escapeHtml(error)}</p>`
            : "<p>Done: read-only Spotify access approved for anetto.dev. You can close this tab.</p>",
        );
      clearTimeout(timer);
      server.close();
      if (error) reject(new Error(`Spotify sign-in failed: ${error}`));
      else resolve(code);
    });
    server.on("error", (error) =>
      reject(new Error(`Can't listen on ${REDIRECT}: ${error.message}`)),
    );
    server.listen(PORT, "127.0.0.1");
    const timer = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for the Spotify sign-in."));
    }, SIGN_IN_TIMEOUT);
  });
}

/* ---------- Commands ---------- */

async function login() {
  basicAuth();
  const state = randomBytes(16).toString("hex");
  const authorize = new URL(`${ACCOUNTS}/authorize`);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SCOPE,
    redirect_uri: REDIRECT,
    state,
    show_dialog: "true",
  }).toString();
  const code = listenForCode(state);
  console.log(
    `Opening Spotify to approve read-only access (${SCOPE})…\nIf no browser opens, visit:\n${authorize.href}\n`,
  );
  execFile("open", [authorize.href]);

  const tokens = await token({
    grant_type: "authorization_code",
    code: await code,
    redirect_uri: REDIRECT,
  });
  save({
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    savedAt: new Date().toISOString(),
  });
  console.log(`Signed in to Spotify (scope: ${tokens.scope}) -> ${STORE}`);

  // One call first: Development Mode apps have reported 403s even with Premium.
  const page = await api(`${API}/me/shows?limit=1`, tokens.access_token);
  console.log(
    `Test call OK: ${page.total} followed show(s). Next: npm run podcasts:refresh`,
  );
}

const unescape = (text) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** The publisher: the API's when it still sends one, else the public page's. */
async function publisherOf(show) {
  if (show.publisher) return show.publisher;
  try {
    const response = await fetch(show.external_urls.spotify, {
      headers: { ...HEADERS, "Accept-Language": "en" },
    });
    if (!response.ok) return "";
    const tag = (await response.text()).match(
      /<meta[^>]+property="og:description"[^>]*>/i,
    )?.[0];
    const parts = unescape(tag?.match(/content="([^"]*)"/)?.[1] ?? "").split(
      " · ",
    );
    return parts.length >= 2 ? parts[1].trim() : "";
  } catch {
    return ""; // No publisher line under the show's name.
  }
}

/** Downloads the cover, or keeps the one on disk if that fails. */
async function coverOf(show, onDisk) {
  const image = [...(show.images ?? [])]
    .filter((candidate) => (candidate.width ?? MIN_COVER) >= MIN_COVER)
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0))[0];
  try {
    if (!image) throw new Error("no image");
    const response = await fetch(image.url, { headers: HEADERS });
    const type = (response.headers.get("content-type") ?? "").split(";")[0];
    const ext = COVER_TYPES[type.trim()];
    if (!response.ok || !ext) throw new Error(`${response.status} ${type}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) {
      throw new Error(`${bytes.length} bytes`);
    }
    const file = `${show.id}.${ext}`;
    writeFileSync(`${COVERS}${file}`, bytes);
    return file;
  } catch {
    return onDisk.get(show.id) ?? null; // None: the row shows a blank tile.
  }
}

/**
 * A PODCASTS_SHOWN entry as a show ID: the entry itself, or the ID in a
 * show link (open.spotify.com/show/<id>?si=…) or URI (spotify:show:<id>).
 * IDs name files and the embed address, so only Spotify's base62 passes.
 */
function showId(entry) {
  const id = /show[/:]([^/?#]+)/.exec(entry)?.[1] ?? entry.trim();
  if (!/^[A-Za-z0-9]+$/.test(id)) {
    fail(`PODCASTS_SHOWN: "${entry}" isn't a Spotify show ID or link.`);
  }
  return id;
}

async function refresh() {
  // Trimmed: a secret pasted with a trailing newline would be refused.
  const refreshToken = (
    process.env.SPOTIFY_REFRESH_TOKEN || load().refresh_token
  )?.trim();
  if (!refreshToken) {
    fail("No Spotify sign-in: run `npm run podcasts:login` first.");
  }
  const tokens = await token({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
    if (process.env.SPOTIFY_REFRESH_TOKEN) {
      console.warn(
        "Spotify issued a new refresh token. If later runs fail, sign in again locally and update the SPOTIFY_REFRESH_TOKEN secret.",
      );
    } else {
      save({
        refresh_token: tokens.refresh_token,
        savedAt: new Date().toISOString(),
      });
    }
  }

  const followed = [];
  for (let url = `${API}/me/shows?limit=50`; url;) {
    const page = await api(url, tokens.access_token);
    followed.push(...page.items.map((item) => item.show).filter(Boolean));
    url = page.next;
  }

  const ids = [...new Set(PODCASTS_SHOWN.map(showId))];
  if (ids.length === 0) {
    console.warn("PODCASTS_SHOWN is empty: the site will show no podcasts.");
  }
  const byId = new Map(followed.map((show) => [show.id, show]));
  const listed = [];
  for (const id of ids) {
    listed.push(
      byId.get(id) ??
        (await api(
          `${API}/shows/${encodeURIComponent(id)}`,
          tokens.access_token,
        )),
    );
  }

  mkdirSync(COVERS, { recursive: true });
  const onDisk = new Map(
    readdirSync(COVERS).map((file) => [file.replace(/\.[a-z]+$/, ""), file]),
  );
  const shows = [];
  for (const show of listed) {
    shows.push({
      id: show.id,
      name: show.name,
      publisher: await publisherOf(show),
      link: show.external_urls.spotify,
      cover: await coverOf(show, onDisk),
    });
  }

  const kept = new Set(shows.map((show) => show.cover).filter(Boolean));
  for (const file of readdirSync(COVERS)) {
    if (!kept.has(file)) rmSync(`${COVERS}${file}`);
  }

  const snapshot = {
    // The local date (en-CA formats it YYYY-MM-DD).
    fetchedAt: new Date().toLocaleDateString("en-CA"),
    source: "spotify",
    shows,
  };
  writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  const fromLibrary = ids.filter((id) => byId.has(id)).length;
  console.log(
    `${shows.length} shows (${fromLibrary} followed, ${shows.length - fromLibrary} by ID) and ${kept.size} covers -> ${OUT}`,
  );

  const unlisted = followed.filter((show) => !ids.includes(show.id));
  if (unlisted.length > 0) {
    console.log("\nFollowed on Spotify but not in PODCASTS_SHOWN:");
    for (const show of unlisted) console.log(`  "${show.id}", // ${show.name}`);
  }
}

const command = process.argv[2] ?? "refresh";
if (command === "login") await login();
else if (command === "refresh") await refresh();
else fail("Usage: node scripts/fetch-spotify-shows.mjs [login|refresh]");
