import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconBookOpen5Outline18 } from '@stagewise/icons';
import { useTranslation } from 'react-i18next';

export const SearchInLibraryDocsToolPart = ({
  part,
  disableShimmer = false,
  minimal = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-searchInLibraryDocs' }>;
  disableShimmer?: boolean;
  minimal?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const streamingText = part.input?.libraryId
    ? t('docs.readingLatestFor', { libraryId: part.input.libraryId })
    : t('docs.readingLatest');

  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 truncate font-medium">
          {t('docs.readLatest')}
        </span>
        {part.input?.libraryId && (
          <span className="truncate font-normal opacity-75">
            {t('docs.forLibrary', { libraryId: part.input.libraryId })}
          </span>
        )}
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconBookOpen5Outline18 className="size-3 shrink-0" />}
      part={part}
      minimal={minimal}
      disableShimmer={disableShimmer}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
