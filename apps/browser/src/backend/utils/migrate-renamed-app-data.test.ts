import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateRenamedAppData } from './migrate-renamed-app-data';

const logger = { info: vi.fn(), warn: vi.fn() };

function makeAppData(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stagevibe-migrate-'));
}

const createdDirs: string[] = [];

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of createdDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('migrateRenamedAppData', () => {
  it('moves the legacy profile and renames its inner data root', () => {
    const appData = makeAppData();
    createdDirs.push(appData);

    const legacyUserData = path.join(appData, 'stagewise-dev');
    fs.mkdirSync(path.join(legacyUserData, 'stagewise'), { recursive: true });
    fs.writeFileSync(
      path.join(legacyUserData, 'stagewise', 'credentials.json'),
      '{"k":"v"}',
    );

    const userData = path.join(appData, 'stagevibe-dev');
    migrateRenamedAppData(appData, userData, logger);

    expect(
      fs.existsSync(path.join(userData, 'stagevibe', 'credentials.json')),
    ).toBe(true);
    expect(fs.existsSync(legacyUserData)).toBe(false);
    expect(logger.info).toHaveBeenCalled();
  });

  it('does not clobber a profile that already has data', () => {
    const appData = makeAppData();
    createdDirs.push(appData);

    const legacyUserData = path.join(appData, 'stagewise-dev');
    fs.mkdirSync(path.join(legacyUserData, 'stagewise'), { recursive: true });
    const userData = path.join(appData, 'stagevibe-dev');
    fs.mkdirSync(path.join(userData, 'stagevibe'), { recursive: true });
    fs.writeFileSync(path.join(userData, 'stagevibe', 'keep.json'), '{}');

    migrateRenamedAppData(appData, userData, logger);

    expect(fs.existsSync(path.join(userData, 'stagevibe', 'keep.json'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(legacyUserData, 'stagewise'))).toBe(true);
  });

  it('is a no-op for base names that are not rebranded', () => {
    const appData = makeAppData();
    createdDirs.push(appData);

    const legacyUserData = path.join(appData, 'stagewise-dev');
    fs.mkdirSync(path.join(legacyUserData, 'stagewise'), { recursive: true });

    migrateRenamedAppData(appData, path.join(appData, 'other-dev'), logger);

    expect(fs.existsSync(path.join(legacyUserData, 'stagewise'))).toBe(true);
    expect(logger.info).not.toHaveBeenCalled();
  });
});
