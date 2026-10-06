import { useMemo } from 'react';
import type { WritePart } from '.';
import { ToolPartUINotCollapsible } from '../shared/tool-part-ui-not-collapsible';
import { IconBugOutline18 } from '@stagewise/icons';
import { stripMountPrefix } from '@ui/utils';
import { LOGS_PREFIX } from '@stagewise/agent-core/logs';
import { useTranslation } from 'react-i18next';

export const CreateLogToolPart = ({ part }: { part: WritePart }) => {
  const { t } = useTranslation('tools');
  const channelName = useMemo(() => {
    const raw = stripMountPrefix(part.input?.path ?? '');
    return raw
      .replace(new RegExp(`^${LOGS_PREFIX}/`), '')
      .replace(/\.jsonl$/, '');
  }, [part.input?.path]);

  const streamingText = t('logTool.creating', { channel: channelName });

  const finishedText =
    part.state === 'output-available' ? (
      <span className="flex min-w-0 gap-1">
        <span className="shrink-0 font-medium">{t('logTool.enabled')}</span>
        <span className="truncate font-normal opacity-75">
          {t('logTool.channelLog', { channel: channelName })}
        </span>
      </span>
    ) : undefined;

  return (
    <ToolPartUINotCollapsible
      icon={<IconBugOutline18 className="size-3 shrink-0" />}
      part={part}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
