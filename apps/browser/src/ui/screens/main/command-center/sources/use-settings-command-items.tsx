import { useMemo } from 'react';
import {
  IconBrainNodesFillDuo18,
  IconGear3FillDuo18,
  IconHistoryFillDuo18,
  IconNoteFillDuo18,
  IconSpace3dFillDuo18,
} from '@stagewise/icons';
import {
  IconBranchOutOutline18,
  IconKey2Outline18,
  IconServerOutline18,
} from '@stagewise/icons';
import { PaletteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SettingCommandItem } from '../command-center-model';
import {
  commandCenterSettings,
  type CommandCenterSettingDefinition,
} from '../command-center-settings';
import { filterAndRankCommandCenterItems } from '../command-center-search';

function iconForSetting(setting: {
  iconName: CommandCenterSettingDefinition['iconName'];
}) {
  const className = 'size-4';
  switch (setting.iconName) {
    case 'models':
      return <IconBrainNodesFillDuo18 className={className} />;
    case 'key':
      return <IconKey2Outline18 className={className} />;
    case 'provider':
      return <IconServerOutline18 className={className} />;
    case 'context':
      return <IconNoteFillDuo18 className={className} />;
    case 'worktrees':
      return <IconBranchOutOutline18 className={className} />;
    case 'plugins':
      return <IconSpace3dFillDuo18 className={`${className} rotate-180`} />;
    case 'history':
      return <IconHistoryFillDuo18 className={className} />;
    case 'personalization':
      return <PaletteIcon className={className} />;
    case 'settings':
    case 'browser':
      return <IconGear3FillDuo18 className={className} />;
  }
}

export function useSettingsCommandItems(query: string) {
  const { t } = useTranslation('commandCenter');
  const allItems = useMemo<SettingCommandItem[]>(
    () =>
      commandCenterSettings.map(({ key, ...setting }) => ({
        ...setting,
        title: t(`settings.${key}.title`),
        subtitle: t(`settings.${key}.subtitle`),
        kind: 'setting',
        mode: 'settings',
        icon: iconForSetting(setting),
      })),
    [t],
  );

  const items = useMemo(
    () => filterAndRankCommandCenterItems(allItems, query),
    [allItems, query],
  );

  return { items };
}
