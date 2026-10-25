import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Usage: node scripts/generate-icons.js [maskable]
// With an argument only that icon is regenerated (keeps the others byte-identical).
const only = process.argv[2];
const want = (name) => !only || only === name;

// Maskable icons are cropped to a shape by the OS, so they must be opaque and full-bleed
// (no transparent rounded corners, no inset outline); the glyph already sits inside the 80% safe zone.
const maskableSvg = Buffer.from(
  svgBuffer
    .toString('utf8')
    .replace('rx="112"', 'rx="0"')
    .replace(/\s*<rect x="16"[^>]*\/>/, '')
);

async function generate() {
  if (want('any')) {
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));

  }

  if (want('maskable')) {
    await sharp(maskableSvg)
      .resize(512, 512)
      .flatten({ background: '#080C14' })
      .png()
      .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  }

  if (want('any')) {

  // Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));

  // 32x32 favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public/favicon-32x32.png'));

  }

  console.log('Icons generated successfully!');
}

generate().catch(console.error);
