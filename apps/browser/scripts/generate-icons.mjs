#!/usr/bin/env node
/**
 * Regenerates the app icons from `assets/icons/agewise-icon.svg`.
 *
 * Usage: node scripts/generate-icons.mjs   (from apps/browser)
 *
 * Writes icon-<size>.png and icon.png into the bundled channel folders that
 * Forge reads (dev, nightly, release). The .ico/.icns files cannot be produced
 * here — regenerate those with dedicated tooling on Windows/macOS.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'assets/icons/agewise-icon.svg');
const channels = ['dev', 'nightly', 'release'];
const sizes = [16, 32, 48, 64, 96, 128, 256, 512, 1024];

const svg = await readFile(source);

for (const channel of channels) {
  const dir = path.join(root, 'assets/icons', channel);
  if (!existsSync(dir)) continue;

  for (const size of sizes) {
    await sharp(svg, { density: 384 })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, `icon-${size}.png`));
  }

  // Forge's Linux makers read the plain icon.png.
  await sharp(svg, { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(dir, 'icon.png'));

  console.log(`updated ${channel}`);
}
