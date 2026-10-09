#!/usr/bin/env node
/*
 * Records site pages (VOICE_PAGES in src/lib/site.ts; About today) in
 * Antonio's cloned voice (ElevenLabs), in every language of the site: the
 * Portuguese page plays Portuguese, and so on (requested by Antonio). The
 * Listen player plays the recording of the page's own language.
 *
 *   npm run pages:audio -- [--force] [--dry-run]
 *
 * It reads the built pages (`npm run pages:audio` builds first), so the
 * text is exactly what visitors see: the <h1>, then the passages of the
 * page's `data-listen` areas, in the page's content language (its <main
 * lang>, else its <html lang>). The reading and recording are
 * scripts/lib/voice.mjs, shared with scripts/notes-audio.mjs.
 *
 * Output: public/audio/pages/<page>-<locale>.mp3 and
 * src/data/pages-audio.json ({ pages: { <page>: { <locale>: { file,
 * duration, chars, marks, hash } } } }). A page whose text, language and
 * voice haven't changed isn't sent again (--force does); recordings of
 * pages no longer listed are removed. After a recording, build again so it
 * ships. --dry-run prints the characters (about the credits).
 *
 * ELEVENLABS_API_KEY comes from the environment (Antonio's Keychain) and is
 * never printed. The voice is NOTES_VOICE_ID in src/lib/site.ts.
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

import { DEFAULT_LOCALE, LOCALES } from "../src/i18n/locales.ts";
import { NOTES_VOICE_ID, VOICE_PAGES } from "../src/lib/site.ts";
import {
  fail,
  hashOf,
  MODEL,
  pagePassagesOf,
  record,
  requestCount,
} from "./lib/voice.mjs";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = fileURLToPath(
  new URL("../src/data/pages-audio.json", import.meta.url),
);
const AUDIO_DIR = fileURLToPath(
  new URL("../public/audio/pages/", import.meta.url),
);
const PUBLIC_PATH = "/audio/pages/";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

const previous = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : { pages: {} };
const key = process.env.ELEVENLABS_API_KEY?.trim();
const voice = NOTES_VOICE_ID.trim();
if (!dryRun && !key) fail("Set ELEVENLABS_API_KEY first.");
if (!dryRun && !voice) fail("Set NOTES_VOICE_ID in src/lib/site.ts first.");

const result = { model: MODEL, voice, pages: {} };
let totalChars = 0;
mkdirSync(AUDIO_DIR, { recursive: true });

for (const page of VOICE_PAGES) {
  result.pages[page] = {};
  for (const locale of LOCALES) {
    const built = `${DIST}${locale === DEFAULT_LOCALE ? "" : `${locale}/`}${page}/index.html`;
    if (!existsSync(built))
      fail(`No built page ${built}: run npm run build first.`);
    const html = readFileSync(built, "utf8");
    const tag =
      html.match(/<main\b[^>]*\slang="([^"]+)"/i)?.[1] ??
      html.match(/<html\b[^>]*\slang="([^"]+)"/i)?.[1] ??
      locale;
    const lang = tag.toLowerCase().split("-")[0];
    const passages = pagePassagesOf(html);
    if (passages.length < 2) {
      fail(`${page} (${locale}): no data-listen text found in ${built}.`);
    }
    const chars = passages.reduce((sum, passage) => sum + passage.length, 0);
    const hash = hashOf({ voice, model: MODEL, lang, passages });
    const name = `${page}-${locale}.mp3`;
    const kept = previous.pages?.[page]?.[locale];
    const fresh = kept?.hash === hash && existsSync(`${AUDIO_DIR}${name}`);
    if (fresh && !force) {
      result.pages[page][locale] = kept;
      console.log(`= ${page} (${locale}): unchanged (${chars} chars)`);
      continue;
    }
    totalChars += chars;
    console.log(
      `${kept ? "~" : "+"} ${page} (${locale}): ${chars} chars in ${requestCount(passages)} request(s), ${lang}`,
    );
    if (dryRun) continue;

    const { buffer, seconds, marks } = await record({
      key,
      voice,
      lang,
      passages,
    });
    writeFileSync(`${AUDIO_DIR}${name}`, buffer);
    result.pages[page][locale] = {
      hash,
      file: `${PUBLIC_PATH}${name}`,
      duration: Math.round(seconds * 10) / 10,
      chars,
      marks,
    };
    console.log(`  -> ${PUBLIC_PATH}${name}, ${Math.round(seconds)}s`);
  }
}

if (dryRun) {
  console.log(
    `\nDry run: ${totalChars} characters to send (≈ ${totalChars} credits on ${MODEL}). Nothing was called.`,
  );
  process.exit(0);
}

// Recordings of pages no longer listed go.
const keep = new Set(
  Object.values(result.pages)
    .flatMap((byLocale) => Object.values(byLocale))
    .map((entry) => entry.file.split("/").pop()),
);
for (const file of readdirSync(AUDIO_DIR)) {
  if (!keep.has(file)) rmSync(`${AUDIO_DIR}${file}`);
}
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `\n${keep.size} page recording(s), ${totalChars} characters sent -> ${OUT}. Build again so they ship.`,
);
