#!/usr/bin/env node
/*
 * The site's favicons and touch icons, made from the app-icon logo
 * (src/assets/brand/logo-dark.png, 1024px, rounded corners transparent):
 *
 *   npm run icons
 *
 * Re-run it when that master changes; don't hand-make the icons.
 *
 *   favicon-16x16.png, favicon-32x32.png, favicon.ico (16/32/48)
 *       a tighter crop (9% off each side, corners rounded again) so the
 *       mark stays legible at tab size
 *   apple-touch-icon.png (180)
 *       the whole icon, square and opaque: iOS rounds it itself, so the
 *       corners are filled with the icon's own background
 *   android-chrome-192x192.png, android-chrome-512x512.png
 *       the whole icon with its rounded corners
 *
 * The dark icon is used everywhere: its own tile reads on light and dark
 * browser chrome alike.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const SOURCE = fileURLToPath(
  new URL("../src/assets/brand/logo-dark.png", import.meta.url),
);
const OUT = fileURLToPath(new URL("../public/", import.meta.url));
/* The icon's background, measured from the master (22, 30, 36). */
const TILE = "#161e24";
const CROP = 0.09;
const RADIUS = 0.22;

const { width: size = 1024 } = await sharp(SOURCE).metadata();
const inset = Math.round(size * CROP);
const side = size - 2 * inset;
const radius = Math.round(side * RADIUS);
const mask = Buffer.from(
  `<svg width="${side}" height="${side}"><rect width="${side}" height="${side}" rx="${radius}" ry="${radius}"/></svg>`,
);
const tight = await sharp(
  await sharp(SOURCE)
    .extract({ left: inset, top: inset, width: side, height: side })
    .flatten({ background: TILE })
    .png()
    .toBuffer(),
)
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

const png = (input, n) =>
  sharp(input)
    .resize(n, n, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();

/* An .ico holding PNG-encoded images, one directory entry each. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size: n, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(n, 0);
    entry.writeUInt8(n, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

writeFileSync(`${OUT}favicon-16x16.png`, await png(tight, 16));
writeFileSync(`${OUT}favicon-32x32.png`, await png(tight, 32));
writeFileSync(
  `${OUT}favicon.ico`,
  ico(
    await Promise.all(
      [16, 32, 48].map(async (n) => ({ size: n, data: await png(tight, n) })),
    ),
  ),
);
writeFileSync(
  `${OUT}apple-touch-icon.png`,
  await png(await sharp(SOURCE).flatten({ background: TILE }).toBuffer(), 180),
);
writeFileSync(`${OUT}android-chrome-192x192.png`, await png(SOURCE, 192));
writeFileSync(`${OUT}android-chrome-512x512.png`, await png(SOURCE, 512));
console.log(`Icons written to ${OUT}`);
