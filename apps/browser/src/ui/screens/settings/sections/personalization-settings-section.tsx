import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import { Select } from '@stagewise/stage-ui/components/select';
import { PERSONALIZATION_THEMES } from '@shared/personalization-themes';
import type { AppColorScheme } from '@shared/karton-contracts/ui/shared-types';
import { useKartonProcedure, useKartonState } from '@ui/hooks/use-karton';
import { useThemeSelection } from '@ui/hooks/use-theme-selection';
import { ThemeBadge } from '@ui/components/theme-badge';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@ui/i18n';
import { enablePatches } from 'immer';
import { useTranslation } from 'react-i18next';
import { NotificationsSetting } from './general-settings-section';

enablePatches();

const APP_COLOR_SCHEME_VALUES: AppColorScheme[] = ['system', 'light', 'dark'];

function AppColorSchemeSetting() {
  const { t } = useTranslation('settings');
  const appColorScheme = useKartonState(
    (s) => s.globalConfig.appColorScheme ?? 'system',
  );
  const setGlobalConfig = useKartonProcedure((p) => p.config.set);

  const handleAppColorSchemeChange = async (value: AppColorScheme) => {
    await setGlobalConfig({ appColorScheme: value });
  };

  const items = APP_COLOR_SCHEME_VALUES.map((value) => ({
    value,
    label: t(`personalization.appearance.${value}`),
  }));

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="font-medium text-base text-foreground">
          {t('personalization.appearance.title')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('personalization.appearance.description')}
        </p>
      </div>

      <Select
        value={appColorScheme}
        onValueChange={(value) =>
          handleAppColorSchemeChange(value as AppColorScheme)
        }
        items={items}
        triggerVariant="secondary"
        size="xs"
        triggerClassName="w-auto min-w-32 px-2 py-3"
        side="bottom"
        align="end"
      />
    </div>
  );
}

function ThemeSetting() {
  const { t } = useTranslation('settings');
  const { currentThemeId, handleThemeChange } = useThemeSelection();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-base text-foreground">
          {t('personalization.colorScheme.title')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('personalization.colorScheme.description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3" role="radiogroup">
        {PERSONALIZATION_THEMES.map((theme) => {
          const active = theme.id === currentThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              className="group rounded-lg"
              onClick={() => handleThemeChange(theme.id)}
              aria-checked={active}
              aria-label={t('personalization.colorScheme.useTheme', {
                name: theme.name,
              })}
              role="radio"
              title={theme.name}
            >
              <ThemeBadge
                themeId={theme.id}
                name={theme.name}
                active={active}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageSetting() {
  const { t } = useTranslation('settings');
  const items = SUPPORTED_LANGUAGES.map((language) => ({
    value: language.code,
    label: language.label,
  }));
  const currentLanguage = (i18n.resolvedLanguage ??
    i18n.language) as SupportedLanguage;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="font-medium text-base text-foreground">
          {t('personalization.language.title')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('personalization.language.description')}
        </p>
      </div>

      <Select
        value={currentLanguage}
        onValueChange={(value) => {
          void i18n.changeLanguage(value);
        }}
        items={items}
        triggerVariant="secondary"
        size="xs"
        triggerClassName="w-auto min-w-32 px-2 py-3"
        side="bottom"
        align="end"
      />
    </div>
  );
}

export function PersonalizationSettingsSection() {
  const { t } = useTranslation('settings');

  return (
    <div className="h-full w-full">
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="font-semibold text-foreground text-xl">
              {t('personalization.title')}
            </h1>
          </div>

          <section className="space-y-6">
            <AppColorSchemeSetting />
            <ThemeSetting />
            <LanguageSetting />
          </section>

          <hr className="border-derived-subtle border-t" />

          <section className="space-y-6">
            <NotificationsSetting />
          </section>

          <hr className="border-derived-subtle border-t" />
        </div>
      </OverlayScrollbar>
    </div>
  );
}
