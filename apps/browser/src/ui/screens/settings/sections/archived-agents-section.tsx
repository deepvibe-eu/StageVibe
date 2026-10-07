import { Button } from '@stagewise/stage-ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@stagewise/stage-ui/components/dialog';
import { Input } from '@stagewise/stage-ui/components/input';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import type { AgentHistoryEntry } from '@shared/karton-contracts/ui/agent';
import { useKartonProcedure } from '@ui/hooks/use-karton';
import { getBaseName } from '@shared/path-utils';
import { FolderIcon, Loader2Icon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ARCHIVED_PAGE_SIZE = 25;

export function ArchivedAgentsSection() {
  const { t } = useTranslation('settings');
  const getArchivedAgents = useKartonProcedure(
    (p) => p.agents.getAgentsHistoryList,
  );
  const unarchiveAgent = useKartonProcedure((p) => p.agents.unarchive);
  const deleteAgent = useKartonProcedure((p) => p.agents.delete);

  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(ARCHIVED_PAGE_SIZE);
  const [entries, setEntries] = useState<AgentHistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const removedIds = useRef(new Set<string>());
  const query = searchQuery.trim();

  useEffect(() => {
    let cancelled = false;

    const loadEntries = async () => {
      setLoading(true);
      try {
        const nextEntries = await getArchivedAgents(
          0,
          limit + 1,
          query || undefined,
          true,
        );
        if (cancelled) return;
        setEntries(
          nextEntries
            .filter((entry) => !removedIds.current.has(entry.id))
            .slice(0, limit),
        );
        setHasMore(nextEntries.length > limit);
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        console.error('Failed to load archived chats:', cause);
        setError(t('archived.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadEntries();
    return () => {
      cancelled = true;
    };
  }, [getArchivedAgents, limit, query, reloadToken, t]);

  async function runEntryMutation(
    id: string,
    mutate: () => Promise<unknown>,
    fallbackError: string,
  ) {
    removedIds.current.add(id);
    setPendingId(id);
    setError(null);
    try {
      await mutate();
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (cause) {
      removedIds.current.delete(id);
      console.error(fallbackError, cause);
      setError(fallbackError);
      setReloadToken((current) => current + 1);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    setDeleteTargetId(null);

    await runEntryMutation(
      deleteTargetId,
      () => deleteAgent(deleteTargetId),
      t('archived.deleteFailed'),
    );
  }

  return (
    <>
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-1">
            <h1 className="font-semibold text-foreground text-xl">
              {t('archived.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('archived.description')}
            </p>
          </div>

          <div className="relative">
            <Input
              aria-label={t('archived.searchAria')}
              placeholder={t('archived.searchPlaceholder')}
              value={searchQuery}
              onValueChange={(value) => {
                setSearchQuery(value);
                setLimit(ARCHIVED_PAGE_SIZE);
              }}
              debounce={250}
              className="max-w-none pl-8"
            />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          </div>

          {error && entries.length > 0 ? (
            <div className="rounded-lg bg-error-background px-3 py-2 text-error-foreground text-sm">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
            {loading && entries.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2Icon className="size-5 animate-spin" />
                <span>{t('archived.loading')}</span>
              </div>
            ) : entries.length === 0 && !hasMore ? (
              <div className="flex min-h-40 items-center justify-center px-6 text-center text-muted-foreground text-sm">
                <p>
                  {error
                    ? t('archived.loadFailedRetry')
                    : query
                      ? t('archived.noMatch')
                      : t('archived.empty')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {entries.map((entry) => {
                  const workspace = entry.mountedWorkspaces?.[0];
                  const archivedAt = new Date(
                    entry.archivedAt ?? entry.lastMessageAt,
                  ).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });
                  return (
                    <div
                      key={entry.id}
                      className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-hover-derived"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground text-sm">
                          {entry.title || t('archived.untitled')}
                        </p>
                        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                          <span>{archivedAt}</span>
                          {workspace ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="flex min-w-0 items-center gap-1">
                                <FolderIcon className="size-3 shrink-0" />
                                <span className="truncate">
                                  {getBaseName(workspace.path) ||
                                    workspace.path}
                                </span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t('archived.deleteAria', {
                          title: entry.title || t('archived.untitled'),
                        })}
                        disabled={pendingId !== null}
                        onClick={() => setDeleteTargetId(entry.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={pendingId !== null}
                        onClick={() =>
                          void runEntryMutation(
                            entry.id,
                            () => unarchiveAgent(entry.id),
                            t('archived.unarchiveFailed'),
                          )
                        }
                      >
                        {pendingId === entry.id ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : null}
                        {t('archived.unarchive')}
                      </Button>
                    </div>
                  );
                })}
                {hasMore ? (
                  <div className="flex justify-center p-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pendingId !== null}
                      onClick={() =>
                        setLimit((current) => current + ARCHIVED_PAGE_SIZE)
                      }
                    >
                      {t('archived.showMore')}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </OverlayScrollbar>

      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>{t('archived.deleteDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('archived.deleteDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              {t('archived.deletePermanently')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTargetId(null)}
            >
              {t('archived.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
