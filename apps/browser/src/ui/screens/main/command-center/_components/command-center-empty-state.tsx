import { useTranslation } from 'react-i18next';

export function CommandCenterEmptyState({
  isLoading,
}: {
  isLoading?: boolean;
}) {
  const { t } = useTranslation('commandCenter');
  return (
    <div className="px-3 py-6 text-center text-muted-foreground text-xs">
      {isLoading ? t('loading') : t('noResults')}
    </div>
  );
}
