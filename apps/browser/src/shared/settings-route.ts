export type SettingsSection =
  | 'models-providers'
  | 'custom-providers'
  | 'agent-general'
  | 'skills-context'
  | 'worktree-setup'
  | 'plugins'
  | 'personalization'
  | 'browsing'
  | 'history'
  | 'archived-agents'
  | 'website-permissions'
  | 'clear-data'
  | 'account'
  | 'about';

export type SettingsRoute =
  | { section: Exclude<SettingsSection, 'website-permissions'> }
  | { section: 'website-permissions'; host: string };

// i18n keys (namespace: "settings") for each section's navigation label.
// Resolve them with t(SETTINGS_SECTION_LABEL_KEYS[section]) in the "settings"
// namespace. Kept as keys here so the shared module stays free of i18n state.
export const SETTINGS_SECTION_LABEL_KEYS: Record<SettingsSection, string> = {
  'models-providers': 'nav.sections.modelsProviders',
  'custom-providers': 'nav.sections.customProviders',
  'agent-general': 'nav.sections.general',
  'skills-context': 'nav.sections.skillsContext',
  'worktree-setup': 'nav.sections.worktreeSetup',
  plugins: 'nav.sections.plugins',
  personalization: 'nav.sections.personalization',
  browsing: 'nav.sections.browsing',
  history: 'nav.sections.history',
  'archived-agents': 'nav.sections.archivedAgents',
  'website-permissions': 'nav.sections.websitePermissions',
  'clear-data': 'nav.sections.clearData',
  account: 'nav.sections.account',
  about: 'nav.sections.about',
};
