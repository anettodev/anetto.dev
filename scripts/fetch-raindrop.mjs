#!/usr/bin/env node
/*
 * Refreshes src/data/bookmarks.json, the snapshot behind the Bookmarks page
 * (pages/[...lang]/bookmarks.astro):
 *
 *   npm run bookmarks:refresh
 *
 * No token: it reads what Raindrop.io publishes anyway. The public profile
 * page (anettodev.raindrop.page) links every public collection
 * ("/<slug>-<id>"); each one's details and bookmarks come from the
 * unauthenticated endpoints Raindrop's own public pages use
 * (api.raindrop.io/v1/collection/<id>, /v1/raindrops/<id>). They aren't in
 * Raindrop's documented REST API, so if one changes the script fails loudly
 * and the committed snapshot stays as it was. The build reads only the
 * snapshot.
 *
 * Privacy: only collections marked Public in Raindrop exist on those pages,
 * so what the site shows is decided there. Of each bookmark only the title,
 * link, domain, a short excerpt, tags, date and collection are kept; notes,
 * highlights, covers and account details never reach the site.
 *
 * Site icons: each domain's icon is downloaded here, once, into
 * public/bookmarks/icons/ (DuckDuckGo's icon service, then Google's), so
 * visitors load it from anetto.dev and no third party sees them. Icons
 * already on disk are kept; icons for domains no longer listed are removed.
 * A domain without an icon gets `icon: null` and the page draws a globe.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PROFILE = "https://anettodev.raindrop.page/";
const API = "https://api.raindrop.io/v1";
const PER_PAGE = 50;
const EXCERPT = 180;
const OUT = fileURLToPath(
  new URL("../src/data/bookmarks.json", import.meta.url),
);
const HEADERS = { "User-Agent": "anetto.dev bookmarks refresh" };
const ICONS_DIR = fileURLToPath(
  new URL("../public/bookmarks/icons/", import.meta.url),
);
const ICONS_URL = "/bookmarks/icons/";
const ICON_TYPES = {
  "image/png": "png",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

async function get(path) {
  const response = await fetch(`${API}${path}`, { headers: HEADERS });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.result !== true) {
    fail(
      `Raindrop error on ${path}:`,
      `${response.status} ${JSON.stringify(body)}`,
    );
  }
  return body;
}

// The public profile links each public collection as "/<slug>-<id>".
const profile = await fetch(PROFILE, { headers: HEADERS });
if (!profile.ok) fail(`Raindrop profile ${PROFILE} answered`, profile.status);
const html = await profile.text();
const ids = [
  ...new Set(
    [...html.matchAll(/href="\/[a-z0-9-]+-(\d{5,})"/g)].map((match) =>
      Number(match[1]),
    ),
  ),
];

const excerptOf = (text) => {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > EXCERPT
    ? `${clean.slice(0, EXCERPT - 1).trimEnd()}…`
    : clean;
};

/*
 * Each public collection's bookmarks with its sub-collections' (nested);
 * a bookmark keeps the collection it actually sits in, so the chips can
 * name sub-collections ("Articles", "Tools"…).
 */
const items = new Map();
for (const id of ids) {
  for (let page = 0; ; page += 1) {
    const body = await get(
      `/raindrops/${id}?nested=true&perpage=${PER_PAGE}&page=${page}&sort=-created`,
    );
    for (const item of body.items) items.set(item._id, item);
    if (body.items.length < PER_PAGE) break;
  }
}

// The collections those bookmarks sit in; anything not public is dropped.
const collections = [];
for (const id of new Set(
  [...items.values()].map((item) => item.collectionId),
)) {
  const { item } = await get(`/collection/${id}`);
  if (item?.public === true) collections.push(item);
}
collections.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
const shown = new Set(collections.map((collection) => collection._id));

const bookmarks = [...items.values()]
  .filter((item) => shown.has(item.collectionId) && item.link)
  .map((item) => ({
    id: item._id,
    title: (item.title ?? "").trim() || item.domain || item.link,
    link: item.link,
    domain: (item.domain ?? new URL(item.link).hostname).replace(/^www\./, ""),
    excerpt: excerptOf(item.excerpt),
    tags: item.tags ?? [],
    created: item.created,
    collection: item.collectionId,
  }))
  .sort((a, b) => b.created.localeCompare(a.created));

/* ---------- Site icons ---------- */

mkdirSync(ICONS_DIR, { recursive: true });
const safe = (domain) => domain.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
const onDisk = new Map(
  readdirSync(ICONS_DIR).map((file) => [file.replace(/\.[a-z]+$/, ""), file]),
);

async function download(domain) {
  const sources = [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];
  for (const url of sources) {
    try {
      const response = await fetch(url, { headers: HEADERS });
      const type = (response.headers.get("content-type") ?? "").split(";")[0];
      const ext = ICON_TYPES[type.trim()];
      if (!response.ok || !ext) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0 || bytes.length > 100_000) continue;
      const file = `${safe(domain)}.${ext}`;
      writeFileSync(`${ICONS_DIR}${file}`, bytes);
      return file;
    } catch {
      // Network error on this source: try the next.
    }
  }
  return null;
}

const icons = new Map();
for (const domain of new Set(bookmarks.map((b) => b.domain))) {
  icons.set(domain, onDisk.get(safe(domain)) ?? (await download(domain)));
}
// Icons for domains no longer listed go.
const kept = new Set([...icons.values()].filter(Boolean));
for (const file of onDisk.values()) {
  if (!kept.has(file)) rmSync(`${ICONS_DIR}${file}`);
}
for (const bookmark of bookmarks) {
  const file = icons.get(bookmark.domain);
  bookmark.icon = file ? `${ICONS_URL}${file}` : null;
}

const snapshot = {
  // The local date (en-CA formats it YYYY-MM-DD); toISOString would give UTC's.
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  profile: PROFILE,
  collections: collections.map((collection) => ({
    id: collection._id,
    title: collection.title,
    count: bookmarks.filter((b) => b.collection === collection._id).length,
  })),
  bookmarks,
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `${bookmarks.length} bookmarks, ${kept.size} site icons, in ${collections.length} public collections (${collections.map((c) => c.title).join(", ") || "none"}) -> ${OUT}`,
);
