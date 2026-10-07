import { useKartonState, useKartonProcedure } from '@ui/hooks/use-karton';
import {
  RadioGroup,
  Radio,
  RadioLabel,
} from '@stagewise/stage-ui/components/radio';
import { produceWithPatches, enablePatches } from 'immer';
import type { UpdateChannel } from '@shared/karton-contracts/ui/shared-types';
import { cn } from '@stagewise/stage-ui/lib/utils';
import { buttonVariants } from '@stagewise/stage-ui/components/button';
import { Button } from '@stagewise/stage-ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogHeader,
} from '@stagewise/stage-ui/components/dialog';
import { Input } from '@stagewise/stage-ui/components/input';
import {
  ExternalLinkIcon,
  LoaderCircleIcon,
  ScrollTextIcon,
} from 'lucide-react';
import { IconGithub } from '@stagewise/icons';
import { IconRefreshAnticlockwiseOutline18 } from '@stagewise/icons';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import agplLicenseText from '@assets/agpl-3.0-license.txt?raw';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@stagewise/stage-ui/components/tooltip';
import { ReleaseNotes } from '@ui/components/release-notes';
import { useTranslation } from 'react-i18next';

enablePatches();

interface LicenseEntry {
  name: string;
  version: string;
  license: string;
  repository: string;
  publisher: string;
  licenseText: string;
}

function CollapsibleOtherVersions({
  versions,
}: {
  versions: Record<string, string | undefined>;
}) {
  const { t } = useTranslation('settings');
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(versions);
  const initialCount = 8;
  const hasMore = entries.length > initialCount;
  const displayEntries = expanded ? entries : entries.slice(0, initialCount);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'grid gap-x-4 gap-y-1',
          expanded ? 'grid-cols-4' : 'grid-cols-4',
        )}
      >
        {displayEntries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <span className="text-muted-foreground text-xs">{key}</span>
            <div className="truncate text-xs">
              {value ?? t('about.otherVersions.na')}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="text-left text-muted-foreground text-xs hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? t('about.otherVersions.showLess')
            : t('about.otherVersions.viewAll')}
        </button>
      )}
    </div>
  );
}

function AppUpdateStatus() {
  const { t } = useTranslation('settings');
  const autoUpdate = useKartonState((s) => s.autoUpdate);
  const checkForUpdates = useKartonProcedure(
    (p) => p.autoUpdate.checkForUpdates,
  );
  const quitAndInstall = useKartonProcedure(
    (p) => p.autoUpdate.quitAndInstall.fire,
  );

  if (autoUpdate.status === 'unsupported') {
    return null;
  }

  const renderButton = () => {
    switch (autoUpdate.status) {
      case 'checking':
        return (
          <Button variant="ghost" size="sm" className="px-0" disabled>
            <IconRefreshAnticlockwiseOutline18 className="size-3 animate-spin" />
            {t('about.update.checking')}
          </Button>
        );
      case 'downloading':
        return (
          <Button variant="secondary" size="sm" disabled>
            <LoaderCircleIcon className="size-3.5 animate-spin" />
            {t('about.update.downloading')}
          </Button>
        );
      case 'not-available':
        return (
          <>
            <span className="text-muted-foreground text-sm">
              {t('about.update.upToDate')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => checkForUpdates()}
            >
              <IconRefreshAnticlockwiseOutline18 className="size-3" />
              {t('about.update.checkAgain')}
            </Button>
          </>
        );
      case 'ready':
        return (
          <Button size="sm" onClick={() => quitAndInstall()}>
            {t('about.update.installRestart')}
          </Button>
        );
      case 'error':
      case 'idle':
      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            className="px-0"
            onClick={() => checkForUpdates()}
          >
            <IconRefreshAnticlockwiseOutline18 className="size-3" />
            {t('about.update.check')}
          </Button>
        );
    }
  };

  const updateInfo = autoUpdate.updateInfo;

  return (
    <div className="flex flex-col gap-3">
      {updateInfo?.releaseName && (
        <p className="text-muted-foreground text-sm">
          {autoUpdate.status === 'downloading'
            ? t('about.update.downloadingName', {
                name: updateInfo.releaseName,
              })
            : t('about.update.readyName', { name: updateInfo.releaseName })}
        </p>
      )}
      {autoUpdate.status === 'error' && autoUpdate.errorMessage && (
        <p className="text-error-foreground text-xs">
          {autoUpdate.errorMessage}
        </p>
      )}
      <div className="flex items-center gap-3">{renderButton()}</div>
      {updateInfo?.releaseNotes && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-derived-subtle bg-surface-1 p-3">
          <ReleaseNotes className="text-xs">
            {updateInfo.releaseNotes}
          </ReleaseNotes>
        </div>
      )}
    </div>
  );
}

function UpdateChannelSetting() {
  const { t } = useTranslation('settings');
  const preferences = useKartonState((s) => s.preferences);
  const appInfo = useKartonState((s) => s.appInfo);
  const channelLocked = useKartonState(
    (s) =>
      s.autoUpdate.status === 'downloading' || s.autoUpdate.status === 'ready',
  );
  const updatePreferences = useKartonProcedure((p) => p.preferences.update);

  const inferredChannel: UpdateChannel = appInfo.version.includes('-alpha')
    ? 'alpha'
    : 'beta';

  const currentChannel = preferences.updateChannel ?? inferredChannel;

  const handleChannelChange = async (value: unknown) => {
    const channel = value as UpdateChannel;
    const [, patches] = produceWithPatches(preferences, (draft) => {
      draft.updateChannel = channel;
    });
    await updatePreferences(patches);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium text-base text-foreground">
          {t('about.channel.title')}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('about.channel.description')}
        </p>
      </div>

      <RadioGroup
        value={currentChannel}
        onValueChange={handleChannelChange}
        disabled={channelLocked}
      >
        <RadioLabel>
          <Radio value="beta" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {t('about.channel.beta')}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('about.channel.betaDescription')}
            </span>
          </div>
        </RadioLabel>

        <RadioLabel>
          <Radio value="alpha" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {t('about.channel.alpha')}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('about.channel.alphaDescription')}
            </span>
          </div>
        </RadioLabel>
      </RadioGroup>
    </div>
  );
}

function LicenseTextDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: LicenseEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('settings');
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl gap-4.5 overflow-hidden">
        <DialogClose />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pt-1">
            {entry.name}@{entry.version}
            <span className="rounded-md bg-surface-1 px-2 py-0.5 font-mono text-muted-foreground text-xs">
              {entry.license}
            </span>
            {entry.repository && (
              <Tooltip>
                <TooltipTrigger>
                  <a
                    href={entry.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-md' }),
                      'w-min p-0',
                    )}
                    aria-label={t('about.licenseDialog.githubRepository')}
                  >
                    <IconGithub className="size-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>{entry.repository}</TooltipContent>
              </Tooltip>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto rounded-lg bg-surface-1 p-4">
          {entry.licenseText ? (
            <pre className="whitespace-pre-wrap font-mono text-foreground text-xs leading-relaxed">
              {entry.licenseText}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              {t('about.licenseDialog.noText')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OpenSourceLicenses() {
  const { t } = useTranslation('settings');
  const [licenses, setLicenses] = useState<LicenseEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<LicenseEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadLicenses = useCallback(async () => {
    if (licenses) {
      setExpanded(true);
      return;
    }
    setLoading(true);
    try {
      const data = await import('@pages/generated/licenses.json');
      setLicenses(data.default as LicenseEntry[]);
      setExpanded(true);
    } catch {
      console.error('Failed to load license data');
    } finally {
      setLoading(false);
    }
  }, [licenses]);

  const filteredLicenses = useMemo(() => {
    if (!licenses) return [];
    if (!search.trim()) return licenses;
    const q = search.toLowerCase();
    return licenses.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.license.toLowerCase().includes(q),
    );
  }, [licenses, search]);

  const licenseSummary = useMemo(() => {
    if (!licenses) return null;
    const counts: Record<string, number> = {};
    for (const entry of licenses) {
      counts[entry.license] = (counts[entry.license] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [licenses]);

  useEffect(() => {
    if (expanded && listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expanded]);

  const handleViewLicense = useCallback((entry: LicenseEntry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-base text-foreground">
            {t('about.licenses.title')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('about.licenses.description')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={expanded ? () => setExpanded(false) : loadLicenses}
          disabled={loading}
        >
          {loading
            ? t('about.licenses.loading')
            : expanded
              ? t('about.licenses.collapse')
              : t('about.licenses.viewAll')}
        </Button>
      </div>

      {expanded && licenses && (
        <div ref={listRef} className="flex flex-col gap-3">
          {licenseSummary && (
            <div className="flex flex-wrap gap-2">
              {licenseSummary.map(([license, count]) => (
                <span
                  key={license}
                  className="rounded-md bg-surface-1 px-2 py-1 text-muted-foreground text-xs"
                >
                  {license}{' '}
                  <span className="font-medium text-foreground">{count}</span>
                </span>
              ))}
              <span className="rounded-md bg-surface-1 px-2 py-1 text-muted-foreground text-xs">
                {t('about.licenses.total')}{' '}
                <span className="font-medium text-foreground">
                  {licenses.length}
                </span>
              </span>
            </div>
          )}

          <Input
            size="sm"
            value={search}
            onValueChange={(val) => setSearch(val as string)}
            debounce={150}
            placeholder={t('about.licenses.searchPlaceholder')}
          />

          <div className="scrollbar-subtle h-[400px] overflow-y-auto rounded-lg border border-border-subtle">
            {filteredLicenses.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                {t('about.licenses.noMatch', { search })}
              </div>
            ) : (
              filteredLicenses.map((entry) => (
                <div
                  key={`${entry.name}@${entry.version}`}
                  className="flex items-center justify-between border-border-subtle border-b px-4 py-2.5 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground text-sm">
                        {entry.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {entry.version}
                        {entry.publisher && ` · ${entry.publisher}`}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-md bg-surface-1 px-2 py-0.5 font-mono text-muted-foreground text-xs">
                      {entry.license}
                    </span>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-1">
                    {entry.repository && (
                      <a
                        href={entry.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({
                            variant: 'ghost',
                            size: 'icon-xs',
                          }),
                        )}
                        title={t('about.licenses.viewRepository')}
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleViewLicense(entry)}
                      title={t('about.licenses.viewLicenseText')}
                    >
                      <ScrollTextIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1 text-center text-muted-foreground text-xs">
        <hr className="border-border/30" />
        <br />
        {t('about.licenses.support')}{' '}
        <a
          href="https://ko-fi.com/modestcoder"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          {t('about.licenses.supportLink')}
        </a>
        .
      </div>

      <LicenseTextDialog
        entry={selectedEntry}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function AppDataManagement() {
  const { t } = useTranslation('settings');
  const openFolder = useKartonProcedure((p) => p.appData.openFolder);
  const resetAppData = useKartonProcedure((p) => p.appData.reset);
  const appInfo = useKartonState((s) => s.appInfo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-base text-foreground">
            {t('about.appData.title')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('about.appData.description')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => openFolder()}>
            {t('about.appData.openFolder')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm(t('about.appData.deleteConfirm')))
                resetAppData();
            }}
          >
            {t('about.appData.delete')}
          </Button>
        </div>
      </div>
      {appInfo.appDataPath && (
        <div className="grid grid-cols-[140px_1fr] gap-x-4">
          <span className="font-medium text-muted-foreground text-sm">
            {t('about.appData.dataPath')}
          </span>
          <span className="break-all text-foreground text-sm">
            {appInfo.appDataPath}
          </span>
        </div>
      )}
    </div>
  );
}

export function AboutSection() {
  const { t } = useTranslation('settings');
  const appInfo = useKartonState((s) => s.appInfo);
  const [appLicenseOpen, setAppLicenseOpen] = useState(false);

  return (
    <div className="h-full w-full">
      {/* Content */}
      <OverlayScrollbar className="h-full" contentClassName="px-6 pt-24 pb-24">
        <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="font-semibold text-foreground text-xl">
              {t('about.title')}
            </h1>
          </div>
          {/* App Name Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="font-bold text-3xl text-foreground leading-none">
                StageVibe
              </h2>
              <p className="relative bottom-[2px] text-lg text-subtle-foreground leading-none">
                {appInfo.version}
                {appInfo.name !== 'StageVibe' && (
                  <span>
                    {' ('}
                    {appInfo.name
                      .replace(/^StageVibe\s*/, '')
                      .replace(/[()]/g, '')}
                    {')'}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="mt-2">
                <AppUpdateStatus />
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border/30" />

          {/* Update Channel Setting (only for prerelease builds) */}
          {appInfo.releaseChannel === 'prerelease' && (
            <>
              <UpdateChannelSetting />
              <hr className="border-border/30" />
            </>
          )}

          {/* Details Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-y-3">
              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.bundleId')}
                </span>
                <span className="break-all text-foreground text-sm">
                  {appInfo.bundleId}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.releaseChannel')}
                </span>
                <span className="text-foreground text-sm capitalize">
                  {appInfo.releaseChannel}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.platform')}
                </span>
                <span className="text-foreground text-sm capitalize">
                  {appInfo.platform}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.architecture')}
                </span>
                <span className="text-foreground text-sm">{appInfo.arch}</span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.author')}
                </span>
                <span className="text-foreground text-sm">
                  {appInfo.author}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.copyright')}
                </span>
                <span className="text-foreground text-sm">
                  {appInfo.copyright}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.license')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground text-sm">
                    AGPL-3.0
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setAppLicenseOpen(true);
                    }}
                    title={t('about.viewFullLicense')}
                  >
                    <ScrollTextIcon className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.homepage')}
                </span>
                <a
                  href="https://deepvibe.eu/stagevibe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'link', size: 'sm' }),
                    'w-min p-0',
                  )}
                >
                  {appInfo.homepage}
                </a>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('about.fields.otherVersions')}
                </span>
                <div className="text-foreground text-sm">
                  {Object.keys(appInfo.otherVersions).length > 0 ? (
                    <CollapsibleOtherVersions
                      versions={appInfo.otherVersions}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {t('about.otherVersions.none')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border/30" />

          {/* App Data Management */}
          <AppDataManagement />

          {/* Divider */}
          <hr className="border-border/30" />

          {/* Open Source Licenses */}
          <OpenSourceLicenses />
        </div>
      </OverlayScrollbar>

      <LicenseTextDialog
        entry={{
          name: appInfo.name,
          version: appInfo.version,
          license: 'AGPL-3.0',
          repository: 'https://github.com/deepvibe-eu/StageVibe',
          publisher: 'RheaOS',
          licenseText: agplLicenseText,
        }}
        open={appLicenseOpen}
        onOpenChange={setAppLicenseOpen}
      />
    </div>
  );
}
