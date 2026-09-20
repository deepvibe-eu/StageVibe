import type { LanguageModelV3 } from '@ai-sdk/provider';
import type {
  ApiSpec,
  DiscoveredModel,
  ModelProvider,
  ProviderInstanceTypeId,
} from '@shared/karton-contracts/ui/shared-types';
import { PROVIDER_TYPE_DISPLAY_INFO } from '@shared/karton-contracts/ui/shared-types';
import { getVendorValidationModels } from '@shared/validation-models';
import type { ProviderType } from './types';
import { generateText } from 'ai';
import {
  toNativeAnthropicModelId,
  toNativeMiniMaxModelId,
  createAnthropicModel,
  createOpenAIChatModel,
  createOpenAIResponsesModel,
  createGoogleModel,
  discoverOpenAICompatibleModels,
  discoverGoogleModels,
  discoverAnthropicModels,
} from './shared';

// ============================================================================
// Official API config — encrypted key + optional base URL override
// ============================================================================

export type OfficialApiConfig = {
  encryptedApiKey?: string;
  baseUrl?: string;
};

// ============================================================================
// Display metadata — sourced from the shared PROVIDER_TYPE_DISPLAY_INFO
// constant. No duplication here; each official-api type spreads from the
// shared record entry for its `${vendor}-api` typeId.
// ============================================================================

function vendorMeta(vendor: ModelProvider) {
  return PROVIDER_TYPE_DISPLAY_INFO[`${vendor}-api` as ProviderInstanceTypeId];
}

// ============================================================================
// Vendor → ApiSpec mapping (consolidated from VENDOR_TO_API_SPEC)
// ============================================================================

const VENDOR_TO_API_SPEC: Record<ModelProvider, ApiSpec> = {
  anthropic: 'anthropic',
  openai: 'openai-responses',
  google: 'google',
  moonshotai: 'openai-chat-completions',
  alibaba: 'openai-chat-completions',
  deepseek: 'openai-chat-completions',
  'z-ai': 'openai-chat-completions',
  minimax: 'openai-chat-completions',
  'xiaomi-mimo': 'openai-chat-completions',
  mistral: 'openai-chat-completions',
  'x-ai': 'openai-chat-completions',
};

const VALIDATION_TIMEOUT_MS = 10_000;

const VALIDATION_PROMPT =
  'What is the capital of France? Respond with one word.';

/**
 * Probes a vendor key against its ordered validation models and succeeds on
 * the first response. Vendors retire cheap model IDs without notice and some
 * plans exclude the newest probes, so a single hardcoded model must not be
 * able to reject a valid key. Errors from every failed probe are aggregated
 * so the user sees the real reason.
 */
async function probeVendorCredentials(
  vendor: ModelProvider,
  createModel: (modelId: string) => LanguageModelV3,
): Promise<{ success: true } | { success: false; error: string }> {
  const label = vendorMeta(vendor)?.displayName ?? vendor;
  const validationModelIds = getVendorValidationModels(vendor);
  if (validationModelIds.length === 0) {
    return {
      success: false,
      error: `No validation model configured for ${label} API`,
    };
  }
  const errors: string[] = [];
  for (const modelId of validationModelIds) {
    try {
      await generateText({
        model: createModel(modelId),
        messages: [{ role: 'user', content: VALIDATION_PROMPT }],
        abortSignal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
      });
      return { success: true };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return {
    success: false,
    error: `Invalid ${label} API key: ${errors.join(' | ')}`,
  };
}

// ============================================================================
// Anthropic API type
// ============================================================================

export const anthropicApiType: ProviderType<OfficialApiConfig> = {
  id: 'anthropic-api',
  ...vendorMeta('anthropic'),
  category: 'official-api',
  vendor: 'anthropic',
  providerMode: 'official',
  apiSpec: VENDOR_TO_API_SPEC.anthropic,
  sensitiveFields: ['encryptedApiKey'],

  toWireModelId(modelId: string): string {
    return toNativeAnthropicModelId(modelId);
  },

  async getInitialModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    return discoverAnthropicModels(
      config.baseUrl ?? vendorMeta('anthropic').defaultBaseUrl ?? '',
      decryptedConfig.encryptedApiKey ?? '',
    );
  },

  async refreshModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    return discoverAnthropicModels(
      config.baseUrl ?? vendorMeta('anthropic').defaultBaseUrl ?? '',
      decryptedConfig.encryptedApiKey ?? '',
    );
  },

  async validateCredentials(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<{ success: true } | { success: false; error: string }> {
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    const baseUrl = config.baseUrl ?? vendorMeta('anthropic').defaultBaseUrl;
    if (!baseUrl) {
      return {
        success: false,
        error: 'No base URL configured for Anthropic API',
      };
    }
    return probeVendorCredentials('anthropic', (modelId) =>
      createAnthropicModel(apiKey, baseUrl, modelId),
    );
  },

  createLanguageModel({ modelId, apiKey, baseURL }): {
    model: LanguageModelV3;
  } {
    return {
      model: createAnthropicModel(apiKey, baseURL, modelId),
    };
  },
};

// ============================================================================
// OpenAI API type (responses API by default)
// ============================================================================

export const openaiApiType: ProviderType<OfficialApiConfig> = {
  id: 'openai-api',
  ...vendorMeta('openai'),
  category: 'official-api',
  vendor: 'openai',
  providerMode: 'official',
  apiSpec: VENDOR_TO_API_SPEC.openai,
  sensitiveFields: ['encryptedApiKey'],

  // ── Discovery ──────────────────────────────────────────────────────────

  async getInitialModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('openai').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverOpenAICompatibleModels(baseUrl, apiKey, 'openai');
  },

  async refreshModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('openai').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverOpenAICompatibleModels(baseUrl, apiKey, 'openai');
  },

  // ── Validation ─────────────────────────────────────────────────────────

  async validateCredentials(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<{ success: true } | { success: false; error: string }> {
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    const baseUrl = config.baseUrl ?? vendorMeta('openai').defaultBaseUrl;
    if (!baseUrl) {
      return { success: false, error: 'No base URL configured for OpenAI API' };
    }
    return probeVendorCredentials('openai', (modelId) =>
      createOpenAIResponsesModel(apiKey, baseUrl, modelId),
    );
  },

  // ── Model creation ─────────────────────────────────────────────────────

  createLanguageModel({ modelId, apiKey, baseURL }): {
    model: LanguageModelV3;
  } {
    return {
      model: createOpenAIResponsesModel(apiKey, baseURL, modelId),
    };
  },
};

// ============================================================================
// Google API type
// ============================================================================

export const googleApiType: ProviderType<OfficialApiConfig> = {
  id: 'google-api',
  ...vendorMeta('google'),
  category: 'official-api',
  vendor: 'google',
  providerMode: 'official',
  apiSpec: VENDOR_TO_API_SPEC.google,
  sensitiveFields: ['encryptedApiKey'],

  // ── Discovery ──────────────────────────────────────────────────────────

  async getInitialModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('google').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverGoogleModels(baseUrl, apiKey);
  },

  async refreshModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('google').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverGoogleModels(baseUrl, apiKey);
  },

  // ── Validation ─────────────────────────────────────────────────────────

  async validateCredentials(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<{ success: true } | { success: false; error: string }> {
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    const baseUrl = config.baseUrl ?? vendorMeta('google').defaultBaseUrl;
    if (!baseUrl) {
      return { success: false, error: 'No base URL configured for Google API' };
    }
    return probeVendorCredentials('google', (modelId) =>
      createGoogleModel(apiKey, baseUrl, modelId),
    );
  },

  // ── Model creation ─────────────────────────────────────────────────────

  createLanguageModel({ modelId, apiKey, baseURL }): {
    model: LanguageModelV3;
  } {
    return {
      model: createGoogleModel(apiKey, baseURL, modelId),
    };
  },
};

// ============================================================================
// MiniMax API type (uses native MiniMax model ID casing)
// ============================================================================

export const minimaxApiType: ProviderType<OfficialApiConfig> = {
  id: 'minimax-api',
  ...vendorMeta('minimax'),
  category: 'official-api',
  vendor: 'minimax',
  providerMode: 'official',
  apiSpec: VENDOR_TO_API_SPEC.minimax,
  sensitiveFields: ['encryptedApiKey'],

  // ── Discovery ──────────────────────────────────────────────────────────

  async getInitialModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('minimax').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverOpenAICompatibleModels(baseUrl, apiKey, 'minimax');
  },

  async refreshModels(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<DiscoveredModel[]> {
    const baseUrl = config.baseUrl ?? vendorMeta('minimax').defaultBaseUrl;
    if (!baseUrl) return [];
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    return discoverOpenAICompatibleModels(baseUrl, apiKey, 'minimax');
  },

  // ── Validation ─────────────────────────────────────────────────────────

  async validateCredentials(
    config: OfficialApiConfig,
    decryptedConfig: Record<string, string>,
  ): Promise<{ success: true } | { success: false; error: string }> {
    const apiKey = decryptedConfig.encryptedApiKey ?? '';
    const baseUrl = config.baseUrl ?? vendorMeta('minimax').defaultBaseUrl;
    if (!baseUrl) {
      return {
        success: false,
        error: 'No base URL configured for MiniMax API',
      };
    }
    return probeVendorCredentials('minimax', (modelId) =>
      createOpenAIChatModel(apiKey, baseUrl, modelId),
    );
  },

  // ── Model ID transforms ────────────────────────────────────────────────

  toWireModelId(modelId: string): string {
    return toNativeMiniMaxModelId(modelId);
  },

  // ── Model creation ─────────────────────────────────────────────────────

  createLanguageModel({ modelId, apiKey, baseURL }): {
    model: LanguageModelV3;
  } {
    return {
      model: createOpenAIChatModel(apiKey, baseURL, modelId),
    };
  },
};

// ============================================================================
// Factory for the remaining 6 OpenAI-compatible vendors
// (moonshotai, alibaba, deepseek, z-ai, xiaomi-mimo, mistral)
// All use OpenAI Chat Completions with a default base URL fallback.
// ============================================================================

function createOpenAICompatibleApiType(
  vendor: ModelProvider,
): ProviderType<OfficialApiConfig> {
  const meta = vendorMeta(vendor);
  return {
    id: `${vendor}-api` as ProviderType['id'],
    ...meta,
    category: 'official-api',
    vendor,
    providerMode: 'official',
    apiSpec: VENDOR_TO_API_SPEC[vendor],
    sensitiveFields: ['encryptedApiKey'],

    // ── Discovery ──────────────────────────────────────────────────────────

    async getInitialModels(
      config: OfficialApiConfig,
      decryptedConfig: Record<string, string>,
    ): Promise<DiscoveredModel[]> {
      const baseUrl = config.baseUrl ?? meta.defaultBaseUrl;
      if (!baseUrl) return [];
      const apiKey = decryptedConfig.encryptedApiKey ?? '';
      return discoverOpenAICompatibleModels(baseUrl, apiKey, vendor);
    },

    async refreshModels(
      config: OfficialApiConfig,
      decryptedConfig: Record<string, string>,
    ): Promise<DiscoveredModel[]> {
      const baseUrl = config.baseUrl ?? meta.defaultBaseUrl;
      if (!baseUrl) return [];
      const apiKey = decryptedConfig.encryptedApiKey ?? '';
      return discoverOpenAICompatibleModels(baseUrl, apiKey, vendor);
    },

    // ── Validation ─────────────────────────────────────────────────────────

    async validateCredentials(
      _config: OfficialApiConfig,
      decryptedConfig: Record<string, string>,
    ): Promise<{ success: true } | { success: false; error: string }> {
      const apiKey = decryptedConfig.encryptedApiKey ?? '';
      const baseUrl = _config.baseUrl ?? meta.defaultBaseUrl;
      if (!baseUrl) {
        return {
          success: false,
          error: `No base URL configured for ${vendor} API`,
        };
      }
      return probeVendorCredentials(vendor, (modelId) =>
        createOpenAIChatModel(apiKey, baseUrl, modelId),
      );
    },

    // ── Model creation ─────────────────────────────────────────────────────

    createLanguageModel({ modelId, apiKey, baseURL }): {
      model: LanguageModelV3;
    } {
      return {
        model: createOpenAIChatModel(apiKey, baseURL, modelId),
      };
    },
  };
}

export const moonshotaiApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('moonshotai');

export const alibabaApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('alibaba');

export const deepseekApiType: ProviderType<OfficialApiConfig> = {
  ...createOpenAICompatibleApiType('deepseek'),
  toWireModelId(modelId: string): string {
    return modelId === 'deepseek-v4.1-flash' ? 'deepseek-flash' : modelId;
  },
};

export const zAiApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('z-ai');

export const xiaomiMimoApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('xiaomi-mimo');

export const mistralApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('mistral');

export const xAiApiType: ProviderType<OfficialApiConfig> =
  createOpenAICompatibleApiType('x-ai');

// ============================================================================
// Registry of all official-api types, keyed by vendor
// ============================================================================

export const OFFICIAL_API_TYPES: Record<
  ModelProvider,
  ProviderType<OfficialApiConfig>
> = {
  anthropic: anthropicApiType,
  openai: openaiApiType,
  google: googleApiType,
  moonshotai: moonshotaiApiType,
  alibaba: alibabaApiType,
  deepseek: deepseekApiType,
  'z-ai': zAiApiType,
  minimax: minimaxApiType,
  'xiaomi-mimo': xiaomiMimoApiType,
  mistral: mistralApiType,
  'x-ai': xAiApiType,
};

export const VENDOR_API_SPECS = VENDOR_TO_API_SPEC;
