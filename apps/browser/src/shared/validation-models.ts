import type { ModelProvider } from './karton-contracts/ui/shared-types';

/**
 * Ordered credential-validation probes per vendor.
 *
 * Vendors retire cheap model IDs without notice, and some plans do not
 * entitle every model, so validation must never depend on a single
 * hardcoded model ID. Each vendor lists one or more cheap probes to try in
 * order; the first one that answers means the key is valid.
 *
 * Ordering rules:
 * - Prefer pay-as-you-go friendly models over subscription-only ones, so a
 *   funded PAYG account is not rejected with `insufficient balance`.
 * - Keep at least one older/stable alias as a fallback for retired probes.
 *
 * Both the provider types (`providers/official-api.ts`) and the generic
 * validator (`utils/validate-api-keys.ts`) read from this list so the two
 * paths cannot drift apart again.
 */
export const VENDOR_VALIDATION_MODELS: Partial<
  Record<ModelProvider, string[]>
> = {
  anthropic: ['claude-haiku-4-5'],
  openai: ['gpt-4o-mini', 'gpt-5-nano'],
  google: ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'],
  moonshotai: ['kimi-k2.6', 'kimi-k2.5'],
  alibaba: ['qwen-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-v4-flash'],
  'z-ai': ['glm-4.5-flash'],
  // MiniMax: M3 is the flagship, M2.7 the current predecessor. M2/M1 are
  // end-of-life and must not be used as probes. Try the cheaper current
  // model first, then the flagship.
  minimax: ['minimax-m2.7', 'MiniMax-M3'],
  'xiaomi-mimo': ['mimo-v2.5'],
  mistral: ['mistral-small-latest'],
  'x-ai': ['grok-3-mini'],
};

/** Returns the ordered validation probes for a vendor, if any. */
export function getVendorValidationModels(vendor: ModelProvider): string[] {
  return VENDOR_VALIDATION_MODELS[vendor] ?? [];
}
