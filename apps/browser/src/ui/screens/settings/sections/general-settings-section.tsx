import { Button } from '@stagewise/stage-ui/components/button';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import { Select } from '@stagewise/stage-ui/components/select';
import { Slider } from '@stagewise/stage-ui/components/slider';
import { Switch } from '@stagewise/stage-ui/components/switch';
import { toast } from '@stagewise/stage-ui/components/toaster';
import { useKartonState, useKartonProcedure } from '@ui/hooks/use-karton';
import {
  useSoundSettings,
  NOTIFICATION_LOUDNESS_OPTIONS,
} from '@ui/hooks/use-sound-settings';
import { PlayIcon, TriangleAlertIcon, UploadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// =============================================================================
// Power Save Blocker Setting Component
// =============================================================================

function PowerSaveBlockerSetting() {
  const { t } = useTranslation('settings');
  const globalConfig = useKartonState((s) => s.globalConfig);
  const isMacOs = useKartonState((s) => s.appInfo.platform === 'darwin');
  const setGlobalConfig = useKartonProcedure((p) => p.config.set);

  const isEnabled = globalConfig.blockAppSuspensionWhenAgentsActive ?? true;

  const handleChange = async (checked: boolean) => {
    await setGlobalConfig({
      blockAppSuspensionWhenAgentsActive: checked,
    });
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <label htmlFor="agent-power-save-blocker">
          <h3 className="font-medium text-base text-foreground">
            {t('general.powerSave.title')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('general.powerSave.description')}
          </p>
        </label>

        {isMacOs && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-warning-background/45 p-2 text-warning-foreground text-xs leading-snug ring-1 ring-warning-solid/20">
            <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" />
            <p>{t('general.powerSave.macNote')}</p>
          </div>
        )}
      </div>

      <Switch
        id="agent-power-save-blocker"
        checked={isEnabled}
        onCheckedChange={handleChange}
        size="xs"
        className="mt-1 shrink-0"
      />
    </div>
  );
}

// =============================================================================
// Notifications Setting Component
// =============================================================================

export function NotificationsSetting() {
  const { t } = useTranslation('settings');
  const globalConfig = useKartonState((s) => s.globalConfig);
  const isMacOs = useKartonState((s) => s.appInfo.platform === 'darwin');
  const setGlobalConfig = useKartonProcedure((p) => p.config.set);
  const importSoundPack = useKartonProcedure((p) => p.config.importSoundPack);

  const {
    soundLoudness,
    currentPack,
    soundPackItems,
    loudnessIndex,
    previewSound,
    handleLoudnessChange,
    handleSoundPackChange,
  } = useSoundSettings();

  const handleImportSoundPack = async () => {
    try {
      const result = await importSoundPack();
      if ('error' in result) {
        if (result.error) {
          toast({
            id: `import-sound-pack-error-${Date.now()}`,
            title: t('general.notifications.importFailed'),
            message: result.error,
            type: 'error',
            actions: [],
          });
        }
        return;
      }

      toast({
        id: `import-sound-pack-success-${Date.now()}`,
        title: t('general.notifications.importedTitle'),
        message: t('general.notifications.importedMessage', {
          name: result.name,
        }),
        type: 'info',
        duration: 4000,
        actions: [],
      });
    } catch (err) {
      toast({
        id: `import-sound-pack-error-${Date.now()}`,
        title: t('general.notifications.importFailed'),
        message:
          err instanceof Error
            ? err.message
            : t('general.notifications.importFailedFallback'),
        type: 'error',
        actions: [],
      });
    }
  };

  const handleDockBounceChange = async (checked: boolean) => {
    await setGlobalConfig({
      dockBounceEnabled: checked,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-base text-foreground">
          {t('general.notifications.soundsTitle')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('general.notifications.soundsDescription')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h4 className="font-medium text-foreground text-sm">
            {t('general.notifications.loudness')}
          </h4>
          <div className="w-32 space-y-0.5 pl-2">
            <Slider
              value={loudnessIndex}
              min={0}
              max={2}
              step={1}
              ariaLabel={t('general.notifications.loudnessAria')}
              thickness="default"
              onValueChange={handleLoudnessChange}
            />
            <div className="relative h-3 text-[11px] text-muted-foreground">
              {NOTIFICATION_LOUDNESS_OPTIONS.map((option, index) => (
                <span
                  key={option.value}
                  className="absolute -translate-x-1/2"
                  style={{
                    left: `${
                      (index / (NOTIFICATION_LOUDNESS_OPTIONS.length - 1)) * 100
                    }%`,
                  }}
                >
                  {t(`general.soundLoudness.${option.value}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-foreground text-sm">
            {t('general.notifications.soundPack')}
          </h4>
          <div className="flex items-center gap-1">
            <Select
              value={currentPack}
              onValueChange={handleSoundPackChange}
              items={soundPackItems}
              size="sm"
              triggerClassName="w-40"
              side="bottom"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={soundLoudness === 'off'}
              onClick={() => previewSound()}
              aria-label={t('general.notifications.previewAria')}
            >
              <PlayIcon className="size-3.5" />
            </Button>
          </div>
          <button
            type="button"
            className="block text-muted-foreground text-xs underline transition-colors hover:text-foreground"
            onClick={handleImportSoundPack}
          >
            <span className="inline-flex items-center gap-1">
              <UploadIcon className="size-3" />
              {t('general.notifications.useCustomSound')}
            </span>
          </button>
        </div>
      </div>

      {isMacOs && (
        <div
          className="flex cursor-pointer items-center justify-between gap-4 pt-2"
          onClick={() =>
            handleDockBounceChange(!globalConfig.dockBounceEnabled)
          }
        >
          <div>
            <h3 className="font-medium text-base text-foreground">
              {t('general.notifications.dockBounceTitle')}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t('general.notifications.dockBounceDescription')}
            </p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={globalConfig.dockBounceEnabled}
              onCheckedChange={handleDockBounceChange}
              size="xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Section Component
// =============================================================================

export function GeneralSettingsSection() {
  const { t } = useTranslation('settings');
  return (
    <div className="h-full w-full">
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-semibold text-foreground text-xl">
              {t('general.title')}
            </h1>
          </div>
          <section className="space-y-6">
            <PowerSaveBlockerSetting />
          </section>
        </div>
      </OverlayScrollbar>
    </div>
  );
}
