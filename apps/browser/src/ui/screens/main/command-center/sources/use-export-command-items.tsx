import { useMemo } from 'react';
import { IconCopyOutline18, IconDownload4Outline18 } from '@stagewise/icons';
import { useOpenAgent } from '@ui/hooks/use-open-chat';
import { useTranslation } from 'react-i18next';
import type { ActionCommandItem } from '../command-center-model';
import { filterAndRankCommandCenterItems } from '../command-center-search';

/**
 * Command-center entries for exporting the currently open conversation.
 * Only offered while a chat is open; the actual work happens in the command
 * center's `executeItem` via the shared Markdown export helpers.
 */
export function useExportCommandItems(query: string) {
  const { t } = useTranslation('commandCenter');
  const [openAgent] = useOpenAgent();
  const enabled = openAgent !== null && openAgent !== undefined;

  const allItems = useMemo<ActionCommandItem[]>(
    () => [
      {
        id: 'export-chat-markdown',
        kind: 'action',
        mode: 'global',
        title: t('exportMarkdown'),
        subtitle: t('exportMarkdownSubtitle'),
        keywords: ['export', 'markdown', 'chat', 'conversation', 'save', 'md'],
        icon: <IconDownload4Outline18 className="size-4" />,
      },
      {
        id: 'copy-chat-markdown',
        kind: 'action',
        mode: 'global',
        title: t('copyMarkdown'),
        subtitle: t('copyMarkdownSubtitle'),
        keywords: ['copy', 'markdown', 'chat', 'conversation', 'clipboard'],
        icon: <IconCopyOutline18 className="size-4" />,
      },
    ],
    [t],
  );

  const items = useMemo(
    () => (enabled ? filterAndRankCommandCenterItems(allItems, query) : []),
    [allItems, enabled, query],
  );

  return { items };
}
