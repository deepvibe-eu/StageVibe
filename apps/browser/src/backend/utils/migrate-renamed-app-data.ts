import fs from 'node:fs';
import path from 'node:path';

export interface RenameMigrationLogger {
  info(message: string): void;
  warn(message: string): void;
}

function copyRecursiveSync(from: string, to: string): void {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursiveSync(source, target);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, target);
    }
    // Symlinks and special files are intentionally skipped.
  }
}

function renameOrCopy(
  from: string,
  to: string,
  logger: RenameMigrationLogger,
): boolean {
  try {
    fs.renameSync(from, to);
    return true;
  } catch (error) {
    logger.warn(
      `Rename "${from}" -> "${to}" failed (${error instanceof Error ? error.message : String(error)}); falling back to copy.`,
    );
  }
  try {
    copyRecursiveSync(from, to);
    return true;
  } catch (error) {
    logger.warn(
      `Copy "${from}" -> "${to}" failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}

/**
 * Migrates data from the pre-rebrand `stagewise*` directories to the
 * `stagevibe*` layout after the StageVibe rename.
 *
 * Because {@link file://./../index.ts} sets `userData` from the app base
 * name, an upgrade starts with an empty `stagevibe*` profile even though the
 * previous `stagewise*` profile still holds credentials, the agents database,
 * and preferences. This moves that profile (and its inner data root) once,
 * without ever clobbering a profile that already has data.
 */
export function migrateRenamedAppData(
  appDataDirectory: string,
  userDataDirectory: string,
  logger: RenameMigrationLogger,
): void {
  const newBaseName = path.basename(userDataDirectory);
  if (!newBaseName.startsWith('stagevibe')) return;
  const legacyBaseName = newBaseName.replace(/^stagevibe/, 'stagewise');
  if (legacyBaseName === newBaseName) return;

  const legacyUserData = path.join(appDataDirectory, legacyBaseName);
  if (fs.existsSync(legacyUserData)) {
    const newHasData =
      fs.existsSync(userDataDirectory) &&
      fs.readdirSync(userDataDirectory).length > 0;
    if (!newHasData) {
      if (renameOrCopy(legacyUserData, userDataDirectory, logger)) {
        logger.info(
          `Migrated app data "${legacyBaseName}" -> "${newBaseName}".`,
        );
      }
    }
  }

  // The data root inside the profile also changed name ("stagewise" ->
  // "stagevibe"); rename it so the migrated profile is actually found.
  const legacyDataRoot = path.join(userDataDirectory, 'stagewise');
  const newDataRoot = path.join(userDataDirectory, 'stagevibe');
  if (fs.existsSync(legacyDataRoot) && !fs.existsSync(newDataRoot)) {
    if (renameOrCopy(legacyDataRoot, newDataRoot, logger)) {
      logger.info('Migrated data root "stagewise" -> "stagevibe".');
    }
  }
}
