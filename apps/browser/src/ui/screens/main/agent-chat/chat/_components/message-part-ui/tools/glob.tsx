import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconFileSearchOutline18 } from '@stagewise/icons';
import { useTranslation } from 'react-i18next';

export const GlobToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-glob' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const streamingText = part.input?.pattern
    ? t('glob.searchingFor', { pattern: part.input.pattern })
    : t('glob.searchingFiles');

  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 truncate font-medium">
          {t('glob.foundLabel')}
        </span>
        <span className="truncate font-normal opacity-75">
          {t('glob.fileCount', {
            count: part.output?.result?.totalMatches ?? 0,
          })}
          {part.input?.pattern &&
            t('glob.matching', { pattern: part.input.pattern })}
        </span>
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconFileSearchOutline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
