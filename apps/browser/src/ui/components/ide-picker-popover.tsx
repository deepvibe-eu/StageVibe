import { useMemo, type ReactElement } from 'react';
import { Select, type SelectItem } from '@stagewise/stage-ui/components/select';
import { useTranslation } from 'react-i18next';
import { IdeLogo } from '@ui/components/ide-logo';
import { IDE_SELECTION_ITEMS } from '@ui/utils';
import type { OpenFilesInIde } from '@shared/karton-contracts/ui/shared-types';

export function IdePickerPopover({
  children,
  onSelect,
}: {
  children: ReactElement;
  onSelect: (ide: OpenFilesInIde) => void;
}) {
  const { t } = useTranslation('ui');
  const items: SelectItem<OpenFilesInIde>[] = useMemo(
    () => [
      { value: 'cursor', label: 'Cursor', group: t('idePicker.group') },
      { value: 'vscode', label: 'VS Code', group: t('idePicker.group') },
      { value: 'zed', label: 'Zed', group: t('idePicker.group') },
      { value: 'kiro', label: 'Kiro', group: t('idePicker.group') },
      { value: 'windsurf', label: 'Windsurf', group: t('idePicker.group') },
      { value: 'trae', label: 'Trae', group: t('idePicker.group') },
      {
        value: 'fileManager',
        label: IDE_SELECTION_ITEMS.fileManager,
        group: t('idePicker.group'),
      },
    ],
    [t],
  );

  const itemsWithIcons: SelectItem<OpenFilesInIde>[] = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        icon: <IdeLogo ide={item.value} className="size-4" />,
      })),
    [items],
  );

  return (
    <Select<OpenFilesInIde>
      items={itemsWithIcons}
      onValueChange={(value) => onSelect(value)}
      placeholder={t('idePicker.placeholder')}
      size="xs"
      side="top"
      sideOffset={6}
      align="start"
      showItemIndicator={false}
      customTrigger={(triggerProps) => (
        <button type="button" {...triggerProps}>
          {children}
        </button>
      )}
    />
  );
}
