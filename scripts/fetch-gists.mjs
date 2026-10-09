#!/usr/bin/env node
/*
 * Refreshes src/data/gists.json, the snapshot of Antonio's public GitHub
 * gists behind the Blog page (pages/[...lang]/blog.astro):
 *
 *   npm run gists:refresh     (also run by `npm run blog:refresh`)
 *
 * No token needed: GitHub's REST API lists a user's public gists without
 * one (60 requests an hour; a refresh makes one per 100 gists). GITHUB_TOKEN
 * is sent when set (CI). The GitHub CLI's token isn't used: none is needed,
 * and a personal token has no business near secret gists.
 *
 * Privacy: only gists GitHub reports as public are kept, whatever the API
 * returns. Kept per gist: its link, description (the card's title; the
 * first file's name when there's none), file names, languages and dates.
 * Nothing from the files' contents, and nothing about the account.
 *
 * The API lists every public gist, so the snapshot is replaced, not merged:
 * a gist deleted or made secret leaves the site on the next refresh.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const USER = "anettodev";
const PER_PAGE = 100;
const MAX_TAGS = 3;
const MAX_TITLE = 120;
/* GitHub's default names ("gistfile1.txt") say nothing about the gist. */
const DEFAULT_NAME = /^gistfile\d+(\.\w+)?$/;
/* "Text" is GitHub's language for plain files: not worth a tag. */
const NO_LANGUAGE = new Set(["Text"]);
const OUT = fileURLToPath(new URL("../src/data/gists.json", import.meta.url));
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "anetto.dev gists refresh",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

/* ---------- Every public gist, page by page ---------- */

const listed = [];
for (let page = 1; ; page += 1) {
  const url = `https://api.github.com/users/${USER}/gists?per_page=${PER_PAGE}&page=${page}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    const limited = response.headers.get("x-ratelimit-remaining") === "0";
    fail(
      `GitHub answered ${response.status} for ${USER}'s gists${limited ? " (rate limit reached; try later or set GITHUB_TOKEN)" : ""}:`,
      (await response.text()).slice(0, 200),
    );
  }
  const batch = await response.json();
  if (!Array.isArray(batch)) fail("GitHub's gist list isn't a list:", batch);
  listed.push(...batch);
  if (batch.length < PER_PAGE) break;
}

/* ---------- What the site keeps ---------- */

const oneLine = (text = "") => text.replace(/\s+/g, " ").trim();
const clip = (text) =>
  text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1).trimEnd()}…` : text;

const gists = listed
  .filter((gist) => gist.public === true && gist.html_url)
  .map((gist) => {
    const files = Object.values(gist.files ?? {});
    const names = files
      .map((file) => file.filename)
      .filter((name) => name && !DEFAULT_NAME.test(name));
    const languages = [
      ...new Set(
        files
          .map((file) => file.language)
          .filter((language) => language && !NO_LANGUAGE.has(language)),
      ),
    ].slice(0, MAX_TAGS);
    return {
      id: gist.id,
      title: clip(oneLine(gist.description) || names[0] || "Gist"),
      files: names,
      languages,
      created: gist.created_at,
      updated: gist.updated_at,
      link: gist.html_url,
    };
  })
  .sort((a, b) => b.created.localeCompare(a.created));

const snapshot = {
  fetchedAt: new Date().toISOString().slice(0, 10),
  user: USER,
  gists,
};
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `${gists.length} public gists (of ${listed.length} listed) -> ${OUT}`,
);
