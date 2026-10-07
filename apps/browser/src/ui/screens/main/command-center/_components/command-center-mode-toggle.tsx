import {
  IconEarthSearchOutline18,
  IconFolder5Outline18,
  IconGear3Outline18,
  IconMsgWritingOutline18,
  IconSquareTerminalOutline18,
} from '@stagewise/icons';
import type { ComponentType } from 'react';
import { ShortcutKey } from '@stagewise/stage-ui/components/shortcut-key';
import { cn } from '@ui/utils';
import { useTranslation } from 'react-i18next';
import type { CommandCenterMode } from '../command-center-model';

type ModeDefinition = {
  mode: CommandCenterMode;
  labelKey: string;
  Icon?: ComponentType<{ className?: string }>;
};

const modes: ModeDefinition[] = [
  { mode: 'global', labelKey: 'all' },
  { mode: 'agents', labelKey: 'agents', Icon: IconMsgWritingOutline18 },
  { mode: 'browser', labelKey: 'browser', Icon: IconEarthSearchOutline18 },
  {
    mode: 'terminals',
    labelKey: 'terminals',
    Icon: IconSquareTerminalOutline18,
  },
  { mode: 'files', labelKey: 'files', Icon: IconFolder5Outline18 },
  { mode: 'settings', labelKey: 'settings', Icon: IconGear3Outline18 },
];

export function CommandCenterModeToggle({
  mode,
  onModeChange,
}: {
  mode: CommandCenterMode;
  onModeChange: (mode: CommandCenterMode) => void;
}) {
  const { t } = useTranslation('commandCenter');
  return (
    <div className="flex shrink-0 items-center gap-2.5 text-xs">
      {modes.map(({ mode: value, labelKey, Icon }) => {
        const isActive = value === mode;
        const label = t(`modes.${labelKey}`);

        return (
          <button
            key={value}
            type="button"
            aria-label={t('switchMode', { mode: label })}
            aria-pressed={isActive}
            onClick={() => onModeChange(value)}
            className={cn(
              'relative flex cursor-default items-center overflow-visible rounded-sm bg-background p-0 outline-none transition-colors duration-150 ease-out',
              'hover:text-foreground focus-visible:text-foreground',
              isActive ? 'text-foreground' : 'text-subtle-foreground',
            )}
          >
            {Icon ? (
              <span className="relative z-10 flex size-4 shrink-0 items-center justify-center bg-background">
                <Icon className="size-4" />
              </span>
            ) : (
              <span className="relative z-10 shrink-0 bg-background px-1">
                {label}
              </span>
            )}
            {Icon && <ModeLabel isActive={isActive} label={label} />}
          </button>
        );
      })}
      <ShortcutKey aria-label={t('cycleHint')} className="shrink-0" size="xs">
        Tab
      </ShortcutKey>
    </div>
  );
}

function ModeLabel({ isActive, label }: { isActive: boolean; label: string }) {
  return (
    <span
      className={cn(
        'relative z-0 ml-1 inline-grid overflow-hidden whitespace-nowrap',
        'transition-[grid-template-columns] duration-150 ease-out',
        isActive
          ? 'animate-[command-center-label-reveal-mask_150ms_ease-out_forwards] grid-cols-[1fr]'
          : 'animate-[command-center-label-conceal-mask_150ms_ease-out_forwards] grid-cols-[0fr]',
      )}
    >
      <span className="min-w-0 overflow-hidden">{label}</span>
    </span>
  );
}
