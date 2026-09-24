import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentMessage } from '../../types/agent';
import type { HostModels, ModelWithOptions } from '../../host/models';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

import { generateText } from 'ai';
import {
  COMPRESSION_MAX_CHUNKS,
  generateSimpleCompressedHistory,
  splitCompactHistoryIntoChunks,
} from './history-compression';

const generateTextMock = vi.mocked(generateText);

const CHAR_BUDGET = 240_000; // COMPRESSION_INPUT_TOKEN_BUDGET * 4

function makeMockHostModels(): HostModels {
  return {
    getWithOptions: vi.fn(
      async (): Promise<ModelWithOptions> => ({
        model: { id: 'mock-model' } as unknown as ModelWithOptions['model'],
        providerOptions: {},
        headers: {},
        contextWindowSize: 1_000_000,
        providerMode: 'stagewise',
        reasoningSignatureSource: {
          providerMode: 'stagewise',
          provider: 'anthropic',
          modelId: 'anthropic/claude-sonnet-4.6',
        },
      }),
    ),
    get: vi.fn(),
    has: vi.fn().mockReturnValue(true),
  } as unknown as HostModels;
}

function makeUserMessage(id: string, chars: number): AgentMessage {
  return {
    id,
    role: 'user',
    parts: [{ type: 'text', text: 'x'.repeat(chars) }],
    metadata: { createdAt: new Date(), partsMetadata: [] },
  } as AgentMessage;
}

beforeEach(() => {
  generateTextMock.mockReset();
});

describe('splitCompactHistoryIntoChunks', () => {
  it('returns a single chunk when the input fits the budget', () => {
    const input = '<user>hello</user>\n<assistant>hi</assistant>';
    expect(splitCompactHistoryIntoChunks(input, CHAR_BUDGET)).toEqual([input]);
  });

  it('splits at block boundaries without breaking XML tags', () => {
    const input = [makeUserMessage('a', 100_000), makeUserMessage('b', 100_000)]
      .map((m) => `<user>${(m.parts[0] as { text: string }).text}</user>`)
      .join('\n');

    const chunks = splitCompactHistoryIntoChunks(input, 150_000);

    expect(chunks.length).toBe(2);
    for (const chunk of chunks) {
      expect(chunk.startsWith('<user>')).toBe(true);
      expect(chunk.endsWith('</user>')).toBe(true);
    }
    expect(chunks.join('\n')).toBe(input);
  });

  it('splits a single oversized block without dropping content', () => {
    const text = 'y'.repeat(CHAR_BUDGET + 50_000);
    const input = `<user>${text}</user>`;

    const chunks = splitCompactHistoryIntoChunks(input, CHAR_BUDGET);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(CHAR_BUDGET);
    }
    const restored = chunks.join('').replace(/<\/?user>/g, '');
    expect(restored).toBe(text);
  });

  it('splits oversized blocks at newline boundaries first', () => {
    const half = 'z'.repeat(CHAR_BUDGET);
    const input = `<assistant>${half}\n${half}\n${half}</assistant>`;

    const chunks = splitCompactHistoryIntoChunks(input, CHAR_BUDGET);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(CHAR_BUDGET);
    }
  });

  it('caps the number of chunks for very large inputs', () => {
    const input = Array.from(
      { length: 40 },
      (_, i) => `<user>${'q'.repeat(30_000)}-${i}</user>`,
    ).join('\n');

    const chunks = splitCompactHistoryIntoChunks(
      input,
      Math.max(CHAR_BUDGET, Math.ceil(input.length / COMPRESSION_MAX_CHUNKS)),
    );

    expect(chunks.length).toBeLessThanOrEqual(COMPRESSION_MAX_CHUNKS);
  });
});

describe('generateSimpleCompressedHistory chunked path', () => {
  it('uses a single call when the serialized history fits the budget', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'A sufficiently long single-pass briefing for the small history.',
    } as any);

    const hostModels = makeMockHostModels();
    await generateSimpleCompressedHistory(
      [makeUserMessage('a', 100), makeUserMessage('b', 100)],
      hostModels,
      'agent-1',
    );

    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('maps segments and merges when the history exceeds the budget', async () => {
    generateTextMock
      .mockResolvedValueOnce({
        text: 'Partial briefing for segment one.',
      } as any)
      .mockResolvedValueOnce({
        text: 'Partial briefing for segment two.',
      } as any)
      .mockResolvedValueOnce({
        text: 'Merged briefing combining both segments into one memory.',
      } as any);

    const hostModels = makeMockHostModels();
    const result = await generateSimpleCompressedHistory(
      [
        makeUserMessage('a', 100_000),
        makeUserMessage('b', 100_000),
        makeUserMessage('c', 100_000),
      ],
      hostModels,
      'agent-1',
    );

    expect(result).toBe(
      'Merged briefing combining both segments into one memory.',
    );
    expect(generateTextMock).toHaveBeenCalledTimes(3);

    const systemPrompts = generateTextMock.mock.calls.map(
      (call) => (call[0] as any).system,
    );
    // First two calls are segment summaries, the last one is the merge.
    expect(systemPrompts[0]).toContain('partial');
    expect(systemPrompts[1]).toContain('partial');
    expect(systemPrompts[2]).toContain('merging');
  });

  it('splits a single oversized block into bounded calls instead of truncating', async () => {
    generateTextMock
      .mockResolvedValueOnce({
        text: 'Partial briefing for the first half.',
      } as any)
      .mockResolvedValueOnce({
        text: 'Partial briefing for the second half.',
      } as any)
      .mockResolvedValueOnce({
        text: 'Merged briefing from both halves.',
      } as any);

    const hostModels = makeMockHostModels();
    const result = await generateSimpleCompressedHistory(
      [makeUserMessage('a', CHAR_BUDGET + 50_000)],
      hostModels,
      'agent-1',
    );

    expect(result).toBe('Merged briefing from both halves.');
    expect(generateTextMock).toHaveBeenCalledTimes(3);
    for (const call of generateTextMock.mock.calls) {
      const userMessage = (call[0] as any).messages.find(
        (m: any) => m.role === 'user',
      ).content as string;
      expect(userMessage.length).toBeLessThanOrEqual(CHAR_BUDGET + 2_000);
    }
  });
});
