#!/usr/bin/env node
/**
 * Minimal skill linter for StageVibe skills.
 *
 * Usage:
 *   node lint-skill.mjs <path-to-skill-dir-or-SKILL.md>
 *
 * Checks frontmatter, folder naming, referenced files and size. Exits non-zero
 * when a hard requirement fails. No dependencies.
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error('usage: node lint-skill.mjs <skill-dir|SKILL.md>');
  process.exit(2);
}

const skillDir = input.endsWith('SKILL.md')
  ? dirname(resolve(input))
  : resolve(input);
const skillFile = join(skillDir, 'SKILL.md');
const errors = [];
const warnings = [];

if (!existsSync(skillFile)) {
  console.error(`✖ no SKILL.md in ${skillDir}`);
  process.exit(1);
}

const raw = readFileSync(skillFile, 'utf8');

// Frontmatter
const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
if (!fmMatch) {
  errors.push('frontmatter block (--- … ---) is missing');
} else {
  const fm = fmMatch[1];
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  // `description` may be a plain value or a block scalar (`>-`, `|`).
  let description = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? '';
  if (/^[>|][-+]?$/.test(description)) {
    const lines = fm.split(/\r?\n/);
    const start = lines.findIndex((line) => /^description:\s*[>|]/.test(line));
    const collected = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (/^[A-Za-z0-9_-]+:/.test(lines[i])) break;
      collected.push(lines[i]);
    }
    description = collected.join(' ').trim();
  }
  if (!name) errors.push('frontmatter `name` is missing or empty');
  if (!description) {
    errors.push('frontmatter `description` is missing or empty');
  } else if (description.length < 30) {
    warnings.push('description looks very short — see description-rubric.md');
  }
}

// Folder naming
const folder = basename(skillDir);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(folder)) {
  warnings.push(`folder "${folder}" is not kebab-case`);
}

// Referenced files
const refs = [
  ...raw.matchAll(
    /(?:\(|`)(\.?\/?(?:references|scripts)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)/g,
  ),
];
for (const [, rel] of refs) {
  if (!existsSync(join(skillDir, rel))) {
    errors.push(`referenced file is missing: ${rel}`);
  }
}

// Size and forbidden files
const bodyBytes = Buffer.byteLength(raw, 'utf8');
if (bodyBytes > 30_000) {
  warnings.push(
    `SKILL.md is ${bodyBytes} bytes (> 30 KB) — consider references/`,
  );
}
for (const forbidden of ['README.md', 'CHANGELOG.md', '.env']) {
  if (existsSync(join(skillDir, forbidden))) {
    warnings.push(`unnecessary file: ${forbidden}`);
  }
}
for (const warning of warnings) console.warn(`⚠ ${warning}`);
for (const error of errors) console.error(`✖ ${error}`);
if (errors.length === 0) {
  console.log(`✔ ${folder} (${bodyBytes} bytes)`);
  process.exit(0);
}
process.exit(1);
