import { HotkeyActions } from '@shared/hotkeys';
import { Button } from '@stagewise/stage-ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@stagewise/stage-ui/components/tooltip';
import {
  IconSidebarRightHideOutline18,
  IconSidebarRightShowOutline18,
} from '@stagewise/icons';
import { HotkeyCombo } from '@ui/components/hotkey-combo';
import { useTranslation } from 'react-i18next';
import { useContentCollapsed } from './content-collapsed-context';

export function ContentToggleButton() {
  const { t } = useTranslation('chat');
  const { collapsed, toggle } = useContentCollapsed();
  const label = collapsed ? t('toggleContent.show') : t('toggleContent.hide');
  const Icon = collapsed
    ? IconSidebarRightShowOutline18
    : IconSidebarRightHideOutline18;
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={toggle}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="flex items-center gap-1.5">
          <span>{label}</span>
          <HotkeyCombo action={HotkeyActions.TOGGLE_CONTENT_PANEL} size="xs" />
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
