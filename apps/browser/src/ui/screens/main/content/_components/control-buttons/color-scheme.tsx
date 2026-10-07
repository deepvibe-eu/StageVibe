import { useKartonProcedure, useKartonState } from '@ui/hooks/use-karton';
import { IconSunOutline18, IconMoonOutline18 } from '@stagewise/icons';
import { cn } from '@stagewise/stage-ui/lib/utils';
import { useCallback } from 'react';
import type { TabState } from '@shared/karton-contracts/ui';
import { Button } from '@stagewise/stage-ui/components/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@stagewise/stage-ui/components/tooltip';
import { useTranslation } from 'react-i18next';

export function ColorSchemeWidget({ tab }: { tab: TabState }) {
  const { t } = useTranslation('content');
  const cycleColorScheme = useKartonProcedure(
    (p) => p.browser.cycleColorScheme,
  );
  const nativeColorScheme = useKartonState((s) => s.systemTheme);

  const handleClick = useCallback(() => {
    void cycleColorScheme(tab.id);
  }, [cycleColorScheme, tab.id]);

  const modeLabel =
    tab.colorScheme === 'light'
      ? t('colorScheme.light')
      : tab.colorScheme === 'dark'
        ? t('colorScheme.dark')
        : t('colorScheme.system', {
            mode:
              nativeColorScheme === 'light'
                ? t('colorScheme.light')
                : t('colorScheme.dark'),
          });

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('colorScheme.aria', { current: modeLabel })}
          onClick={handleClick}
          className={
            'text-muted-foreground data-[active=true]:text-primary-solid data-[active=true]:hover:text-primary-solid'
          }
          data-active={tab.colorScheme !== 'system' ? 'true' : 'false'}
        >
          <div className="relative size-4">
            <IconMoonOutline18
              className={cn(
                'absolute bottom-0 left-0 transition-all duration-200 ease-out',
                tab.colorScheme === 'dark' ||
                  (tab.colorScheme === 'system' && nativeColorScheme === 'dark')
                  ? 'size-4 opacity-100'
                  : 'left-2 size-0 opacity-0',
              )}
            />
            <IconSunOutline18
              className={cn(
                'absolute bottom-0 left-0 transition-all duration-200 ease-out',
                tab.colorScheme === 'light' ||
                  (tab.colorScheme === 'system' &&
                    nativeColorScheme === 'light')
                  ? 'size-4 opacity-100'
                  : 'left-2 size-0 opacity-0',
              )}
            />
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{t('colorScheme.toggle')}</span>
        <span className="mt-0.5 block text-muted-foreground text-xs">
          {t('colorScheme.current')} {modeLabel}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
