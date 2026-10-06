import { useMemo } from 'react';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import {
  IconEyeOutline18,
  IconBookOpenOutline18,
  IconBugOutline18,
  IconTerminalOutline18,
  IconVersionsOutline18,
} from '@stagewise/icons';
import { cn, resolveDisplayPath } from '@ui/utils';
import { useAttachmentMetadata } from '@ui/hooks/use-attachment-metadata';
import { useKartonState } from '@ui/hooks/use-karton';
import { useOpenAgent } from '@ui/hooks/use-open-chat';
import { isLogPath, LOGS_PREFIX } from '@stagewise/agent-core/logs';
import { useTranslation } from 'react-i18next';
import i18n from '@ui/i18n';

const PLUGIN_SKILL_RE = /^plugins\/([^/]+)\/SKILL\.md$/;
const WORKSPACE_SKILL_RE =
  /^[^/]+\/\.(?:stagewise|agents)\/skills\/([^/]+)\/SKILL\.md$/;
const SHELL_LOG_RE = /^shells\/[^/]+\.shell\.log$/;
const MEMORY_RE = /^memory(?:\/|$)/;
const AGENT_MEMORY_RE = /^memory\/agents\/([^/]+)\/([^/]+)$/;

function getMemoryReadLabel(
  relativePath: string,
  currentAgentId: string | null,
): string {
  if (
    relativePath === 'memory/index.md' ||
    relativePath === 'memory/index.json'
  ) {
    return i18n.t('tools:read.memoryIndex');
  }

  const match = relativePath.match(AGENT_MEMORY_RE);
  if (!match) return i18n.t('tools:read.memoryFile');

  const [, agentId, filename] = match;
  const subject =
    agentId === currentAgentId
      ? ''
      : i18n.t('tools:read.memoryOf', { agentId });

  if (filename === 'metadata.json') {
    return `${i18n.t('tools:read.memoryMetadata')}${subject}`;
  }
  if (filename === 'history.md' || filename === 'history.jsonl') {
    return `${i18n.t('tools:read.memoryContent')}${subject}`;
  }

  return `${i18n.t('tools:read.memoryFile')}${subject}`;
}

export const ReadToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-read' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const plugins = useKartonState((s) => s.plugins);
  const [openAgent] = useOpenAgent();
  const relativePath = part.input?.path ?? '';

  const pluginMatch = useMemo(() => {
    const match = relativePath.match(PLUGIN_SKILL_RE);
    if (!match) return null;
    const plugin = plugins.find((p) => p.id === match[1]);
    return plugin ?? null;
  }, [relativePath, plugins]);

  const workspaceSkillName = useMemo(() => {
    const match = relativePath.match(WORKSPACE_SKILL_RE);
    return match?.[1] ?? null;
  }, [relativePath]);

  const logChannelName = useMemo(() => {
    if (!isLogPath(relativePath)) return null;
    return relativePath
      .replace(new RegExp(`^${LOGS_PREFIX}/`), '')
      .replace(/\.jsonl$/, '');
  }, [relativePath]);

  const isShellLog = useMemo(
    () => SHELL_LOG_RE.test(relativePath),
    [relativePath],
  );

  const isMemoryPath = useMemo(
    () => MEMORY_RE.test(relativePath),
    [relativePath],
  );

  const attachmentMetadata = useAttachmentMetadata();
  const displayPath = relativePath
    ? resolveDisplayPath(relativePath, attachmentMetadata)
    : undefined;

  if (pluginMatch) {
    const streamingText = t('read.enabling', {
      name: pluginMatch.displayName,
    });

    const finishedText =
      part.state === 'output-available' ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0 font-medium">{t('read.enabled')}</span>
          <span className="truncate font-normal opacity-75">
            {pluginMatch.displayName}
          </span>
        </span>
      ) : undefined;

    const icon = pluginMatch.logoSvg ? (
      <div
        className={cn(
          'size-3 shrink-0 overflow-hidden text-foreground [&>svg]:size-full',
        )}
        dangerouslySetInnerHTML={{ __html: pluginMatch.logoSvg }}
      />
    ) : (
      <IconEyeOutline18 className="size-3 shrink-0" />
    );

    return (
      <ToolPartUINotCollapsible
        icon={icon}
        part={part}
        minimal={minimal}
        disableShimmer={disableShimmer}
        streamingText={streamingText}
        finishedText={finishedText}
      />
    );
  }

  if (workspaceSkillName) {
    const streamingText = t('read.enabling', { name: workspaceSkillName });

    const finishedText =
      part.state === 'output-available' ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0 font-medium">{t('read.enabled')}</span>
          <span className="truncate font-normal opacity-75">
            {workspaceSkillName}
          </span>
        </span>
      ) : undefined;

    return (
      <ToolPartUINotCollapsible
        icon={<IconBookOpenOutline18 className="size-3 shrink-0" />}
        part={part}
        minimal={minimal}
        disableShimmer={disableShimmer}
        streamingText={streamingText}
        finishedText={finishedText}
      />
    );
  }

  if (logChannelName) {
    const streamingText = t('read.readingLog', { name: logChannelName });

    const finishedText =
      part.state === 'output-available' ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0 font-medium">{t('read.readLog')}</span>
          <span className="truncate font-normal opacity-75">
            {logChannelName}
          </span>
        </span>
      ) : undefined;

    return (
      <ToolPartUINotCollapsible
        icon={<IconBugOutline18 className="size-3 shrink-0" />}
        part={part}
        minimal={minimal}
        disableShimmer={disableShimmer}
        streamingText={streamingText}
        finishedText={finishedText}
      />
    );
  }

  if (isShellLog) {
    const streamingText = t('read.readingShellOutput');

    const finishedText =
      part.state === 'output-available' ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0 font-medium">
            {t('read.readShellOutput')}
          </span>
        </span>
      ) : undefined;

    return (
      <ToolPartUINotCollapsible
        icon={<IconTerminalOutline18 className="size-3 shrink-0" />}
        part={part}
        minimal={minimal}
        disableShimmer={disableShimmer}
        streamingText={streamingText}
        finishedText={finishedText}
      />
    );
  }

  if (isMemoryPath) {
    const memoryReadLabel = getMemoryReadLabel(relativePath, openAgent);
    const streamingText = t('read.readingMemory', {
      label: memoryReadLabel,
    });

    const finishedText =
      part.state === 'output-available' ? (
        <span className="flex min-w-0 gap-1">
          <span className="shrink-0 font-medium">{t('read.readMemory')}</span>
          <span className="truncate font-normal opacity-75">
            {memoryReadLabel}
          </span>
        </span>
      ) : undefined;

    return (
      <ToolPartUINotCollapsible
        icon={<IconVersionsOutline18 className="size-3 shrink-0" />}
        part={part}
        minimal={minimal}
        disableShimmer={disableShimmer}
        streamingText={streamingText}
        finishedText={finishedText}
      />
    );
  }

  const streamingText = displayPath
    ? t('read.readingPath', { path: displayPath })
    : t('read.readingFile');

  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 truncate font-medium">{t('read.read')}</span>
        <span className="truncate font-normal opacity-75">
          {displayPath ?? ''}
        </span>
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconEyeOutline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
