import { IconGear3Outline18 } from '@stagewise/icons';
import { Button } from '@stagewise/stage-ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@stagewise/stage-ui/components/tooltip';
import { cn } from '@stagewise/stage-ui/lib/utils';
import { useKartonProcedure, useKartonState } from '@ui/hooks/use-karton';
import { useTrack } from '@ui/hooks/use-track';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Gear button at the bottom of both sidebars.
 *
 * Previously part of the auth footer, which also carried the "not signed in"
 * button. Sign-in now lives in Settings → Account, so this keeps only the
 * settings toggle at the familiar spot.
 */
export function SidebarSettingsButton() {
  const { t } = useTranslation('sidebar');
  const track = useTrack();
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);
  const closeSettings = useKartonProcedure((p) => p.appScreen.closeSettings);
  const appScreenMode = useKartonState((s) => s.appScreen.mode);
  const isSettingsOpen = appScreenMode === 'settings';

  const handleToggleSettings = useCallback(() => {
    if (isSettingsOpen) {
      void closeSettings();
      return;
    }

    track('settings-opened');
    void openSettings({ section: 'models-providers' });
  }, [closeSettings, isSettingsOpen, openSettings, track]);

  return (
    <div className="flex shrink-0 flex-row items-center gap-1">
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              isSettingsOpen ? t('settings.close') : t('settings.open')
            }
            className="app-no-drag shrink-0"
            onClick={handleToggleSettings}
            aria-pressed={isSettingsOpen}
          >
            <IconGear3Outline18
              className={cn(
                'size-4 transition-colors',
                isSettingsOpen && 'text-primary-foreground',
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isSettingsOpen ? t('settings.close') : t('settings.open')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
