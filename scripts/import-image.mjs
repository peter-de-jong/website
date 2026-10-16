#!/usr/bin/env node
// Turns any image into the site's final photo variants, using the same rules as /beheer:
// auto-rotate from EXIF, max 2400 px long edge, metadata (incl. GPS) stripped,
// WebP at 800/1600/2400 px (long edge; smaller originals keep their own size as the
// largest variant) with a content-hashed name.
//
// Usage: npm run import-image -- <file> <project-id> [alt text]
// Prints the image object to paste into the project's JSON.

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const WIDTHS = [800, 1600, 2400];
const QUALITY = 82;

const [file, projectId, ...altWords] = process.argv.slice(2);
if (!file || !projectId) {
  console.error('Usage: npm run import-image -- <file> <project-id> [alt text]');
  process.exit(1);
}

// Normalise once into a 2400 px master (rotate() applies EXIF orientation; sharp drops
// metadata unless asked to keep it).
const master = await sharp(file, { limitInputPixels: false })
  .rotate()
  .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
  .toBuffer({ resolveWithObject: true });
const { width, height } = master.info;
const longEdge = Math.max(width, height);

const hash = createHash('sha256').update(master.data).digest('hex').slice(0, 8);
const dir = join('public', 'media', projectId);
await mkdir(dir, { recursive: true });

// Standard sizes below the image's own size, plus the master itself as the largest
// variant (e.g. 1800 px → 800, 1600, 1800).
const widths = [...WIDTHS.filter((w) => w < longEdge), longEdge];

for (const w of widths) {
  const scale = w / longEdge;
  const buf = await sharp(master.data)
    .resize({ width: Math.round(width * scale), height: Math.round(height * scale) })
    .webp({ quality: QUALITY })
    .toBuffer();
  await writeFile(join(dir, `${hash}-${w}.webp`), buf);
}

const image = {
  src: `/media/${projectId}/${hash}`,
  width,
  height,
  widths,
  alt: altWords.join(' '),
};
console.log(JSON.stringify(image, null, 2));
