#!/usr/bin/env node
/*
 * Refreshes src/data/medium.json, the snapshot of Antonio's Medium stories
 * behind the Blog page (pages/[...lang]/blog.astro):
 *
 *   npm run blog:refresh
 *
 * No token: it reads Medium's public RSS feed (medium.com/feed/@<handle>).
 * Medium's API has no way to list a writer's posts, so the feed is the
 * route. The build reads only the snapshot.
 *
 * The feed lists only the latest ten stories, so each refresh merges into
 * the snapshot by link: stories already captured stay after they scroll out
 * of the feed. Responses aren't in the feed; members-only stories are, as a
 * preview (the card links to Medium either way).
 *
 * Kept per story: title, link (without Medium's tracking query), date, up
 * to three tags, a short excerpt (the first paragraph) and the first image
 * as its cover. Covers are downloaded once into src/assets/medium/ and
 * served from the site, optimised by Astro, so visitors never load images
 * from Medium; covers of stories no longer in the snapshot are removed.
 *
 * Testing: MEDIUM_FEED_FILE=<file> reads a saved feed instead of fetching.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

const HANDLE = "anettodev";
const FEED = `https://medium.com/feed/@${HANDLE}`;
const PROFILE = `https://medium.com/@${HANDLE}`;
const EXCERPT = 200;
const MAX_TAGS = 3;
const MAX_COVER_BYTES = 5_000_000;
const HEADERS = { "User-Agent": "anetto.dev blog refresh" };
const OUT = fileURLToPath(new URL("../src/data/medium.json", import.meta.url));
const COVERS = fileURLToPath(new URL("../src/assets/medium/", import.meta.url));
const COVER_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

/* ---------- The feed ---------- */

let xml;
if (process.env.MEDIUM_FEED_FILE) {
  xml = readFileSync(process.env.MEDIUM_FEED_FILE, "utf8");
} else {
  const response = await fetch(FEED, { headers: HEADERS });
  if (!response.ok) fail(`Medium feed ${FEED} answered`, response.status);
  xml = await response.text();
}
if (!xml.includes("<rss")) fail("Medium feed isn't RSS:", xml.slice(0, 200));

const unwrap = (text = "") =>
  text.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1").trim();
const entities = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
/*
 * A paragraph's text: inline tags (links, emphasis) go without a trace, so
 * no space lands before punctuation; line breaks become spaces.
 */
const textOf = (html) =>
  entities(html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
/* The story's first real image: Medium ends every item with a 1×1 stats pixel. */
const imageOf = (html) =>
  [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
    .map((match) => match[1])
    .find((src) => !src.includes("/_/stat")) ?? null;
const field = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? unwrap(match[1]) : "";
};
const excerptOf = (html) => {
  // The first paragraph with words in it; Medium starts many stories with
  // the title again as an <h3> or a figure, which don't count.
  const paragraph = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => textOf(match[1]))
    .find((text) => text.length > 0);
  const text = paragraph ?? textOf(html.replace(/<\/(p|h\d|li|figure)>/g, " "));
  return text.length > EXCERPT
    ? `${text.slice(0, EXCERPT - 1).trimEnd()}…`
    : text;
};

const fromFeed = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
  ([, item]) => {
    const link = new URL(field(item, "link"));
    link.search = "";
    const html = field(item, "content:encoded");
    return {
      id: field(item, "guid") || link.href,
      title: entities(field(item, "title")),
      link: link.href,
      date: new Date(field(item, "pubDate")).toISOString(),
      tags: [...item.matchAll(/<category>([\s\S]*?)<\/category>/g)]
        .map(([, tag]) => entities(unwrap(tag)))
        .slice(0, MAX_TAGS),
      excerpt: excerptOf(html),
      image: imageOf(html),
    };
  },
);

/* ---------- Merge with what earlier refreshes saved ---------- */

const previous = existsSync(OUT)
  ? (JSON.parse(readFileSync(OUT, "utf8")).posts ?? [])
  : [];
const byLink = new Map(previous.map((post) => [post.link, post]));
for (const post of fromFeed) {
  byLink.set(post.link, { ...byLink.get(post.link), ...post });
}

/* ---------- Covers ---------- */

mkdirSync(COVERS, { recursive: true });
const slug = (link) =>
  (new URL(link).pathname.split("/").filter(Boolean).at(-1) ?? "post")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(-80);
const onDisk = new Map(
  readdirSync(COVERS).map((file) => [file.replace(/\.[a-z]+$/, ""), file]),
);

async function download(url, name) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    const type = (response.headers.get("content-type") ?? "").split(";")[0];
    const ext = COVER_TYPES[type.trim()];
    if (!response.ok || !ext) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_COVER_BYTES) return null;
    const file = `${name}.${ext}`;
    writeFileSync(`${COVERS}${file}`, bytes);
    return file;
  } catch {
    return null; // No cover: the card shows its placeholder.
  }
}

const posts = [];
for (const post of byLink.values()) {
  const name = slug(post.link);
  const cover =
    onDisk.get(name) ?? (post.image ? await download(post.image, name) : null);
  const { image, ...rest } = post;
  posts.push({ ...rest, image: image ?? null, cover });
}
posts.sort((a, b) => b.date.localeCompare(a.date));

const kept = new Set(posts.map((post) => post.cover).filter(Boolean));
for (const file of onDisk.values()) {
  if (!kept.has(file)) rmSync(`${COVERS}${file}`);
}

const snapshot = {
  // The local date (en-CA formats it YYYY-MM-DD).
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  profile: PROFILE,
  feed: FEED,
  posts,
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `${fromFeed.length} stories in the feed, ${posts.length} in the snapshot, ${kept.size} covers -> ${OUT}`,
);
