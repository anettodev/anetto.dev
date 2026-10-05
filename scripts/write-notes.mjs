#!/usr/bin/env node
/*
 * Writes src/data/evernote.json, the snapshot of Antonio's Evernote notes
 * shown on the Blog page (cards) and at /blog/<slug>/ (one page per note),
 * and the notes' images in src/assets/notes/<slug>/.
 *
 *   npm run notes:write -- <export.json>
 *
 * Evernote no longer issues API keys and its MCP server only lets known
 * apps sign in, so a script can't fetch the notes itself. Instead, in a
 * Claude Code session with the claude.ai Evernote connector, Claude reads
 * the notes tagged `anetto.dev` (read-only) and saves them to an export
 * file; this script turns that file into the snapshot. The build reads only
 * the snapshot. See DECISIONS.md, "Evernote notes".
 *
 * The export:
 *   { "notes": [{ id, title, created, updated, tags[], content, format,
 *                 lang?, images?: [{ hash, mime?, data? | file? | url?,
 *                                    alt? }] }] }
 *   format   "html" (or ENML), "markdown" or "text"
 *   images   the note's attachments: `data` base64, a local `file`, or a
 *            `url`; content refers to them by `hash` (ENML <en-media>, or
 *            `attachment:<hash>` as an image source). Images in the content
 *            by data: or https: URL work too. `alt` describes the image.
 *
 * Language: a `lang-en`, `lang-pt` or `lang-es` tag on the note (Antonio's
 * way to mark it), else the export's `lang`, else English. The note page is
 * marked with it, and its card shows it where it differs from the page's.
 *
 * Images: each is converted once to WebP (at most 1600px wide) and kept
 * with the site, so visitors load nothing from Evernote; the note page and
 * its card cover (the first image) are optimised further by Astro. Images
 * of notes no longer in the snapshot are removed.
 *
 * Safety: a note's content becomes HTML through an allowlist (headings,
 * paragraphs, lists, links, emphasis, code, quotes, tables); scripts,
 * styles, iframes, forms and Evernote's own markup are dropped, links get
 * rel="noopener", and images come back only as the site's own files. Only
 * notes tagged `anetto.dev` are kept, so an export with anything else in it
 * can't publish it.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

const TAG = "anetto.dev";
const LANGS = ["en", "pt", "es"];
const EXCERPT = 200;
const MAX_TAGS = 3;
const IMAGE_WIDTH = 1600;
const MAX_IMAGE_BYTES = 20_000_000;
const OUT = fileURLToPath(
  new URL("../src/data/evernote.json", import.meta.url),
);
const ASSETS = fileURLToPath(new URL("../src/assets/notes/", import.meta.url));

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run notes:write -- <export.json>");
  process.exit(1);
}
const source = JSON.parse(readFileSync(file, "utf8"));

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
const attrOf = (tag, name) =>
  tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
  tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i"))?.[1];
const unescapeAttr = (text = "") =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/* The note's content as HTML, before cleaning. */
function htmlOf(note) {
  const content = String(note.content ?? "");
  if (note.format === "markdown") {
    return marked.parse(content, { async: false });
  }
  if (note.format === "text") {
    return content
      .split(/\n{2,}/)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  }
  // HTML or ENML: the body without Evernote's wrapper.
  return content
    .replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?en-note[^>]*>/gi, "");
}

const clean = (html) =>
  sanitizeHtml(html, {
    allowedTags: [
      "div",
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "strong",
      "b",
      "em",
      "i",
      "s",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: { a: ["href", "rel"] },
    allowedSchemes: ["https", "http", "mailto"],
    // A note's own title is the page's <h1>: its headings start at <h2>.
    transformTags: {
      h1: "h2",
      h5: "h4",
      h6: "h4",
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }),
    },
    exclusiveFilter: (frame) =>
      ["p", "li", "h2", "h3", "h4"].includes(frame.tag) &&
      !frame.text.trim() &&
      !frame.text.includes("@@NOTE-IMAGE-"),
  });

/*
 * Evernote writes each line as a <div> (a blank line is <div><br></div>),
 * sometimes nested. Innermost first: a div holding only inline content
 * becomes a paragraph, one wrapping blocks is unwrapped, and paragraphs
 * left empty go. (The cleaner already stripped the divs' attributes.)
 */
const BLOCK = /<(?:p|h[2-4]|ul|ol|table|pre|blockquote|hr)\b/;
const INNERMOST_DIV = /<div>((?:(?!<\/?div>)[\s\S])*)<\/div>/;
function paragraphsFromDivs(html) {
  let out = html;
  while (INNERMOST_DIV.test(out)) {
    out = out.replace(INNERMOST_DIV, (_, inner) =>
      BLOCK.test(inner) ? inner : `<p>${inner}</p>`,
    );
  }
  return out.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, "");
}

/* A link whose address was removed (e.g. `javascript:`) becomes plain text. */
const unwrapDeadLinks = (html) =>
  html.replace(/<a(?![^>]*\bhref=)[^>]*>([\s\S]*?)<\/a>/g, "$1");

const textOf = (html) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const excerptOf = (html) => {
  const paragraph = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((match) => textOf(match[1]))
    .find((text) => text.length > 0);
  const text = paragraph ?? textOf(html);
  return text.length > EXCERPT
    ? `${text.slice(0, EXCERPT - 1).trimEnd()}…`
    : text;
};

/* A URL-safe slug from the title, unique among the notes. */
const taken = new Set();
function slugOf(title, id) {
  const base =
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || `note-${String(id).slice(0, 8)}`;
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

const iso = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/* ---------- Images ---------- */

/*
 * Every image reference in the content (<en-media>, <img>) becomes a token
 * the cleaning leaves alone; each token comes back as a site-local image.
 */
function takeImages(html) {
  const refs = [];
  const token = (ref) => {
    refs.push(ref);
    return ` @@NOTE-IMAGE-${refs.length - 1}@@ `;
  };
  const out = html
    .replace(/<en-media\b[^>]*?(?:\/>|>[\s\S]*?<\/en-media>)/gi, (tag) =>
      /^image\//i.test(attrOf(tag, "type") ?? "image/")
        ? token({ hash: attrOf(tag, "hash"), alt: attrOf(tag, "alt") })
        : "",
    )
    .replace(/<img\b[^>]*>/gi, (tag) => {
      const src = unescapeAttr(attrOf(tag, "src"));
      const alt = unescapeAttr(attrOf(tag, "alt"));
      return src.startsWith("attachment:")
        ? token({ hash: src.slice("attachment:".length), alt })
        : token({ src, alt });
    });
  return { html: out, refs };
}

async function bytesOf(ref, note) {
  const attachment = ref.hash
    ? (note.images ?? []).find((image) => image.hash === ref.hash)
    : undefined;
  const src = ref.src ?? attachment?.url;
  if (attachment?.data) return Buffer.from(attachment.data, "base64");
  if (attachment?.file) return readFileSync(attachment.file);
  if (src?.startsWith("data:")) {
    const [, data = ""] = src.split(",", 2);
    return Buffer.from(
      data,
      /;base64$/.test(src.split(",")[0]) ? "base64" : "utf8",
    );
  }
  if (src && /^https?:\/\//.test(src)) {
    const response = await fetch(src, {
      headers: { "User-Agent": "anetto.dev notes" },
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }
  return null;
}

/* Saves one image as WebP in the note's folder; returns its file name. */
async function saveImage(bytes, slug, index) {
  if (!bytes || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    return null;
  }
  try {
    const webp = await sharp(bytes, { animated: false })
      .rotate()
      // Transparent images (diagrams, logos) on white, readable in both themes.
      .flatten({ background: "#ffffff" })
      .resize({ width: IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const id = createHash("sha256").update(webp).digest("hex").slice(0, 10);
    const name = `${String(index + 1).padStart(2, "0")}-${id}.webp`;
    mkdirSync(`${ASSETS}${slug}`, { recursive: true });
    writeFileSync(`${ASSETS}${slug}/${name}`, webp);
    return name;
  } catch {
    return null; // Not an image sharp can read: left out.
  }
}

/* ---------- The notes ---------- */

const langOf = (note) => {
  const tagged = (note.tags ?? [])
    .map((tag) => tag.match(/^lang-([a-z]{2})$/i)?.[1]?.toLowerCase())
    .find((lang) => LANGS.includes(lang));
  if (tagged) return tagged;
  const given = String(note.lang ?? "")
    .toLowerCase()
    .slice(0, 2);
  return LANGS.includes(given) ? given : "en";
};

const tagged = (source.notes ?? [])
  .filter((note) => (note.tags ?? []).includes(TAG))
  .map((note) => ({
    note,
    updated: iso(note.updated) ?? iso(note.created),
  }))
  .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));

const notes = [];
const kept = new Map(); // slug -> image files used
for (const { note, updated } of tagged) {
  const title = String(note.title ?? "").trim() || "Untitled";
  const slug = slugOf(title, note.id);
  const { html: withTokens, refs } = takeImages(htmlOf(note));

  const images = [];
  for (const [index, ref] of refs.entries()) {
    const name = await saveImage(await bytesOf(ref, note), slug, index);
    const attachment = ref.hash
      ? (note.images ?? []).find((image) => image.hash === ref.hash)
      : undefined;
    images.push(
      name ? { name, alt: (ref.alt || attachment?.alt || "").trim() } : null,
    );
  }
  kept.set(slug, new Set(images.filter(Boolean).map((image) => image.name)));

  const html = unwrapDeadLinks(paragraphsFromDivs(clean(withTokens)))
    // Spaces around an image stay (it may sit inside a sentence).
    .replace(/(\s*)@@NOTE-IMAGE-(\d+)@@(\s*)/g, (_, before, index, after) => {
      const image = images[Number(index)];
      const space = (text) => (text ? " " : "");
      return image
        ? `${space(before)}<img data-asset="${slug}/${image.name}" alt="${escapeHtml(image.alt)}">${space(after)}`
        : space(before && after);
    })
    // A paragraph that only held a dropped image goes too.
    .replace(/<p>\s*<\/p>/g, "");

  const first = images.find(Boolean);
  notes.push({
    slug,
    id: String(note.id),
    title,
    lang: langOf(note),
    created: iso(note.created),
    updated,
    tags: (note.tags ?? [])
      .filter((tag) => tag !== TAG && !/^lang-[a-z]{2}$/i.test(tag))
      .slice(0, MAX_TAGS),
    excerpt: excerptOf(html),
    cover: first ? `${slug}/${first.name}` : null,
    html,
  });
}

/* Images of notes (or of note versions) no longer published go. */
if (existsSync(ASSETS)) {
  for (const folder of readdirSync(ASSETS)) {
    const keep = kept.get(folder);
    if (!keep) {
      rmSync(`${ASSETS}${folder}`, { recursive: true, force: true });
      continue;
    }
    for (const name of readdirSync(`${ASSETS}${folder}`)) {
      if (!keep.has(name)) rmSync(`${ASSETS}${folder}/${name}`);
    }
  }
}

const skipped = (source.notes ?? []).length - notes.length;
const snapshot = {
  // The local date (en-CA formats it YYYY-MM-DD).
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  tag: TAG,
  notes,
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
const imageCount = [...kept.values()].reduce((n, set) => n + set.size, 0);
console.log(
  `${notes.length} notes tagged ${TAG}, ${imageCount} images${skipped ? ` (${skipped} without the tag skipped)` : ""} -> ${OUT}`,
);
