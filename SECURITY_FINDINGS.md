# Security Review Findings

## 1. Base URL Override Allows SSRF (HIGH CONFIDENCE)

**Path**: `apps/browser/src/ui/screens/settings/sections/models-providers-section.tsx:339`  
**Path**: `apps/browser/src/backend/services/preferences.ts:2193-2260`

**Why**: The new `VendorBaseUrlInput` component (frontend) only validates that the base URL starts with `http://` or `https://` (line 339). The backend `updateProviderInstance` function (lines 2193-2260) does **not** validate base URLs for vendor API types (`-api` suffix) — it only validates coding-plan URLs via `resolveCodingPlanBaseUrl`. This allows an attacker to set base URLs pointing to internal services (localhost, 169.254.169.254 metadata, internal APIs).

**Finding**: Server-side requests for model discovery/validation will be made to attacker-controlled base URLs, enabling SSRF.

**Suggestion**: Add server-side base URL validation in `updateProviderInstance` for vendor API types. Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), localhost (127.0.0.0/8, ::1), link-local (169.254.0.0/16), and internal metadata endpoints. Consider an allowlist of known vendor domains.

---

## 2. "Connect Anyway" Bypass Stores Invalid Credentials (HIGH CONFIDENCE)

**Path**: `apps/browser/src/backend/services/preferences.ts:1982-1988`  
**Path**: `apps/browser/src/ui/screens/settings/sections/models-providers-section.tsx:1078-1093`

**Why**: The new `allowInvalidKey` parameter in `addProviderInstance` (line 1982) permits persisting API keys even when `validateCredentials` fails. The UI exposes this as "Connect anyway (save key without validation)" button (line 1086). While intended for edge cases (wrong region, retired probe model), this allows storing keys that failed actual authentication.

**Finding**: Invalid/placeholder keys or keys rejected due to auth failures can be encrypted and stored. The system will subsequently attempt to use these invalid keys for real requests, causing confusing failures. If validation is bypassed via MITM or logic error, a compromised key could be stored.

**Suggestion**: 
- Add a `validationBypassed: boolean` flag on the provider instance when created with `allowInvalidKey`.
- Prevent instances with `validationBypassed=true` from being used for actual requests until validation passes.
- Require explicit re-validation before enabling the instance.
- Audit/log all uses of the bypass.

---

## 3. Telemetry Default Changed to 'off' (PRIVACY IMPROVEMENT)

**Path**: `apps/browser/src/shared/karton-contracts/ui/shared-types.ts:1026, 1367`

**Why**: Default `telemetryLevel` changed from `'anonymous'` to `'off'` in both the schema default (line 1026) and the default preferences object (line 1367).

**Finding**: This is a privacy improvement — no telemetry is collected by default. Not a vulnerability.

**Suggestion**: No action needed; this improves user privacy.