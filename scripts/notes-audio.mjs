#!/usr/bin/env node
/*
 * Generates the audio of Antonio's notes in his cloned voice (ElevenLabs):
 * the Listen player's first choice (ListenButton.astro). Notes without
 * audio are read by the visitor's device instead.
 *
 *   npm run notes:audio -- [--add <slug>,…] [--remove <slug>,…]
 *                          [--force] [--dry-run]
 *
 * No note gets a recording by default (Antonio's choice): one is made only
 * for a note added with --add (the publish-notes command asks him, note by
 * note). A note with a recording is in src/data/notes-audio.json, and stays
 * there: when its text changes it's recorded again. --remove takes a
 * recording away; --force records the listed notes again anyway.
 *
 * For each note in src/data/evernote.json it records the passages the
 * player highlights, in the note's language, into
 * public/audio/notes/<slug>.mp3 (the reading and recording: scripts/lib/
 * voice.mjs, shared with scripts/pages-audio.mjs).
 *
 * src/data/notes-audio.json records each note's file, duration, passage
 * times and a hash of its text, voice and model: unchanged notes aren't
 * sent again (--force does), and audio of notes no longer listed is
 * removed. --dry-run prints the characters (about the credits) and calls
 * nothing.
 *
 * ELEVENLABS_API_KEY comes from the environment (Antonio's Keychain; a key
 * limited to text-to-speech). It travels in the xi-api-key header and is
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

import { NOTES_VOICE_ID } from "../src/lib/site.ts";
import {
  fail,
  hashOf,
  MODEL,
  passagesOf,
  record,
  requestCount,
  tidy,
} from "./lib/voice.mjs";

const NOTES = fileURLToPath(
  new URL("../src/data/evernote.json", import.meta.url),
);
const OUT = fileURLToPath(
  new URL("../src/data/notes-audio.json", import.meta.url),
);
const AUDIO_DIR = fileURLToPath(
  new URL("../public/audio/notes/", import.meta.url),
);
const PUBLIC_PATH = "/audio/notes/";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
/** The slugs after a flag: `--add a,b` or `--add a --add b`. */
const slugsAfter = (flag) =>
  new Set(
    args
      .flatMap((arg, i) => (arg === flag ? (args[i + 1] ?? "").split(",") : []))
      .map((slug) => slug.trim())
      .filter(Boolean),
  );
const added = slugsAfter("--add");
const removed = slugsAfter("--remove");

/* ---------- Run ---------- */

const { notes = [] } = JSON.parse(readFileSync(NOTES, "utf8"));
const previous = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : { notes: {} };
const key = process.env.ELEVENLABS_API_KEY?.trim();
const voice = NOTES_VOICE_ID.trim();
if (!dryRun && !key) fail("Set ELEVENLABS_API_KEY first.");
if (!dryRun && !voice) fail("Set NOTES_VOICE_ID in src/lib/site.ts first.");

const slugs = new Set(notes.map((note) => note.slug));
for (const slug of [...added, ...removed]) {
  if (!slugs.has(slug)) fail(`No note "${slug}".`);
}

const result = { model: MODEL, voice, notes: {} };
let totalChars = 0;
mkdirSync(AUDIO_DIR, { recursive: true });

for (const note of notes) {
  const recorded = Boolean(previous.notes?.[note.slug]);
  if (removed.has(note.slug) || (!recorded && !added.has(note.slug))) {
    console.log(
      removed.has(note.slug) && recorded
        ? `- ${note.slug}: recording removed`
        : `· ${note.slug}: no recording (--add ${note.slug} to make one)`,
    );
    continue;
  }
  const passages = [tidy(note.title), ...passagesOf(note.html)];
  const chars = passages.reduce((sum, passage) => sum + passage.length, 0);
  const lang = (note.lang || "en").split("-")[0];
  const hash = hashOf({ voice, model: MODEL, lang, passages });
  const kept = previous.notes?.[note.slug];
  const fileOnDisk = existsSync(`${AUDIO_DIR}${note.slug}.mp3`);
  const fresh = kept?.hash === hash && fileOnDisk;

  if (fresh && !force) {
    result.notes[note.slug] = kept;
    console.log(`= ${note.slug}: unchanged (${chars} chars)`);
    continue;
  }
  totalChars += chars;
  console.log(
    `${kept ? "~" : "+"} ${note.slug}: ${chars} chars in ${requestCount(passages)} request(s), ${lang}`,
  );
  if (dryRun) continue;

  const { buffer, seconds, marks } = await record({
    key,
    voice,
    lang,
    passages,
  });
  const file = `${note.slug}.mp3`;
  writeFileSync(`${AUDIO_DIR}${file}`, buffer);
  result.notes[note.slug] = {
    hash,
    file: `${PUBLIC_PATH}${file}`,
    duration: Math.round(seconds * 10) / 10,
    chars,
    marks,
  };
  console.log(`  -> ${PUBLIC_PATH}${file}, ${Math.round(seconds)}s`);
}

if (dryRun) {
  console.log(
    `\nDry run: ${totalChars} characters to send (≈ ${totalChars} credits on eleven_multilingual_v2). Nothing was called.`,
  );
  process.exit(0);
}

// Audio of notes no longer in the snapshot goes.
const keep = new Set(
  Object.values(result.notes).map((entry) => entry.file.split("/").pop()),
);
for (const file of readdirSync(AUDIO_DIR)) {
  if (!keep.has(file)) rmSync(`${AUDIO_DIR}${file}`);
}
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `\n${Object.keys(result.notes).length} note(s) with audio, ${totalChars} characters sent -> ${OUT}`,
);
