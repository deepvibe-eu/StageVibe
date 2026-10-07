import { HotkeyActions } from '@shared/hotkeys';
import { ShortcutCombo } from '@stagewise/stage-ui/components/shortcut-key';
import { HotkeyCombo } from '@ui/components/hotkey-combo';
import type {
  AgentCommandItem,
  CommandCenterMode,
  TabCommandItem,
} from '../command-center-model';
import { useTranslation } from 'react-i18next';

export type CommandCenterDeleteConfirmation = {
  agentId: string;
  title: string;
};

export function CommandCenterFooter({
  mode,
  deleteConfirmation,
  isRenamingAgent,
  selectedAgent,
  canCopySelectedTabUrl,
  canToggleSelectedTabPin,
  selectedTab,
  canToggleGitignored,
  includeGitignored,
  searchInContent,
}: {
  mode: CommandCenterMode;
  deleteConfirmation: CommandCenterDeleteConfirmation | null;
  isRenamingAgent: boolean;
  selectedAgent: AgentCommandItem | null;
  canCopySelectedTabUrl: boolean;
  canToggleSelectedTabPin: boolean;
  selectedTab: TabCommandItem | null;
  canToggleGitignored: boolean;
  includeGitignored: boolean;
  searchInContent: boolean;
}) {
  const { t } = useTranslation('commandCenter');
  if (isRenamingAgent) {
    return (
      <div className="flex h-9 items-center justify-end gap-3 border-border-subtle border-t px-3 text-muted-foreground text-xs">
        <CommandCenterFooterAction label={t('cancel')}>
          <ShortcutCombo value="Esc" size="xs" />
        </CommandCenterFooterAction>
        <CommandCenterFooterAction label={t('save')}>
          <ShortcutCombo value="Enter" size="xs" />
        </CommandCenterFooterAction>
      </div>
    );
  }

  if (deleteConfirmation) {
    return (
      <div className="flex h-9 items-center justify-between gap-3 border-border-subtle border-t px-3 text-xs">
        <span className="min-w-0 truncate text-foreground">
          {t('deleteConfirm', { title: deleteConfirmation.title })}
        </span>
        <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
          <CommandCenterFooterAction label={t('cancel')}>
            <ShortcutCombo value="Esc" size="xs" />
          </CommandCenterFooterAction>
          <CommandCenterFooterAction label={t('delete')}>
            <ShortcutCombo value="Enter" size="xs" />
          </CommandCenterFooterAction>
        </div>
      </div>
    );
  }

  if (selectedAgent) {
    return (
      <div className="flex h-9 items-center justify-end gap-3 border-border-subtle border-t px-3 text-muted-foreground text-xs">
        <CommandCenterFooterAction label={t('rename')}>
          <HotkeyCombo
            action={HotkeyActions.COMMAND_CENTER_RENAME_AGENT}
            size="xs"
          />
        </CommandCenterFooterAction>
        <CommandCenterFooterAction
          label={selectedAgent.isPinned ? t('unpin') : t('pin')}
        >
          <HotkeyCombo
            action={HotkeyActions.COMMAND_CENTER_TOGGLE_AGENT_PIN}
            size="xs"
          />
        </CommandCenterFooterAction>
        {!selectedAgent.isWorking && (
          <CommandCenterFooterAction label={t('delete')}>
            <HotkeyCombo
              action={HotkeyActions.COMMAND_CENTER_DELETE_AGENT}
              size="xs"
            />
          </CommandCenterFooterAction>
        )}
      </div>
    );
  }

  if (mode === 'files') {
    return (
      <div className="flex h-9 items-center justify-end gap-3 border-border-subtle border-t px-3 text-muted-foreground text-xs">
        <CommandCenterFooterAction
          label={
            searchInContent ? t('searchFilenamesOnly') : t('searchInContent')
          }
        >
          <HotkeyCombo
            action={HotkeyActions.COMMAND_CENTER_TOGGLE_SEARCH_IN_CONTENT}
            size="xs"
          />
        </CommandCenterFooterAction>
        {canToggleGitignored && (
          <CommandCenterFooterAction
            label={
              includeGitignored
                ? t('excludeGitignored')
                : t('includeGitignored')
            }
          >
            <HotkeyCombo
              action={HotkeyActions.COMMAND_CENTER_TOGGLE_GITIGNORED}
              size="xs"
            />
          </CommandCenterFooterAction>
        )}
      </div>
    );
  }

  if (selectedTab) {
    return (
      <div className="flex h-9 items-center justify-end gap-3 border-border-subtle border-t px-3 text-muted-foreground text-xs">
        {canToggleSelectedTabPin && (
          <CommandCenterFooterAction
            label={selectedTab.isPinned ? t('unpin') : t('pin')}
          >
            <HotkeyCombo
              action={HotkeyActions.COMMAND_CENTER_TOGGLE_AGENT_PIN}
              size="xs"
            />
          </CommandCenterFooterAction>
        )}
        {canCopySelectedTabUrl && (
          <CommandCenterFooterAction label={t('copyUrl')}>
            <HotkeyCombo
              action={HotkeyActions.COMMAND_CENTER_COPY_TAB_URL}
              size="xs"
            />
          </CommandCenterFooterAction>
        )}
        <CommandCenterFooterAction label={t('close')}>
          <HotkeyCombo action={HotkeyActions.CLOSE_TAB} size="xs" />
        </CommandCenterFooterAction>
      </div>
    );
  }

  return null;
}

function CommandCenterFooterAction({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <span>{label}</span>
    </span>
  );
}
