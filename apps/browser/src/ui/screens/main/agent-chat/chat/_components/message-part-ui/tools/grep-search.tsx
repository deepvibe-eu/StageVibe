import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconSearchContentOutline18 } from '@stagewise/icons';
import { useTranslation } from 'react-i18next';

export const GrepSearchToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-grepSearch' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const streamingText = part.input?.query
    ? t('grep.searchingFor', { query: part.input.query })
    : t('grep.searchingGrep');
  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 truncate font-medium">
          {t('grep.foundLabel')}
        </span>
        <span className="truncate font-normal opacity-75">
          {t('grep.resultCount', {
            count: part.output?.result?.totalMatches ?? 0,
          })}
          {part.input?.query && t('grep.forQuery', { query: part.input.query })}
        </span>
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconSearchContentOutline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
