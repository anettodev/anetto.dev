/*
 * Antonio's cloned voice (ElevenLabs), shared by scripts/notes-audio.mjs
 * (Evernote notes) and scripts/pages-audio.mjs (site pages such as About).
 *
 * The text read is the passages the Listen player highlights
 * (scripts/listen-button.ts): the page's title, then each outermost
 * heading, paragraph, list item and quote, never code. They're sent in
 * requests of up to about 2,000 characters to
 * POST /v1/text-to-speech/{voice}/with-timestamps (eleven_multilingual_v2,
 * mp3_44100_64, the language's code), stitched with up to three previous
 * request ids so the voice flows on. The MP3 parts are joined frame by
 * frame, and each passage's start time is kept for the highlight.
 *
 * The key travels in the xi-api-key header and is never printed.
 */
import { createHash } from "node:crypto";

const API = "https://api.elevenlabs.io/v1";
export const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_64";
const MAX_REQUEST = 2000;

export function fail(message, detail) {
  console.error(message, detail ?? "");
  process.exit(1);
}

/* ---------- The passages, as the player sees them ---------- */

const BLOCKS = new Set(["h2", "h3", "h4", "p", "li", "blockquote"]);
const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "wbr"]);
/** Inline elements: closing one inside a passage adds no space ("Inter</a>," reads "Inter,"). */
const INLINE = new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "del",
  "dfn",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
]);

const decode = (text) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
export const tidy = (text) => decode(text).replace(/\s+/g, " ").trim();

/** Code that isn't text to read: scripts, styles and the like go first. */
const withoutCode = (html) =>
  html.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, "");

/**
 * The outermost, non-empty text blocks of some well-formed HTML, in order:
 * the same list scripts/listen-button.ts builds from the rendered page.
 * SVG (icons, flags) and code blocks are skipped. With `region`, only
 * blocks inside an element carrying that attribute count (data-listen).
 */
export function passagesOf(html, { region } = {}) {
  const has = region ? new RegExp(`\\s${region}(?=[\\s=>/]|$)`) : null;
  const passages = [];
  const stack = [];
  let capture = null;
  let inRegion = region ? 0 : 1;
  let inSvg = 0;
  const inPre = () => stack.some((entry) => entry.tag === "pre");
  for (const [, slash, name, rest, text] of withoutCode(html).matchAll(
    /<(\/?)([a-z][a-z0-9-]*)([^>]*)>|([^<]+)/gi,
  )) {
    if (text !== undefined) {
      if (capture && !inSvg && !inPre()) capture.text += text;
      continue;
    }
    const tag = name.toLowerCase();
    if (!slash) {
      if (VOID.has(tag) || /\/\s*$/.test(rest)) {
        if (tag === "br" && capture) capture.text += " ";
        continue;
      }
      const entry = { tag, region: Boolean(has?.test(rest)) };
      if (!capture && inRegion + (entry.region ? 1 : 0) > 0 && !inSvg) {
        if (BLOCKS.has(tag) && !inPre()) {
          capture = { depth: stack.length + 1, text: "" };
        }
      }
      stack.push(entry);
      if (entry.region) inRegion++;
      if (tag === "svg") inSvg++;
      continue;
    }
    let at = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tag === tag) {
        at = i;
        break;
      }
    }
    if (at === -1) continue;
    for (const entry of stack.slice(at)) {
      if (entry.region) inRegion--;
      if (entry.tag === "svg") inSvg--;
    }
    stack.length = at;
    if (capture && stack.length < capture.depth) {
      const passage = tidy(capture.text);
      if (passage) passages.push(passage);
      capture = null;
    } else if (capture && !INLINE.has(tag)) {
      capture.text += " ";
    }
  }
  return passages;
}

/** A built page's title (its <h1>) and the passages of its data-listen areas. */
export function pagePassagesOf(html) {
  const h1 = withoutCode(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
  const title = tidy(
    h1.replace(/<svg\b[\s\S]*?<\/svg>/gi, "").replace(/<[^>]+>/g, " "),
  );
  return [
    ...(title ? [title] : []),
    ...passagesOf(html, { region: "data-listen" }),
  ];
}

/** A short hash of what a recording depends on, to skip unchanged ones. */
export const hashOf = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

/** Passages into requests of at most MAX_REQUEST characters, each passage whole. */
function requestsOf(passages) {
  const requests = [];
  passages.forEach((passage, index) => {
    const last = requests.at(-1);
    if (last && last.text.length + 2 + passage.length <= MAX_REQUEST) {
      last.starts.push({ index, offset: last.text.length + 2 });
      last.text += `\n\n${passage}`;
    } else {
      requests.push({ text: passage, starts: [{ index, offset: 0 }] });
    }
  });
  return requests;
}

export const requestCount = (passages) => requestsOf(passages).length;

/* ---------- MP3 frames: duration and joining ---------- */

const V1_L3 = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
];
const V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

/**
 * The MPEG audio frames of an MP3: an ID3 tag is skipped, and a Xing/Info
 * frame (which states one part's length) is dropped, so joined parts
 * report the right duration.
 */
function framesOf(buffer) {
  let i = 0;
  if (buffer.subarray(0, 3).toString("latin1") === "ID3") {
    i =
      10 +
      (((buffer[6] & 0x7f) << 21) |
        ((buffer[7] & 0x7f) << 14) |
        ((buffer[8] & 0x7f) << 7) |
        (buffer[9] & 0x7f));
  }
  const frames = [];
  let seconds = 0;
  while (i + 4 <= buffer.length) {
    const b1 = buffer[i + 1];
    const b2 = buffer[i + 2];
    if (buffer[i] !== 0xff || (b1 & 0xe0) !== 0xe0) {
      i++;
      continue;
    }
    const version = (b1 >> 3) & 3; // 3 MPEG-1, 2 MPEG-2, 0 MPEG-2.5
    const layer = (b1 >> 1) & 3; // 1 Layer III
    const bitrateIndex = b2 >> 4;
    const rateIndex = (b2 >> 2) & 3;
    if (
      version === 1 ||
      layer !== 1 ||
      bitrateIndex === 0 ||
      bitrateIndex === 15 ||
      rateIndex === 3
    ) {
      i++;
      continue;
    }
    const mpeg1 = version === 3;
    const bitrate = (mpeg1 ? V1_L3 : V2_L3)[bitrateIndex] * 1000;
    const rate =
      [44100, 48000, 32000][rateIndex] / (mpeg1 ? 1 : version === 2 ? 2 : 4);
    const length =
      Math.floor(((mpeg1 ? 144 : 72) * bitrate) / rate) + ((b2 >> 1) & 1);
    const frame = buffer.subarray(i, i + length);
    const tag = frame.subarray(0, 64).toString("latin1");
    if (!(frames.length === 0 && /Xing|Info|VBRI/.test(tag))) {
      frames.push(frame);
      seconds += (mpeg1 ? 1152 : 576) / rate;
    }
    i += length;
  }
  return { frames, seconds };
}

/* ---------- ElevenLabs ---------- */

async function speak(key, voice, body, attempt = 0) {
  const response = await fetch(
    `${API}/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=${FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (response.status === 429 && attempt < 3) {
    const wait =
      Number(response.headers.get("retry-after")) || 5 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    return speak(key, voice, body, attempt + 1);
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = json.detail ?? {};
    fail(
      `ElevenLabs answered ${response.status}:`,
      `${detail.message ?? detail.status ?? JSON.stringify(detail).slice(0, 200)}`,
    );
  }
  return { ...json, requestId: response.headers.get("request-id") };
}

/** A passage's start in its request: the first character at or after its offset. */
function startOf(alignment, offset, fallback) {
  const times = alignment?.character_start_times_seconds;
  if (!times?.length) return fallback;
  return times[Math.min(offset, times.length - 1)] ?? fallback;
}

/**
 * Records passages in the voice: the joined MP3, its length in seconds,
 * and each passage's start time.
 */
export async function record({ key, voice, lang, passages }) {
  const marks = new Array(passages.length).fill(0);
  const frames = [];
  const ids = [];
  let offset = 0;
  for (const request of requestsOf(passages)) {
    const answer = await speak(key, voice, {
      text: request.text,
      model_id: MODEL,
      language_code: lang,
      ...(ids.length && { previous_request_ids: ids.slice(-3) }),
    });
    if (answer.requestId) ids.push(answer.requestId);
    const part = framesOf(Buffer.from(answer.audio_base64 ?? "", "base64"));
    for (const { index, offset: at } of request.starts) {
      const share = at / Math.max(request.text.length, 1);
      marks[index] =
        Math.round(
          (offset + startOf(answer.alignment, at, share * part.seconds)) * 100,
        ) / 100;
    }
    frames.push(...part.frames);
    offset += part.seconds;
  }
  return { buffer: Buffer.concat(frames), seconds: offset, marks };
}
