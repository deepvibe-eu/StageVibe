import fs from 'node:fs';
import path from 'node:path';

export const ISOLATED_DEV_SEED_MARKER = '.isolated-dev-profile-seeded';

const SEEDED_FILE_NAMES = [
  'auth-session.json',
  'preferences.json',
  'credentials.json',
  'config.json',
  'identity.json',
  'onboarding-state.json',
  'tutorial-state.json',
  'recently-opened-workspaces.json',
];

export function seedIsolatedDevProfile(
  appDataDirectory: string,
  userDataDirectory: string,
  appBaseName: string,
): number {
  if (!appBaseName.startsWith('agewise-dev-')) return 0;

  const markerPath = path.join(userDataDirectory, ISOLATED_DEV_SEED_MARKER);
  // Prefer the current layout; fall back to the pre-rebrand `stagewise-dev`
  // profile so isolated instances keep seeding after the Agewise rename.
  const source = [
    { userData: path.join(appDataDirectory, 'agewise-dev'), root: 'agewise' },
    {
      userData: path.join(appDataDirectory, 'stagewise-dev'),
      root: 'stagewise',
    },
  ].find((candidate) =>
    fs.existsSync(path.join(candidate.userData, candidate.root)),
  );
  if (fs.existsSync(markerPath) || !source) return 0;

  const sourceUserData = source.userData;
  const sourceDataRoot = path.join(sourceUserData, source.root);

  const targetDataRoot = path.join(userDataDirectory, 'agewise');
  fs.mkdirSync(targetDataRoot, { recursive: true });

  let copiedFileCount = 0;
  for (const fileName of SEEDED_FILE_NAMES) {
    const sourcePath = path.join(sourceDataRoot, fileName);
    const targetPath = path.join(targetDataRoot, fileName);
    if (!fs.existsSync(sourcePath) || fs.existsSync(targetPath)) continue;
    fs.copyFileSync(sourcePath, targetPath);
    copiedFileCount++;
  }

  if (process.platform === 'win32') {
    const sourcePath = path.join(sourceUserData, 'session', 'Local State');
    const targetPath = path.join(userDataDirectory, 'session', 'Local State');
    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      copiedFileCount++;
    }
  }

  fs.writeFileSync(markerPath, '');
  return copiedFileCount;
}
