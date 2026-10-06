import { useMemo } from 'react';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconFolder5Outline18 } from '@stagewise/icons';
import { stripMountPrefix } from '@ui/utils';
import { useTranslation } from 'react-i18next';

export const LsToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-ls' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const dirPath = part.input?.path ?? '';
  const displayPath = dirPath ? stripMountPrefix(dirPath) : undefined;

  const streamingText = useMemo(() => {
    if (displayPath) return t('ls.listingPath', { path: displayPath });
    return t('ls.listing');
  }, [displayPath, t]);

  const finishedText = useMemo(() => {
    if (part.state !== 'output-available') return undefined;
    return (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 font-medium">{t('ls.listed')}</span>
        <span className="truncate font-normal opacity-75">
          {displayPath ?? ''}
        </span>
      </span>
    );
  }, [part.state, displayPath, t]);

  return (
    <ToolPartUINotCollapsible
      icon={<IconFolder5Outline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
