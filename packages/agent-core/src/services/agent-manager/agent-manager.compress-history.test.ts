import { describe, expect, it, vi } from 'vitest';
import { AgentManager } from './agent-manager';
import { CommandRegistry } from '../../commands/command-registry';
import { AgentTypeRegistry } from '../../agents/agents-registry';
import { createTestAgentHost } from '../../host/test-utils';

function buildManager() {
  const toolbox = {
    handleMountWorkspace: vi.fn(async () => {}),
    cancelQuestion: vi.fn(),
    getWorkspaceSnapshotForPersistence: vi.fn(() => []),
    finalizePendingEditsForAgent: vi.fn(async () => {}),
    getEditedFilePathsForAgent: vi.fn(async () => []),
    resolveNewAgentMountPath: vi.fn(async (p: string) => p),
  };
  const manager = new AgentManager({
    host: createTestAgentHost(),
    commandRegistry: new CommandRegistry(),
    agentTypeRegistry: new AgentTypeRegistry(),
    startupPolicy: { kind: 'none' },
    state: {
      store: {
        get: vi.fn(() => ({ agents: { instances: {} }, toolbox: {} })),
        update: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      } as any,
    },
    storage: {
      persistenceDb: {
        getLastChatWorkspacePaths: vi.fn(async () => null),
        getLastChatModelSelection: vi.fn(async () => null),
        getAgentHistoryEntries: vi.fn(async () => []),
        getChildAgentInstanceIds: vi.fn(async () => []),
        deleteAgentInstance: vi.fn(async () => {}),
        updateAgentUnread: vi.fn(async () => {}),
        setAgentArchived: vi.fn(async () => {}),
      } as any,
      attachments: { deleteAgentBlobs: vi.fn(async () => {}) } as any,
      fileReadCache: {} as any,
    },
    tools: {
      managerToolbox: toolbox as any,
      agentToolbox: toolbox as any,
    },
  });
  return { manager };
}

describe('agents.compressHistory command', () => {
  it('is registered and forwards the outcome from the active agent', async () => {
    const { manager } = buildManager();
    const requestHistoryCompression = vi.fn(async () => ({
      status: 'compressed' as const,
    }));
    (manager as any).activeAgents.set('agent-1', { requestHistoryCompression });

    const result = await (manager as any).commandRegistry.dispatch(
      'agents.compressHistory',
      { callerId: 'test' },
      ['agent-1'],
    );

    expect(requestHistoryCompression).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'compressed' });
  });

  it('rejects when the agent is not active', async () => {
    const { manager } = buildManager();

    await expect(
      (manager as any).commandRegistry.dispatch(
        'agents.compressHistory',
        { callerId: 'test' },
        ['missing-agent'],
      ),
    ).rejects.toThrow('not found');
  });
});
