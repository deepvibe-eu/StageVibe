import type { ReactNode } from 'react';
import {
  BrainIcon,
  SettingsIcon,
  FileTextIcon,
  PuzzleIcon,
  GitBranchIcon,
  GlobeIcon,
  Trash2Icon,
  ClockIcon,
  UserIcon,
  InfoIcon,
  PaletteIcon,
  ArchiveIcon,
} from 'lucide-react';
import type { SettingsSection, SettingsRoute } from '@shared/settings-route';
import { SETTINGS_SECTION_LABEL_KEYS } from '@shared/settings-route';

export type SettingsNavGroup = {
  /** i18n key (namespace "settings") for the group heading; '' = no heading. */
  labelKey: string;
  items: SettingsNavItem[];
};

export type SettingsRootSection = Exclude<
  SettingsSection,
  'custom-providers' | 'website-permissions'
>;

export type SettingsNavItem = {
  section: SettingsRootSection;
  icon: ReactNode;
};

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    labelKey: 'nav.groups.assistant',
    items: [
      {
        section: 'agent-general',
        icon: <SettingsIcon className="size-4 shrink-0" />,
      },
      {
        section: 'models-providers',
        icon: <BrainIcon className="size-4 shrink-0" />,
      },
      {
        section: 'skills-context',
        icon: <FileTextIcon className="size-4 shrink-0" />,
      },
      {
        section: 'worktree-setup',
        icon: <GitBranchIcon className="size-4 shrink-0" />,
      },
      {
        section: 'plugins',
        icon: <PuzzleIcon className="size-4 shrink-0" />,
      },
      {
        section: 'archived-agents',
        icon: <ArchiveIcon className="size-4 shrink-0" />,
      },
    ],
  },
  {
    labelKey: 'nav.groups.personal',
    items: [
      {
        section: 'personalization',
        icon: <PaletteIcon className="size-4 shrink-0" />,
      },
    ],
  },
  {
    labelKey: 'nav.groups.browsing',
    items: [
      {
        section: 'browsing',
        icon: <GlobeIcon className="size-4 shrink-0" />,
      },
      {
        section: 'clear-data',
        icon: <Trash2Icon className="size-4 shrink-0" />,
      },
      {
        section: 'history',
        icon: <ClockIcon className="size-4 shrink-0" />,
      },
    ],
  },
  {
    labelKey: '',
    items: [
      {
        section: 'account',
        icon: <UserIcon className="size-4 shrink-0" />,
      },
      {
        section: 'about',
        icon: <InfoIcon className="size-4 shrink-0" />,
      },
    ],
  },
];

export function getSettingsSectionLabelKey(section: SettingsSection): string {
  return SETTINGS_SECTION_LABEL_KEYS[section];
}

export function isSectionActive(
  section: SettingsSection,
  currentRoute: SettingsRoute,
): boolean {
  if (currentRoute.section === 'custom-providers') {
    return section === 'models-providers';
  }

  if (currentRoute.section === 'website-permissions') {
    return section === 'browsing';
  }

  return currentRoute.section === section;
}
