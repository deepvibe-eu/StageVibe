import { useCallback } from 'react';
import { Button } from '@stagewise/stage-ui/components/button';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import { Select } from '@stagewise/stage-ui/components/select';
import { useKartonState, useKartonProcedure } from '@ui/hooks/use-karton';
import { produceWithPatches, enablePatches } from 'immer';
import { ChevronLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConfigurablePermissionType } from '@shared/karton-contracts/ui/shared-types';
import {
  PermissionSetting,
  configurablePermissionTypes,
} from '@shared/karton-contracts/ui/shared-types';

enablePatches();

/** i18n key suffixes for permission settings */
const PERMISSION_SETTING_KEYS: Record<PermissionSetting, string> = {
  [PermissionSetting.Ask]: 'ask',
  [PermissionSetting.Allow]: 'allow',
  [PermissionSetting.Block]: 'block',
};

export function WebsitePermissionsSection() {
  const { t } = useTranslation('settings');
  const settingsRoute = useKartonState((s) => s.appScreen.settingsRoute);
  const host =
    settingsRoute.section === 'website-permissions' ? settingsRoute.host : '';
  const setSettingsRoute = useKartonProcedure(
    (p) => p.appScreen.setSettingsRoute,
  );
  const preferences = useKartonState((s) => s.preferences);
  const updatePreferences = useKartonProcedure((p) => p.preferences.update);

  // Get the current setting for a permission type for this host
  const getHostSetting = useCallback(
    (permissionType: ConfigurablePermissionType): PermissionSetting | -1 => {
      const exception =
        preferences.permissions?.exceptions?.[permissionType]?.[host];
      if (exception !== undefined) {
        return exception.setting;
      }
      return -1; // Default (no override)
    },
    [preferences, host],
  );

  // Get the effective default setting for a permission type
  const getDefaultSetting = useCallback(
    (permissionType: ConfigurablePermissionType): PermissionSetting => {
      return (
        preferences.permissions?.defaults?.[permissionType] ??
        PermissionSetting.Ask
      );
    },
    [preferences],
  );

  const handlePermissionChange = useCallback(
    async (permissionType: ConfigurablePermissionType, value: string) => {
      const settingValue = Number.parseInt(value, 10);

      const [, patches] = produceWithPatches(preferences, (draft) => {
        // Ensure structure exists
        if (!draft.permissions) {
          draft.permissions = {
            defaults: {},
            exceptions: {},
          } as typeof draft.permissions;
        }
        if (!draft.permissions.exceptions) {
          draft.permissions.exceptions =
            {} as typeof draft.permissions.exceptions;
        }
        if (!draft.permissions.exceptions[permissionType]) {
          draft.permissions.exceptions[permissionType] = {};
        }

        if (settingValue === -1) {
          // Remove the override (set to default)
          delete draft.permissions.exceptions[permissionType][host];
        } else {
          // Set the override
          draft.permissions.exceptions[permissionType][host] = {
            setting: settingValue as PermissionSetting,
            lastModified: Date.now(),
          };
        }
      });

      await updatePreferences(patches);
    },
    [preferences, updatePreferences, host],
  );

  // Permissions that require device selection - "Allow" doesn't make sense
  const deviceSelectionPermissions: ConfigurablePermissionType[] = [
    'bluetooth',
    'hid',
    'serial',
    'usb',
  ];

  // Options for the select dropdown
  const getSettingOptions = useCallback(
    (permissionType: ConfigurablePermissionType) => {
      const defaultSetting = getDefaultSetting(permissionType);
      const defaultLabel = t(
        `websitePermissions.settings.${PERMISSION_SETTING_KEYS[defaultSetting]}`,
      );
      const isDevicePermission =
        deviceSelectionPermissions.includes(permissionType);

      const options = [
        {
          value: '-1',
          label: t('websitePermissions.settings.default'),
          description: t('websitePermissions.optionDefaultDescription', {
            label: defaultLabel,
          }),
        },
        {
          value: String(PermissionSetting.Ask),
          label: t('websitePermissions.settings.ask'),
          description: t('websitePermissions.optionAskDescription'),
        },
      ];

      // Only add "Allow" for non-device permissions
      if (!isDevicePermission) {
        options.push({
          value: String(PermissionSetting.Allow),
          label: t('websitePermissions.settings.allow'),
          description: t('websitePermissions.optionAllowDescription'),
        });
      }

      options.push({
        value: String(PermissionSetting.Block),
        label: t('websitePermissions.settings.block'),
        description: t('websitePermissions.optionBlockDescription'),
      });

      return options;
    },
    [getDefaultSetting, t],
  );

  // Count how many overrides are set for this host
  const overrideCount = configurablePermissionTypes.filter(
    (type) => getHostSetting(type) !== -1,
  ).length;

  if (!host) {
    return (
      <div className="h-full w-full">
        {/* Content */}
        <OverlayScrollbar
          className="h-full"
          contentClassName="px-6 pt-24 pb-24"
        >
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSettingsRoute({ section: 'browsing' })}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <h1 className="font-semibold text-foreground text-xl">
                {t('websitePermissions.title')}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t('websitePermissions.noSiteSelected')}
            </p>
          </div>
        </OverlayScrollbar>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* Content */}
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSettingsRoute({ section: 'browsing' })}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-foreground text-xl">
                {t('websitePermissions.title')}
              </h1>
              <span className="text-muted-foreground text-sm">{host}</span>
            </div>
          </div>
          {/* Summary */}
          <div className="rounded-lg border border-border/30 bg-surface-1/50 p-4">
            <p className="text-muted-foreground text-sm">
              {overrideCount === 0 ? (
                t('websitePermissions.summaryNone')
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {overrideCount}
                  </span>{' '}
                  {t('websitePermissions.summaryCount', {
                    count: overrideCount,
                  })}
                </>
              )}
            </p>
          </div>

          {/* Permission Settings */}
          <section className="space-y-4">
            <div>
              <h2 className="font-medium text-foreground text-lg">
                {t('websitePermissions.permissionSettingsTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('websitePermissions.permissionSettingsDescription')}
              </p>
            </div>

            <div className="space-y-3">
              {configurablePermissionTypes.map((permissionType) => {
                const currentSetting = getHostSetting(permissionType);
                const isOverridden = currentSetting !== -1;

                return (
                  <div
                    key={permissionType}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors ${
                      isOverridden
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/30'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">
                        {t(`websitePermissions.types.${permissionType}`)}
                      </span>
                      {isOverridden && (
                        <span className="text-primary text-xs">
                          {t('websitePermissions.customSetting')}
                        </span>
                      )}
                    </div>
                    <Select
                      value={String(currentSetting)}
                      onValueChange={(value) =>
                        handlePermissionChange(permissionType, value)
                      }
                      triggerVariant="secondary"
                      size="sm"
                      triggerClassName="w-32"
                      items={getSettingOptions(permissionType)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </OverlayScrollbar>
    </div>
  );
}
