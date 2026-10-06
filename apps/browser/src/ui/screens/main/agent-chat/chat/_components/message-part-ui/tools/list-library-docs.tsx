import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconBooks2Outline18 } from '@stagewise/icons';
import { useTranslation } from 'react-i18next';

export const ListLibraryDocsToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-listLibraryDocs' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const streamingText = part.input?.name
    ? t('docs.searchLatestFor', { name: part.input.name })
    : t('docs.searchLatest');

  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 truncate font-semibold">
          {t('docs.foundLabel')}
        </span>
        <span className="truncate font-normal">
          {t('docs.foundDocs', {
            count: part.output?.results.length ?? 0,
            name: part.input?.name,
          })}
        </span>
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconBooks2Outline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
