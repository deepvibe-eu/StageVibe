type CurrentAuthCallbackScheme =
  | 'stagevibe'
  | 'stagevibe-prerelease'
  | 'stagevibe-nightly'
  | 'stagevibe-dev';

type LegacyAuthCallbackScheme =
  | 'stagewise'
  | 'stagewise-prerelease'
  | 'stagewise-nightly'
  | 'stagewise-dev';

type AuthCallbackScheme = CurrentAuthCallbackScheme | LegacyAuthCallbackScheme;

function getDefaultAuthCallbackScheme(): CurrentAuthCallbackScheme {
  switch (__APP_RELEASE_CHANNEL__) {
    case 'release':
      return 'stagevibe';
    case 'prerelease':
      return 'stagevibe-prerelease';
    case 'nightly':
      return 'stagevibe-nightly';
    case 'dev':
      return 'stagevibe-dev';
    default:
      throw new Error(
        `Unexpected app release channel for auth callback scheme: ${String(__APP_RELEASE_CHANNEL__)}`,
      );
  }
}

export const AUTH_CALLBACK_SCHEME = getDefaultAuthCallbackScheme();

export const AUTH_CALLBACK_PROTOCOL = `${AUTH_CALLBACK_SCHEME}:`;

// All valid callback protocols. We register the stable `stagevibe` scheme and
// the build's own scheme, and keep accepting the legacy `stagewise*` schemes
// so callbacks produced before the rename still route back into the app —
// e.g. a dev build sends `callback_scheme=stagevibe-dev` to the console, but
// the console's allowlist may fall back to `stagewise://`, which the OS still
// routes to this app. handleAuthCallbackUrl must accept any of these.
const ALL_CALLBACK_SCHEMES: readonly AuthCallbackScheme[] = [
  'stagevibe',
  'stagevibe-prerelease',
  'stagevibe-nightly',
  'stagevibe-dev',
  'stagewise',
  'stagewise-prerelease',
  'stagewise-nightly',
  'stagewise-dev',
];

export const ALL_CALLBACK_PROTOCOLS = new Set(
  ALL_CALLBACK_SCHEMES.map((s) => `${s}:`),
);
