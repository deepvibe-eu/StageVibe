import { useMemo } from 'react';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconFolderPlusOutline18 } from '@stagewise/icons';
import { stripMountPrefix } from '@ui/utils';
import { useTranslation } from 'react-i18next';

export const MkdirToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-mkdir' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const dirPath = part.input?.path ?? '';
  const displayPath = dirPath ? stripMountPrefix(dirPath) : undefined;

  const icon = <IconFolderPlusOutline18 className="size-3 shrink-0" />;

  const streamingText = useMemo(() => {
    if (displayPath) return t('mkdir.creatingPath', { path: displayPath });
    return t('mkdir.creating');
  }, [displayPath, t]);

  const finishedText = useMemo(() => {
    if (part.state !== 'output-available') return undefined;
    return (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 font-medium">{t('mkdir.created')}</span>
        <span className="truncate font-normal opacity-75">
          {displayPath ?? ''}
        </span>
      </span>
    );
  }, [part.state, displayPath, t]);

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
};
