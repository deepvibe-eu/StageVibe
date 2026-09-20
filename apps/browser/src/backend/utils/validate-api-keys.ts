import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  resolveCodingPlanValidationBaseUrl,
  type CodingPlan,
} from '@shared/coding-plans';
import { getVendorValidationModels } from '@shared/validation-models';
import { generateText, type ModelMessage } from 'ai';

export type ApiKeyProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'moonshotai'
  | 'alibaba'
  | 'deepseek'
  | 'z-ai'
  | 'minimax'
  | 'xiaomi-mimo'
  | 'mistral'
  | 'x-ai';

export type ApiKeyValidationResult =
  | null
  | { success: true }
  | { success: false; error: string };

export type ApiKeyValidationResults = Record<
  ApiKeyProvider,
  ApiKeyValidationResult
>;

export type ApiKeysInput = Partial<Record<ApiKeyProvider, string>>;

type ValidationModel = Parameters<typeof generateText>[0]['model'];

const validationMessages: ModelMessage[] = [
  {
    role: 'user',
    content: 'What is the capital of France? Respond with one word.',
  },
];

/**
 * Validate a MiniMax Token Plan key by probing the lightweight
 * `/v1/token_plan/remains` quota endpoint on the Global region.
 * This is faster and more reliable than making a chat completion
 * request.
 */
export async function validateMiniMaxTokenPlanKey(
  apiKey: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const url = 'https://api.minimax.io/v1/token_plan/remains';
  // MiniMax endpoints accept both Bearer and x-api-key auth styles.
  const authHeaders: Record<string, string>[] = [
    { Authorization: `Bearer ${apiKey}` },
    { 'x-api-key': apiKey },
  ];
  for (const authHeader of authHeaders) {
    try {
      const res = await fetch(url, {
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        base_resp?: { status_code?: number };
      };
      if (data.base_resp?.status_code === 0) return { success: true };
    } catch {
      // try next auth style
    }
  }

  return {
    success: false,
    error:
      'Invalid MiniMax Token Plan key. Ensure the key belongs to an active Token Plan subscription.',
  };
}

const providerConfigs: Record<
  ApiKeyProvider,
  (
    apiKey: string,
    baseURL: string | undefined,
    modelId: string,
  ) => ValidationModel
> = {
  anthropic: (apiKey, baseURL, modelId) =>
    createAnthropic({ apiKey, baseURL })(modelId),
  openai: (apiKey, baseURL, modelId) =>
    createOpenAI({ apiKey, baseURL })(modelId),
  google: (apiKey, baseURL, modelId) =>
    createGoogleGenerativeAI({ apiKey, baseURL })(modelId),
  // OpenAI-compatible providers below must use `.chat(...)` rather than the
  // default `(id)` shorthand: `createOpenAI()(id)` targets the Responses API
  // (only OpenAI itself implements it), whereas these upstreams speak Chat
  // Completions. Without `.chat(...)`, the probe hits a non-existent endpoint
  // and valid keys get rejected.
  moonshotai: (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.moonshot.ai/v1',
    }).chat(modelId),
  alibaba: (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL:
        baseURL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    }).chat(modelId),
  deepseek: (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.deepseek.com/v1',
    }).chat(modelId),
  'z-ai': (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.z.ai/api/paas/v4',
    }).chat(modelId),
  minimax: (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.minimax.io/v1',
    }).chat(modelId),
  'xiaomi-mimo': (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.xiaomimimo.com/v1',
    }).chat(modelId),
  mistral: (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.mistral.ai/v1',
    }).chat(modelId),
  'x-ai': (apiKey, baseURL, modelId) =>
    createOpenAI({
      apiKey,
      baseURL: baseURL ?? 'https://api.x.ai/v1',
    }).chat(modelId),
};

async function validateModel(model: ValidationModel): Promise<void> {
  await generateText({
    model,
    messages: validationMessages,
  });
}

/**
 * Tries each candidate model in order and resolves with `null` on the first
 * success, or with the aggregated error messages if every candidate fails.
 */
async function validateFirstWorkingModel(
  candidates: string[],
  createModel: (modelId: string) => ValidationModel,
): Promise<string | null> {
  const errors: string[] = [];
  for (const modelId of candidates) {
    try {
      await validateModel(createModel(modelId));
      return null;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return errors.length > 0
    ? errors.join(' | ')
    : 'No validation model configured';
}

export async function validateCodingPlanApiKey(
  plan: CodingPlan,
  apiKey: string,
  instanceBaseUrl?: string,
): Promise<ApiKeyValidationResult> {
  // MiniMax Token Plan keys use a dedicated lightweight quota endpoint
  // with auto-region detection instead of a chat completion probe.
  if (plan.id === 'minimax-plan') {
    return validateMiniMaxTokenPlanKey(apiKey);
  }

  let validationBaseURL: string | undefined;
  try {
    validationBaseURL = resolveCodingPlanValidationBaseUrl(
      plan,
      instanceBaseUrl,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (validationBaseURL && plan.validationModelId) {
    try {
      await validateModel(
        createOpenAI({
          apiKey,
          baseURL: validationBaseURL,
        }).chat(plan.validationModelId),
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Invalid ${plan.displayName} key: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  const results = await validateApiKeys({ [plan.provider]: apiKey });
  const result = results[plan.provider];
  return result ?? { success: false, error: 'Validation was skipped' };
}

/**
 * Validate API keys by making a lightweight test request to each provider.
 * Keys that are empty/undefined are skipped (result stays `null`).
 *
 * Cloud providers (Azure, Bedrock, Vertex) are not validated here since they
 * require different auth mechanisms — validation for those happens at first use.
 */
export async function validateApiKeys(
  keys: ApiKeysInput,
  baseUrl?: string,
): Promise<ApiKeyValidationResults> {
  const results: ApiKeyValidationResults = {
    anthropic: null,
    openai: null,
    google: null,
    moonshotai: null,
    alibaba: null,
    deepseek: null,
    'z-ai': null,
    minimax: null,
    'xiaomi-mimo': null,
    mistral: null,
    'x-ai': null,
  };

  const promises: Promise<void>[] = [];

  for (const [provider, apiKey] of Object.entries(keys)) {
    if (!apiKey) continue;
    const k = provider as ApiKeyProvider;
    const createModel = providerConfigs[k];
    if (!createModel) continue;
    const candidates = getVendorValidationModels(k);
    const p = validateFirstWorkingModel(candidates, (modelId) =>
      createModel(apiKey, baseUrl, modelId),
    ).then((error) => {
      results[k] = error
        ? { success: false, error: `Invalid ${k} provider key: ${error}` }
        : { success: true };
    });

    promises.push(p);
  }

  await Promise.all(promises);
  return results;
}
