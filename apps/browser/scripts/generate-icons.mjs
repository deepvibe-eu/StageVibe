#!/usr/bin/env node
/**
 * Regenerates the bundled app icons for the channels Forge reads
 * (dev, nightly, release).
 *
 * Source defaults to `assets/icons/icons new/85_icon_light.png` (the padded
 * variant, matching Apple's icon grid) and can be overridden with the first
 * CLI argument:
 *
 *   node scripts/generate-icons.mjs [path/to/source.png]
 *
 * PNG sizes are produced with sharp. The `.ico` / `.icns` files are produced
 * with ImageMagick (`magick`/`convert`) and `png2icns` when those tools are
 * available; otherwise they are left untouched (regenerate them on a platform
 * that has the tools). The macOS Icon Composer `icon.icon` bundles are not
 * generated here.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const source =
  process.argv[2] ??
  path.join(root, 'assets/icons/icons new/85_icon_light.png');
const channels = ['dev', 'nightly', 'release'];
const sizes = [16, 32, 48, 64, 96, 128, 256, 512, 1024];

function hasCommand(command) {
  try {
    execFileSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const magickCommand = hasCommand('magick')
  ? 'magick'
  : hasCommand('convert')
    ? 'convert'
    : null;
const hasPng2Icns = hasCommand('png2icns');

if (!existsSync(source)) {
  console.error(`[generate-icons] source not found: ${source}`);
  process.exit(1);
}

for (const channel of channels) {
  const dir = path.join(root, 'assets/icons', channel);
  if (!existsSync(dir)) continue;

  for (const size of sizes) {
    await sharp(source, { density: 384 })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, `icon-${size}.png`));
  }

  // Forge's Linux makers read the plain icon.png.
  await sharp(source, { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(dir, 'icon.png'));

  if (magickCommand) {
    execFileSync(
      magickCommand,
      [
        path.join(dir, 'icon-16.png'),
        path.join(dir, 'icon-32.png'),
        path.join(dir, 'icon-48.png'),
        path.join(dir, 'icon-64.png'),
        path.join(dir, 'icon-128.png'),
        path.join(dir, 'icon-256.png'),
        path.join(dir, 'icon.png'),
        path.join(dir, 'icon.ico'),
      ],
      { stdio: 'ignore' },
    );
  }

  if (hasPng2Icns) {
    try {
      execFileSync(
        'png2icns',
        [
          path.join(dir, 'icon.icns'),
          path.join(dir, 'icon-16.png'),
          path.join(dir, 'icon-32.png'),
          path.join(dir, 'icon-48.png'),
          path.join(dir, 'icon-128.png'),
          path.join(dir, 'icon-256.png'),
        ],
        { stdio: 'ignore' },
      );
    } catch (error) {
      console.warn(`[generate-icons] png2icns failed for ${channel}:`, error);
    }
  }

  console.log(`updated ${channel}`);
}

console.log(
  `[generate-icons] done (ico: ${magickCommand ?? 'skipped'}, icns: ${
    hasPng2Icns ? 'png2icns' : 'skipped'
  })`,
);
