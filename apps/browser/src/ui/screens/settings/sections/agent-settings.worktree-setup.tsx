import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Button, buttonVariants } from '@stagewise/stage-ui/components/button';
import { Input } from '@stagewise/stage-ui/components/input';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverTitle,
  PopoverTrigger,
} from '@stagewise/stage-ui/components/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@stagewise/stage-ui/components/tooltip';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@stagewise/stage-ui/components/tabs';
import { toast } from '@stagewise/stage-ui/components/toaster';
import { useKartonProcedure, useKartonState } from '@ui/hooks/use-karton';
import { cn } from '@ui/utils';
import { SettingsScrollTabs } from '../_components/settings-scroll-tabs';
import type {
  KartonContract,
  WorktreeSetupManagedWorktree,
  WorktreeSetupRepositorySettings,
} from '@shared/karton-contracts/ui';
import {
  WORKTREE_SETUP_SCRIPT_FILENAMES,
  type WorktreeSetupScriptVariant,
} from '@shared/worktree-setup';
import {
  IconBranchOutOutline18,
  IconCircleInfoOutline18,
  IconCircleQuestionOutline18,
  IconTrashOutline18,
} from '@stagewise/icons';
import { FileIcon } from '@ui/components/file-icon';
import { FileContextMenu } from '@ui/components/file-context-menu';
import { useTranslation } from 'react-i18next';
import i18n from '@ui/i18n';

const SETUP_SCRIPT_TEMPLATES: Record<WorktreeSetupScriptVariant, string> = {
  posix: `#!/bin/sh
set -e

# Runs after stagewise creates and mounts a new Git worktree.
# CWD is the new worktree.

# Example:
# pnpm install
`,
  powershell: `$ErrorActionPreference = 'Stop'

# Runs after stagewise creates and mounts a new Git worktree.
# CWD is the new worktree.

# Example:
# pnpm install
`,
};

const VARIANT_TAB_KEYS: Record<WorktreeSetupScriptVariant, string> = {
  posix: 'variantShell',
  powershell: 'variantPowershell',
};

const EMPTY_SCRIPT_DRAFTS: Record<WorktreeSetupScriptVariant, string> = {
  posix: '',
  powershell: '',
};

function getInitialScriptDraft(
  repository: WorktreeSetupRepositorySettings,
  variant: WorktreeSetupScriptVariant,
): string {
  const script = repository.scripts[variant];
  return script.exists ? script.content : SETUP_SCRIPT_TEMPLATES[variant];
}

function buildScriptDrafts(
  repository: WorktreeSetupRepositorySettings | null,
): Record<WorktreeSetupScriptVariant, string> {
  if (!repository) return { ...EMPTY_SCRIPT_DRAFTS };
  return {
    posix: getInitialScriptDraft(repository, 'posix'),
    powershell: getInitialScriptDraft(repository, 'powershell'),
  };
}

function formatRelativeTime(timestamp: number | null): string {
  if (timestamp === null) return i18n.t('settings:worktree.neverUsed');
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (diffMinutes < 60)
    return i18n.t('settings:worktree.minutesAgo', { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return i18n.t('settings:worktree.hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return i18n.t('settings:worktree.daysAgo', { count: diffDays });
}

export function WorktreeSetupSection() {
  const { t } = useTranslation('settings');
  const listRepositories = useKartonProcedure(
    (p: KartonContract['serverProcedures']) =>
      p.toolbox.listWorktreeSetupRepositories,
  );
  const saveScript = useKartonProcedure(
    (p: KartonContract['serverProcedures']) =>
      p.toolbox.saveWorktreeSetupScript,
  );
  const deleteWorktree = useKartonProcedure(
    (p: KartonContract['serverProcedures']) =>
      p.toolbox.deleteWorktreeSetupWorktree,
  );
  const listRepositoriesRef = useRef(listRepositories);
  listRepositoriesRef.current = listRepositories;
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const [repositories, setRepositories] = useState<
    WorktreeSetupRepositorySettings[]
  >([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<
    string | null
  >(null);
  const platform = useKartonState((s) => s.appInfo.platform);
  const [activeVariant, setActiveVariant] =
    useState<WorktreeSetupScriptVariant>(
      platform === 'win32' ? 'powershell' : 'posix',
    );
  const [scriptDrafts, setScriptDrafts] = useState<
    Record<WorktreeSetupScriptVariant, string>
  >({ ...EMPTY_SCRIPT_DRAFTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const previousSelectedRepositoryIdRef = useRef<string | null>(null);

  const selectedRepository = useMemo(
    () =>
      repositories.find(
        (repository) => repository.id === selectedRepositoryId,
      ) ??
      repositories[0] ??
      null,
    [repositories, selectedRepositoryId],
  );

  const scriptDraft = scriptDrafts[activeVariant];

  const dirty =
    selectedRepository !== null &&
    scriptDraft !== getInitialScriptDraft(selectedRepository, activeVariant);

  const refreshRepositories = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshPromise = (async () => {
      if (mountedRef.current) setLoading(true);
      try {
        const result = await listRepositoriesRef.current();

        if (!mountedRef.current) return;
        setRepositories(result.repositories);
        setSelectedRepositoryId((current) => {
          if (
            current &&
            result.repositories.some(
              (repo: WorktreeSetupRepositorySettings) => repo.id === current,
            )
          ) {
            return current;
          }
          return result.repositories[0]?.id ?? null;
        });
      } finally {
        refreshInFlightRef.current = null;
        if (mountedRef.current) setLoading(false);
      }
    })();

    refreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  useEffect(() => {
    void refreshRepositories();
  }, [refreshRepositories]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const selectedRepositoryId = selectedRepository?.id ?? null;
    if (previousSelectedRepositoryIdRef.current === selectedRepositoryId) {
      return;
    }

    previousSelectedRepositoryIdRef.current = selectedRepositoryId;
    setScriptDrafts(buildScriptDrafts(selectedRepository));
  }, [selectedRepository]);

  const handleScriptDraftChange = useCallback(
    (value: string) => {
      setScriptDrafts((current) => ({ ...current, [activeVariant]: value }));
    },
    [activeVariant],
  );

  const updateRepository = useCallback(
    (repository: WorktreeSetupRepositorySettings) => {
      setRepositories((current) => {
        const index = current.findIndex((item) => item.id === repository.id);
        if (index === -1) return current;
        const next = [...current];
        next[index] = repository;
        return next;
      });
      setSelectedRepositoryId(repository.id);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!selectedRepository) return;
    setSaving(true);
    try {
      const result = await saveScript(
        selectedRepository.mainWorktreePath,
        activeVariant,
        scriptDrafts[activeVariant],
      );
      if (result.ok) {
        updateRepository(result.repository);
        toast({
          id: `worktree-setup-save-${Date.now()}`,
          title: t('worktree.savedTitle'),
          message: t('worktree.savedMessage'),
          type: 'info',
          actions: [],
        });
      } else {
        toast({
          id: `worktree-setup-save-error-${Date.now()}`,
          title: t('worktree.saveFailedTitle'),
          message: result.message,
          type: 'error',
          actions: [],
        });
      }
    } finally {
      setSaving(false);
    }
  }, [
    saveScript,
    activeVariant,
    scriptDrafts,
    selectedRepository,
    updateRepository,
  ]);

  const handleReset = useCallback(() => {
    if (!selectedRepository) return;
    setScriptDrafts((current) => ({
      ...current,
      [activeVariant]: getInitialScriptDraft(selectedRepository, activeVariant),
    }));
  }, [activeVariant, selectedRepository]);

  const handleConfirmDelete = useCallback(
    async (worktree: WorktreeSetupManagedWorktree) => {
      setDeletingPath(worktree.path);
      try {
        const result = await deleteWorktree(worktree.path);
        if (result.ok) {
          if (result.repository) updateRepository(result.repository);
          else await refreshRepositories();
          toast({
            id: `worktree-delete-${Date.now()}`,
            title: t('worktree.deletedTitle'),
            message: t('worktree.deletedMessage'),
            type: 'info',
            actions: [],
          });
          return true;
        }

        toast({
          id: `worktree-delete-error-${Date.now()}`,
          title: t('worktree.deleteFailedTitle'),
          message: result.message,
          type: 'error',
          actions: [],
        });
        return false;
      } finally {
        setDeletingPath(null);
      }
    },
    [deleteWorktree, refreshRepositories, updateRepository],
  );

  return (
    <div className="h-full w-full">
      {/* Content */}
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-semibold text-foreground text-xl">
              {t('worktree.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('worktree.description')}
            </p>
          </div>

          <RepositoryList
            repositories={repositories}
            selectedRepositoryId={selectedRepository?.id ?? null}
            onSelect={setSelectedRepositoryId}
          />

          <section className="min-w-0">
            {selectedRepository ? (
              <RepositoryDetails
                repository={selectedRepository}
                activeVariant={activeVariant}
                onVariantChange={setActiveVariant}
                scriptDraft={scriptDraft}
                dirty={dirty}
                saving={saving}
                deletingPath={deletingPath}
                onScriptDraftChange={handleScriptDraftChange}
                onReset={handleReset}
                onSave={handleSave}
                onConfirmDelete={handleConfirmDelete}
              />
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-lg border border-derived-subtle">
                <p className="text-muted-foreground text-sm">
                  {loading ? t('worktree.loading') : t('worktree.empty')}
                </p>
              </div>
            )}
          </section>
        </div>
      </OverlayScrollbar>
    </div>
  );
}

function RepositoryList({
  repositories,
  selectedRepositoryId,
  onSelect,
}: {
  repositories: WorktreeSetupRepositorySettings[];
  selectedRepositoryId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('settings');
  return (
    <SettingsScrollTabs
      selectedId={selectedRepositoryId}
      onSelect={onSelect}
      items={repositories.map((repository) => {
        const worktreeCount = repository.managedWorktrees.length;
        return {
          id: repository.id,
          label: repository.name,
          subLabel: t('worktree.worktreeCount', { count: worktreeCount }),
        };
      })}
    />
  );
}

function RepositoryDetails({
  repository,
  activeVariant,
  onVariantChange,
  scriptDraft,
  dirty,
  saving,
  deletingPath,
  onScriptDraftChange,
  onReset,
  onSave,
  onConfirmDelete,
}: {
  repository: WorktreeSetupRepositorySettings;
  activeVariant: WorktreeSetupScriptVariant;
  onVariantChange: (variant: WorktreeSetupScriptVariant) => void;
  scriptDraft: string;
  dirty: boolean;
  saving: boolean;
  deletingPath: string | null;
  onScriptDraftChange: (value: string) => void;
  onReset: () => void;
  onSave: () => void;
  onConfirmDelete: (worktree: WorktreeSetupManagedWorktree) => Promise<boolean>;
}) {
  const { t } = useTranslation('settings');
  const activeScript = repository.scripts[activeVariant];
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground text-sm">
              {t('worktree.script')}
            </h3>
            <SetupVariablesPopover />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {t('worktree.scriptDescription')}
            </p>
            <FileContextMenu
              relativePath={activeScript.path}
              resolvePath={(p) => p}
            >
              <Tooltip>
                <TooltipTrigger>
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'xs' }),
                      'h-auto px-1 py-0.5',
                    )}
                  >
                    <FileIcon
                      filePath={activeScript.path}
                      className="size-4 shrink-0"
                    />
                    <span className="shrink-0">
                      {WORKTREE_SETUP_SCRIPT_FILENAMES[activeVariant]}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{activeScript.path}</TooltipContent>
              </Tooltip>
            </FileContextMenu>
          </div>
        </div>
        {repository.hasCodexSetupScript && (
          <div className="flex items-start gap-2 rounded-md bg-info-background/45 p-2 text-info-foreground text-xs leading-snug ring-1 ring-info-solid/20">
            <IconCircleInfoOutline18 className="mt-0.5 size-3.5 shrink-0" />
            <p>
              <span className="font-medium">{t('worktree.codexDetected')}</span>{' '}
              {t('worktree.codexNote')}
            </p>
          </div>
        )}
        <Tabs
          value={activeVariant}
          onValueChange={(value) =>
            onVariantChange(value as WorktreeSetupScriptVariant)
          }
        >
          <TabsList className="w-auto">
            <TabsTrigger value="posix">
              {t(`worktree.${VARIANT_TAB_KEYS.posix}`)}
            </TabsTrigger>
            <TabsTrigger value="powershell">
              {t(`worktree.${VARIANT_TAB_KEYS.powershell}`)}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <textarea
          value={scriptDraft}
          onChange={(event) => onScriptDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              (event.metaKey || event.ctrlKey) &&
              event.key.toLowerCase() === 's'
            ) {
              event.preventDefault();
              if (dirty && !saving) void onSave();
            }
          }}
          spellCheck={false}
          className="scrollbar-subtle min-h-72 w-full resize-y rounded-lg border border-derived bg-surface-1 p-3 font-mono text-foreground text-xs outline-none ring-0 transition-colors placeholder:text-subtle-foreground focus:border-derived-strong"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
            {t('worktree.reset')}
          </Button>
          <Button
            size="sm"
            onClick={() => void onSave()}
            disabled={!dirty || saving}
          >
            {saving ? t('worktree.saving') : t('worktree.save')}
          </Button>
        </div>
      </section>

      <ManagedWorktreeList
        worktrees={repository.managedWorktrees}
        deletingPath={deletingPath}
        onConfirmDelete={onConfirmDelete}
      />
    </div>
  );
}

function SetupVariablesPopover() {
  const { t } = useTranslation('settings');
  return (
    <Popover>
      <PopoverTrigger>
        <button
          type="button"
          className="group/button relative box-border flex h-5 cursor-pointer flex-row items-center justify-center gap-1 rounded-md bg-transparent px-1.5 py-1 font-normal text-subtle-foreground text-xs outline-none transition-colors hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary-solid/40 active:text-muted-foreground"
          aria-label={t('worktree.varsAria')}
        >
          <span>{t('worktree.varsButton')}</span>
          <IconCircleQuestionOutline18 className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 gap-4 p-3">
        <PopoverTitle>{t('worktree.varsTitle')}</PopoverTitle>
        <PopoverDescription>{t('worktree.varsDescription')}</PopoverDescription>
        <PopoverClose />
        <div className="space-y-3">
          <SetupVariableItem
            label={t('worktree.varSource')}
            value="STAGEWISE_SOURCE_WORKTREE_PATH"
          />
          <SetupVariableItem
            label={t('worktree.varTarget')}
            value="STAGEWISE_TARGET_WORKTREE_PATH"
          />
          <SetupVariableItem
            label={t('worktree.varMain')}
            value="STAGEWISE_MAIN_WORKTREE_PATH"
          />
        </div>
        <PopoverFooter>
          <p className="text-muted-foreground text-xs">
            {t('worktree.varsFooter')}
          </p>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

function SetupVariableItem({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation('settings');
  const [hasCopied, setHasCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(value);
    setHasCopied(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => setHasCopied(false), 2000);
  }, [value]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="group/variable flex w-full cursor-pointer items-center gap-2 rounded-md border border-derived-subtle bg-surface-1 px-2 py-1.5 text-left font-mono text-foreground text-xs outline-none transition-colors hover:bg-hover-derived focus-visible:ring-2 focus-visible:ring-primary-solid/40"
        aria-label={t('worktree.copyAria', { value })}
      >
        <code className="min-w-0 flex-1 truncate">{value}</code>
        {hasCopied ? (
          <CheckIcon className="size-3 shrink-0 text-foreground" />
        ) : (
          <CopyIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/variable:opacity-100 group-focus-visible/variable:opacity-100" />
        )}
      </button>
    </div>
  );
}

function ManagedWorktreeList({
  worktrees,
  deletingPath,
  onConfirmDelete,
}: {
  worktrees: WorktreeSetupManagedWorktree[];
  deletingPath: string | null;
  onConfirmDelete: (worktree: WorktreeSetupManagedWorktree) => Promise<boolean>;
}) {
  const { t } = useTranslation('settings');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorktrees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return worktrees;

    return worktrees.filter((worktree) =>
      [
        worktree.name,
        worktree.path,
        worktree.branch ?? '',
        worktree.headSha ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchQuery, worktrees]);

  const noResults =
    searchQuery.trim().length > 0 && filteredWorktrees.length === 0;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium text-foreground text-sm">
          {t('worktree.managedTitle')}
        </h3>
        <p className="text-muted-foreground text-xs">
          {t('worktree.managedDescription')}
        </p>
      </div>

      {worktrees.length > 0 ? (
        <Input
          placeholder={t('worktree.filterPlaceholder')}
          value={searchQuery}
          onValueChange={setSearchQuery}
          size="sm"
          className="flex-1"
          style={{ maxWidth: 'none' }}
        />
      ) : null}

      {worktrees.length === 0 ? (
        <div className="rounded-lg border border-derived-subtle p-4">
          <p className="text-center text-muted-foreground text-sm">
            {t('worktree.managedEmpty')}
          </p>
        </div>
      ) : (
        <OverlayScrollbar
          className="max-h-80"
          viewportClassName="scroll-fade-y scroll-fade-6"
          contentClassName="space-y-2"
        >
          {filteredWorktrees.map((worktree) => (
            <WorktreeRow
              key={worktree.path}
              worktree={worktree}
              deleting={deletingPath === worktree.path}
              onConfirmDelete={onConfirmDelete}
            />
          ))}

          {noResults ? (
            <div className="rounded-lg border border-derived-subtle p-4">
              <p className="text-center text-muted-foreground text-sm">
                {t('worktree.noMatch')}
              </p>
            </div>
          ) : null}
        </OverlayScrollbar>
      )}
    </section>
  );
}

function WorktreeRow({
  worktree,
  deleting,
  onConfirmDelete,
}: {
  worktree: WorktreeSetupManagedWorktree;
  deleting: boolean;
  onConfirmDelete: (worktree: WorktreeSetupManagedWorktree) => Promise<boolean>;
}) {
  const { t } = useTranslation('settings');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const timeAgo = formatRelativeTime(worktree.lastUsedAt);

  const deleteButtonClassName =
    'absolute right-3 flex size-5 cursor-pointer items-center justify-center text-muted-foreground opacity-0 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary-solid/40 disabled:cursor-not-allowed disabled:opacity-0 group-focus-within/worktree:opacity-100 group-hover/worktree:opacity-100 disabled:group-hover/worktree:opacity-40';

  const deleteButton = (
    <button
      type="button"
      disabled={!worktree.removable || deleting}
      aria-label={t('worktree.deleteAria', { name: worktree.name })}
      className={deleteButtonClassName}
    >
      <IconTrashOutline18 className="size-3.5" />
    </button>
  );

  return (
    <div className="group/worktree relative flex items-center gap-3 rounded-lg border border-derived bg-surface-1 p-3 pr-10">
      <IconBranchOutOutline18 className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <h4 className="flex min-w-0 items-center gap-1.5 font-medium text-sm">
          <span className="truncate text-foreground">{worktree.name}</span>
          <span className="shrink-0 text-subtle-foreground text-xs">
            {timeAgo}
          </span>
        </h4>
        <p className="truncate text-muted-foreground text-xs">
          {worktree.path}
        </p>
      </div>
      {worktree.removable ? (
        <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
          <PopoverTrigger>{deleteButton}</PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-72">
            <PopoverTitle>{t('worktree.deleteTitle')}</PopoverTitle>
            <PopoverDescription>
              {t('worktree.deleteDescription')}
            </PopoverDescription>
            <PopoverClose />
            <PopoverFooter>
              <Button
                variant="primary"
                size="xs"
                disabled={deleting}
                onClick={async () => {
                  const deleted = await onConfirmDelete(worktree);
                  if (deleted) setDeletePopoverOpen(false);
                }}
                autoFocus
              >
                {deleting
                  ? t('worktree.deleting')
                  : t('worktree.deleteWorktree')}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                disabled={deleting}
                onClick={() => setDeletePopoverOpen(false)}
              >
                {t('worktree.cancel')}
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              className={cn(
                deleteButtonClassName,
                'cursor-not-allowed group-hover/worktree:opacity-40',
              )}
              aria-disabled="true"
              aria-label={t('worktree.cannotDeleteAria', {
                name: worktree.name,
              })}
              onClick={(event) => event.preventDefault()}
            >
              <IconTrashOutline18 className="size-3.5" />
            </button>
          </TooltipTrigger>
          {worktree.disabledReason ? (
            <TooltipContent>{worktree.disabledReason}</TooltipContent>
          ) : null}
        </Tooltip>
      )}
    </div>
  );
}
