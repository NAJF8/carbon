// One-off + reusable image pipeline.
// Usage: node scripts/optimize-images.mjs            -> brand assets from /assets-src
//        node scripts/optimize-images.mjs <dir>       -> convert every jpg/png in <dir> to responsive webp (800w + 400w)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const out = (p) => path.join('public', 'assets', p);
fs.mkdirSync(out('brand'), { recursive: true });
fs.mkdirSync(out('banners'), { recursive: true });

async function brand() {
  // The supplied "carbon-logo.jpg" is an Instagram profile screenshot; the real logo is the white circle.
  const src = 'assets-src/carbon-logo.jpg';
  const circle = await sharp(src).extract({ left: 157, top: 601, width: 606, height: 606 }).resize(512, 512).toBuffer();
  const mask = Buffer.from('<svg width="512" height="512"><circle cx="256" cy="256" r="256"/></svg>');
  const round = await sharp(circle).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(round).webp({ quality: 90 }).toFile(out('brand/logo.webp'));
  await sharp(round).resize(192, 192).png().toFile(out('brand/logo-192.png'));
  await sharp(round).resize(64, 64).png().toFile(out('brand/favicon.png'));
  await sharp('assets-src/carbon-robot.png').resize(900).webp({ quality: 84, alphaQuality: 90 }).toFile(out('banners/hero-robot.webp'));
  await sharp('assets-src/carbon-robot.png').resize(480).webp({ quality: 82, alphaQuality: 90 }).toFile(out('banners/hero-robot-480.webp'));
  await sharp('assets-src/carbon-robot.png').resize(160).webp({ quality: 85 }).toFile(out('brand/assistant.webp'));
}

async function folder(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue;
    const base = path.join(dir, f.replace(/\.[^.]+$/, ''));
    await sharp(path.join(dir, f)).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${base}.webp`);
    await sharp(path.join(dir, f)).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${base}-400.webp`);
    console.log('optimized', f);
  }
}

const arg = process.argv[2];
if (arg) await folder(arg); else await brand();
console.log('done');
