import type { TabState } from '@shared/karton-contracts/ui';
import { getBaseName } from '@shared/path-utils';
import type { TFunction } from 'i18next';

/**
 * Represents a parsed CDP call extracted from a sandbox script.
 */
export interface ParsedCDPCall {
  tabId: string;
  method: string;
}

/**
 * Represents a parsed writeFile call extracted from a sandbox script.
 */
export interface ParsedWriteFileCall {
  relativePath: string;
}

/**
 * Represents a parsed attachment read via `fs.readFile('att/...')`.
 */
export interface ParsedReadAttachmentCall {
  attachmentId: string;
}

/**
 * Indicates a createAttachment call was found in a sandbox script.
 */
export interface ParsedMultimodalAttachmentCall {
  found: true;
}

/**
 * Maps common CDP methods to i18n keys (under `sandbox.methods`) and a
 * preposition used before the hostname:
 * - "on" for actions/interactions (queried, called, ran)
 * - "from" for data retrieval (read, got, extracted)
 * - "of" for screenshots
 */
const CDP_METHOD_KEYS: Record<
  string,
  { key: string; preposition: 'on' | 'from' | 'of' }
> = {
  // CSS domain
  'CSS.enable': { key: 'cssEnable', preposition: 'on' },
  'CSS.getComputedStyleForNode': {
    key: 'cssGetComputedStyleForNode',
    preposition: 'from',
  },
  'CSS.getMatchedStylesForNode': {
    key: 'cssGetMatchedStylesForNode',
    preposition: 'from',
  },
  'CSS.getInlineStylesForNode': {
    key: 'cssGetInlineStylesForNode',
    preposition: 'from',
  },
  'CSS.getStyleSheetText': {
    key: 'cssGetStyleSheetText',
    preposition: 'from',
  },

  // DOM domain
  'DOM.enable': { key: 'domEnable', preposition: 'on' },
  'DOM.getDocument': { key: 'domGetDocument', preposition: 'from' },
  'DOM.querySelector': { key: 'domQuerySelector', preposition: 'on' },
  'DOM.querySelectorAll': { key: 'domQuerySelectorAll', preposition: 'on' },
  'DOM.getOuterHTML': { key: 'domGetOuterHTML', preposition: 'from' },
  'DOM.resolveNode': { key: 'domResolveNode', preposition: 'on' },
  'DOM.getBoxModel': { key: 'domGetBoxModel', preposition: 'from' },

  // Runtime domain
  'Runtime.enable': { key: 'runtimeEnable', preposition: 'on' },
  'Runtime.evaluate': { key: 'runtimeEvaluate', preposition: 'on' },
  'Runtime.callFunctionOn': { key: 'runtimeCallFunctionOn', preposition: 'on' },
  'Runtime.getProperties': { key: 'runtimeGetProperties', preposition: 'from' },

  // Page domain
  'Page.enable': { key: 'pageEnable', preposition: 'on' },
  'Page.getFrameTree': { key: 'pageGetFrameTree', preposition: 'from' },
  'Page.captureScreenshot': { key: 'pageCaptureScreenshot', preposition: 'of' },

  // Network domain
  'Network.enable': { key: 'networkEnable', preposition: 'on' },
  'Network.getResponseBody': {
    key: 'networkGetResponseBody',
    preposition: 'from',
  },
};

/**
 * Parses a sandbox script to extract CDP calls.
 * Matches patterns like: API.sendCDP("t_1", "CSS.getComputedStyleForNode", ...)
 */
export function parseCDPCalls(script: string): ParsedCDPCall[] {
  // Regex to match API.sendCDP("tabId", "Method.name", ...)
  // Supports both single and double quotes
  const regex = /API\.sendCDP\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g;
  const calls: ParsedCDPCall[] = [];

  let match = regex.exec(script);
  while (match !== null) {
    calls.push({
      tabId: match[1]!,
      method: match[2]!,
    });
    match = regex.exec(script);
  }

  return calls;
}

/**
 * Parses a sandbox script to extract writeFile calls.
 * Matches fs.writeFile, fs.writeFileSync, fsp.writeFile, and legacy API.writeFile.
 */
export function parseWriteFileCalls(script: string): ParsedWriteFileCall[] {
  const regex =
    /(?:API\.writeFile|fs\.writeFile(?:Sync)?|fsp\.writeFile)\s*\(\s*["'`]([^"'`]+)["'`]/g;
  const calls: ParsedWriteFileCall[] = [];

  let match = regex.exec(script);
  while (match !== null) {
    calls.push({
      relativePath: match[1]!,
    });
    match = regex.exec(script);
  }

  return calls;
}

/**
 * Parses a sandbox script to extract attachment reads via `fs.readFile('att/...')`.
 * Matches patterns like: fs.readFile('att/abc123'), fsp.readFile("att/abc123")
 */
export function parseReadAttachmentCalls(
  script: string,
): ParsedReadAttachmentCall[] {
  const regex = /(?:fs|fsp)\.readFile\s*\(\s*["'`]att\/([^"'`]+)["'`]/g;
  const calls: ParsedReadAttachmentCall[] = [];

  let match = regex.exec(script);
  while (match !== null) {
    calls.push({ attachmentId: match[1]! });
    match = regex.exec(script);
  }

  return calls;
}

/**
 * Parses a sandbox script to extract createAttachment calls.
 * Matches patterns like: API.createAttachment({...})
 */
export function parseOutputAttachmentCalls(
  script: string,
): ParsedMultimodalAttachmentCall[] {
  const regex = /API\.createAttachment\s*\(/g;
  const calls: ParsedMultimodalAttachmentCall[] = [];
  while (regex.exec(script) !== null) calls.push({ found: true });
  return calls;
}

/** MIME media types mapped to i18n keys (under `sandbox`). */
const MEDIA_TYPE_KEYS: Record<string, string> = {
  image: 'mediaImage',
  video: 'mediaVideo',
  audio: 'mediaAudio',
  'application/pdf': 'PDF',
  'text/html': 'HTML',
  'text/csv': 'CSV',
  'application/json': 'JSON',
};

/**
 * Derives a human-friendly noun from a MIME mediaType.
 * Falls back to "attachment" for unknown types.
 */
export function getAttachmentLabel(
  mediaType: string | undefined,
  t: TFunction<'tools'>,
): string {
  if (!mediaType) return t('sandbox.attachment');
  const topLevel = mediaType.split('/')[0];
  const key =
    MEDIA_TYPE_KEYS[mediaType] ??
    (topLevel ? MEDIA_TYPE_KEYS[topLevel] : undefined);
  if (!key) return t('sandbox.attachment');
  if (key === 'mediaImage' || key === 'mediaVideo' || key === 'mediaAudio')
    return t(`sandbox.${key}`);
  // Technical acronyms (PDF/HTML/CSV/JSON) stay as-is.
  return key;
}

/**
 * Gets the filename from a path (last segment after /).
 */
function getFileName(relativePath: string): string {
  return getBaseName(relativePath) || relativePath;
}

interface MethodLabelResult {
  label: string;
  preposition: 'on' | 'from' | 'of';
}

/**
 * Gets a human-readable label and preposition for a CDP method.
 * Falls back to a generic label based on the domain if the method is unknown.
 */
export function getMethodLabel(
  method: string,
  isInProgress: boolean,
  t: TFunction<'tools'>,
): MethodLabelResult {
  const phase = isInProgress ? 'inProgress' : 'completed';
  const entry = CDP_METHOD_KEYS[method];
  if (entry)
    return {
      label: t(`sandbox.methods.${entry.key}.${phase}`),
      preposition: entry.preposition,
    };

  // Fallback: extract domain and create generic label
  // e.g., "CSS.someUnknownMethod" → "Inspecting CSS" / "Inspected CSS"
  const domain = method.split('.')[0];
  if (domain)
    return {
      label: t(`sandbox.fallbackInspect.${phase}`, { domain }),
      preposition: 'on',
    };

  return {
    label: t(`sandbox.fallbackScript.${phase}`),
    preposition: 'on',
  };
}

/**
 * Resolves a tab ID to its hostname.
 * Returns undefined if the tab is not found or URL parsing fails.
 */
export function resolveTabHostname(
  tabId: string,
  activeTabs: Record<string, TabState>,
): string | undefined {
  const tab = activeTabs[tabId];
  if (!tab) return undefined;

  try {
    return new URL(tab.url).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Generates a contextual label for a sandbox script based on its CDP calls,
 * file writes, and attachment reads (via `fs.readFile('att/...')`).
 *
 * @param script - The sandbox script content
 * @param activeTabs - Current browser tabs from state
 * @param isInProgress - Whether the script is still running
 * @param t - Translation function for the `tools` namespace
 * @returns A human-readable label describing the operation
 */
export function getSandboxLabel(
  script: string | undefined,
  activeTabs: Record<string, TabState>,
  isInProgress: boolean,
  t: TFunction<'tools'>,
): string {
  if (!script)
    return isInProgress ? t('sandbox.runningScript') : t('sandbox.ranScript');

  const cdpCalls = parseCDPCalls(script);
  const writeFileCalls = parseWriteFileCalls(script);
  const readAttCalls = parseReadAttachmentCalls(script);
  const multimodalAttachmentCalls = parseOutputAttachmentCalls(script);

  const attWriteCalls = writeFileCalls.filter((c) =>
    c.relativePath.startsWith('att/'),
  );
  const realWriteCalls = writeFileCalls.filter(
    (c) => !c.relativePath.startsWith('att/'),
  );

  // No API calls found
  if (
    cdpCalls.length === 0 &&
    writeFileCalls.length === 0 &&
    readAttCalls.length === 0 &&
    multimodalAttachmentCalls.length === 0
  )
    return isInProgress ? t('sandbox.runningScript') : t('sandbox.ranScript');

  // 1. API.createAttachment always wins (user sees visual output)
  if (multimodalAttachmentCalls.length > 0) {
    if (multimodalAttachmentCalls.length === 1)
      return isInProgress
        ? t('sandbox.parsingAttachment')
        : t('sandbox.parsedAttachment');

    return isInProgress
      ? t('sandbox.parsingAttachments', {
          count: multimodalAttachmentCalls.length,
        })
      : t('sandbox.parsedAttachments', {
          count: multimodalAttachmentCalls.length,
        });
  }

  // 2. att/ writes only (preparing data for visual output)
  if (
    attWriteCalls.length > 0 &&
    realWriteCalls.length === 0 &&
    cdpCalls.length === 0 &&
    readAttCalls.length === 0
  ) {
    if (attWriteCalls.length === 1)
      return isInProgress
        ? t('sandbox.preparingAttachment')
        : t('sandbox.preparedAttachment');

    return isInProgress
      ? t('sandbox.preparingAttachments', { count: attWriteCalls.length })
      : t('sandbox.preparedAttachments', { count: attWriteCalls.length });
  }

  // 3. Attachment reads only
  if (
    cdpCalls.length === 0 &&
    realWriteCalls.length === 0 &&
    attWriteCalls.length === 0 &&
    readAttCalls.length > 0
  ) {
    if (readAttCalls.length === 1)
      return isInProgress
        ? t('sandbox.readingAttachment')
        : t('sandbox.readAttachment');

    return isInProgress
      ? t('sandbox.readingAttachments', { count: readAttCalls.length })
      : t('sandbox.readAttachments', { count: readAttCalls.length });
  }

  // 4. Real file writes (possibly with attachment reads), no CDP calls
  if (cdpCalls.length === 0 && realWriteCalls.length > 0) {
    const attachmentSuffix =
      readAttCalls.length > 0
        ? readAttCalls.length === 1
          ? t('sandbox.fromAttachment')
          : t('sandbox.fromAttachments', { count: readAttCalls.length })
        : '';

    if (realWriteCalls.length === 1) {
      const fileName = getFileName(realWriteCalls[0]!.relativePath);
      return isInProgress
        ? t('sandbox.writing', { name: fileName, suffix: attachmentSuffix })
        : t('sandbox.wrote', { name: fileName, suffix: attachmentSuffix });
    }
    return isInProgress
      ? t('sandbox.writingFiles', {
          count: realWriteCalls.length,
          suffix: attachmentSuffix,
        })
      : t('sandbox.wroteFiles', {
          count: realWriteCalls.length,
          suffix: attachmentSuffix,
        });
  }

  // 5. CDP calls
  const uniqueTabIds = Array.from(new Set(cdpCalls.map((c) => c.tabId)));

  if (uniqueTabIds.length > 1)
    return isInProgress
      ? t('sandbox.runningScriptOnTabs', { count: uniqueTabIds.length })
      : t('sandbox.ranScriptOnTabs', { count: uniqueTabIds.length });

  const hostname = resolveTabHostname(uniqueTabIds[0]!, activeTabs);
  const latestMethod = cdpCalls[cdpCalls.length - 1]!.method;
  const { label, preposition } = getMethodLabel(latestMethod, isInProgress, t);
  const suffix = hostname
    ? ` ${t(`sandbox.preposition.${preposition}`)} ${hostname}`
    : '';

  if (realWriteCalls.length > 0) {
    const fileInfo =
      realWriteCalls.length === 1
        ? getFileName(realWriteCalls[0]!.relativePath)
        : t('sandbox.fileCount', { count: realWriteCalls.length });
    if (isInProgress)
      return t('sandbox.labelWriting', { label, suffix, file: fileInfo });
    return t('sandbox.labelWrote', { label, suffix, file: fileInfo });
  }

  if (isInProgress) return `${label}${suffix}...`;

  return `${label}${suffix}`;
}
