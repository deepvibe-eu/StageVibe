import { describe, expect, it, vi } from 'vitest';
import { ChatAgent } from './chat/chat';

describe('BaseAgent manual history compression', () => {
  function makeAgent() {
    const agent = Object.create(ChatAgent.prototype) as any;
    agent.instanceId = 'agent-1';
    Object.defineProperty(agent, 'config', {
      value: {},
      configurable: true,
      writable: true,
    });
    agent._isCompressingHistory = false;
    agent.host = {
      logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
      models: {
        getWithOptions: vi.fn(async () => ({ contextWindowSize: 100_000 })),
      },
    };
    agent.state = { get: () => ({ history: [] }) };
    return agent;
  }

  it('returns "busy" without touching models while a run is in flight', async () => {
    const agent = makeAgent();
    agent._isCompressingHistory = true;

    const result = await agent.requestHistoryCompression();

    expect(result).toEqual({ status: 'busy' });
    expect(agent.host.models.getWithOptions).not.toHaveBeenCalled();
  });

  it('returns "noop" when there is nothing worth compressing', async () => {
    const agent = makeAgent();

    const result = await agent.requestHistoryCompression();

    expect(result).toEqual({
      status: 'noop',
      reason: 'nothing-to-compact',
    });
  });

  it('stores the briefing and refreshes usedTokens for the retained history', async () => {
    const agent = makeAgent();
    const makeMessage = (id: number) => ({
      id: `m${id}`,
      role: id % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: 'x'.repeat(20_000) }],
      metadata: { createdAt: new Date(), partsMetadata: [] },
    });

    let history = Array.from({ length: 40 }, (_, i) => makeMessage(i));
    const originalEstimated = history.reduce(
      (sum) => sum + Math.ceil((20_000 + 400) / 4),
      0,
    );
    agent.state = {
      get: () => ({ history }),
      commands: {
        storeCompressedHistory: vi.fn(() => {
          // Simulate the real state mutation collapsing the compacted prefix.
          history = history.slice(history.length - 3);
          return 'stored';
        }),
        recordUsage: vi.fn(),
      },
    };
    agent.compressHistory = vi.fn(async () => 'A compacted briefing.');
    agent.saveState = vi.fn(async () => {});
    agent.scheduleMemorySnapshotWrite = vi.fn();
    agent.report = vi.fn();

    const result = await agent.requestHistoryCompression();

    expect(result).toEqual({ status: 'compressed' });
    expect(agent.compressHistory).toHaveBeenCalledTimes(1);
    expect(agent.state.commands.storeCompressedHistory).toHaveBeenCalledWith(
      expect.objectContaining({ compressedHistory: 'A compacted briefing.' }),
    );
    expect(agent.state.commands.recordUsage).toHaveBeenCalledTimes(1);
    const { totalTokens } = agent.state.commands.recordUsage.mock.calls[0][0];
    expect(totalTokens).toBeLessThan(originalEstimated);
  });

  it('is a no-op when the kept side already starts with a briefing', async () => {
    const agent = makeAgent();
    const history = Array.from({ length: 40 }, (_, i) => ({
      id: `m${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: 'x'.repeat(20_000) }],
      metadata: { createdAt: new Date(), partsMetadata: [] },
    }));
    // The boundary walk keeps the last few messages; index 37 is the first
    // kept message for this budget. Marking it as already compacted must
    // short-circuit the run.
    (history[37] as any).metadata.compressedHistory = 'prior briefing';

    agent.state = { get: () => ({ history }) };
    agent.compressHistory = vi.fn(async () => 'should not run');

    const result = await agent.requestHistoryCompression();

    expect(result).toEqual({
      status: 'noop',
      reason: 'already-compacted',
    });
    expect(agent.compressHistory).not.toHaveBeenCalled();
  });
});
