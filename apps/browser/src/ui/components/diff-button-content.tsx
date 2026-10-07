import { GitBranchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DiffLineStats } from '@ui/components/diff-line-stats';

export function DiffButtonContent({
  added,
  removed,
  showLabel = true,
}: {
  added: number;
  removed: number;
  showLabel?: boolean;
}) {
  const { t } = useTranslation('ui');
  return (
    <>
      <GitBranchIcon className="size-3.5 shrink-0" />
      {showLabel && <span>{t('diff.label')}</span>}
      <DiffLineStats added={added} removed={removed} stacked />
    </>
  );
}
