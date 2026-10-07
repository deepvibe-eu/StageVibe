import { Button } from '@stagewise/stage-ui/components/button';
import { Checkbox } from '@stagewise/stage-ui/components/checkbox';
import { useKartonState, useKartonProcedure } from '@ui/hooks/use-karton';
import { useTrack } from '@ui/hooks/use-track';
import { useState, useRef, useEffect } from 'react';
import { OverlayScrollbar } from '@stagewise/stage-ui/components/overlay-scrollbar';
import { cn } from '@ui/utils';
import { produceWithPatches } from 'immer';
import type { TelemetryLevel } from '@shared/karton-contracts/ui/shared-types';
import type { CurrentUsageResponse } from '@shared/karton-contracts/pages-api/types';
import { SignInOptionsPanel } from '@ui/components/auth/sign-in-options-panel';
import { useTranslation } from 'react-i18next';
import i18n from '@ui/i18n';

const CONSOLE_URL =
  import.meta.env.VITE_STAGEWISE_CONSOLE_URL || 'https://console.stagewise.io';

export function AccountSection() {
  const { t } = useTranslation('settings');
  const userAccount = useKartonState((s) => s.userAccount);
  const sendOtp = useKartonProcedure((p) => p.userAccount.sendOtp);
  const verifyOtp = useKartonProcedure((p) => p.userAccount.verifyOtp);
  // Auth handoff procedures wait for OS callbacks — see 02-auth.tsx for
  // rationale on the extended RPC timeout.
  const AUTH_RPC_TIMEOUT_MS = (5 * 60 + 10) * 1000; // 5 min 10 sec
  const signInSocial = useKartonProcedure((p) =>
    p.userAccount.signInSocial.withTimeout(AUTH_RPC_TIMEOUT_MS),
  );
  const signInEmail = useKartonProcedure((p) =>
    p.userAccount.signInEmail.withTimeout(AUTH_RPC_TIMEOUT_MS),
  );
  const logout = useKartonProcedure((p) => p.userAccount.logout);
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);
  // `useTrack` swallows RPC errors so a failed telemetry capture (e.g.
  // backend karton server unavailable) cannot crash the page.
  const track = useTrack();

  // Fire once per mounted route instance. The ref guard prevents React
  // StrictMode's development double-invocation; intentional route remounts
  // should still emit a fresh page-view event.
  const didTrackViewRef = useRef(false);
  useEffect(() => {
    if (didTrackViewRef.current) return;
    didTrackViewRef.current = true;
    track('account-page-viewed');
  }, [track]);

  return (
    <div className="h-full w-full">
      {/* Content */}
      <OverlayScrollbar
        className="h-full"
        contentClassName={cn(
          'px-6 pt-24 pb-24',
          userAccount?.status !== 'authenticated' &&
            userAccount?.status !== 'server_unreachable' &&
            'flex min-h-full items-center',
        )}
      >
        {userAccount?.status === 'authenticated' ||
        userAccount?.status === 'server_unreachable' ? (
          <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-8">
            {/* Header */}
            <div>
              <h1 className="font-semibold text-foreground text-xl">
                {t('account.title')}
              </h1>
            </div>
            <AuthenticatedView
              email={userAccount.user?.email}
              subscription={userAccount.subscription}
              machineId={userAccount.machineId}
              onLogout={() => void logout()}
            />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col items-center">
            <SignInOptionsPanel
              title={t('account.authenticate.title')}
              description={t('account.authenticate.description')}
              sendOtp={(email, token) => sendOtp(email, token ?? '')}
              verifyOtp={verifyOtp}
              signInSocial={signInSocial}
              signInEmail={signInEmail}
              trackingPrefix="account-auth"
              track={track}
              onUseApiKeys={() =>
                void openSettings({ section: 'models-providers' })
              }
              onUseSubscription={() =>
                void openSettings({ section: 'models-providers' })
              }
            />
          </div>
        )}
      </OverlayScrollbar>
    </div>
  );
}

function AuthenticatedView({
  email,
  subscription,
  machineId,
  onLogout,
}: {
  email?: string;
  subscription?: {
    active: boolean;
    plan?: string;
    expiresAt?: string;
  };
  machineId?: string;
  onLogout: () => void;
}) {
  const { t } = useTranslation('settings');
  const openExternalUrl = useKartonProcedure((p) => p.openExternalUrl);

  return (
    <>
      {/* User info */}
      <div className="flex flex-col gap-2">
        <h2 className="font-medium text-foreground text-lg">
          {email ?? t('account.unknownUser')}
        </h2>
        <p className="text-muted-foreground text-sm">{t('account.signedIn')}</p>
      </div>

      <hr className="border-border-subtle" />

      {/* Account details */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-x-4">
            <span className="font-medium text-muted-foreground text-sm">
              {t('account.fields.email')}
            </span>
            <span className="break-all text-foreground text-sm">{email}</span>
          </div>

          {subscription && (
            <>
              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('account.fields.plan')}
                </span>
                <span className="text-foreground text-sm capitalize">
                  {subscription.plan ?? t('account.planFree')}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-x-4">
                <span className="font-medium text-muted-foreground text-sm">
                  {t('account.fields.status')}
                </span>
                <span className="text-foreground text-sm">
                  {subscription.active
                    ? t('account.statusActive')
                    : t('account.statusInactive')}
                </span>
              </div>
              {subscription.expiresAt && (
                <div className="grid grid-cols-[140px_1fr] gap-x-4">
                  <span className="font-medium text-muted-foreground text-sm">
                    {t('account.fields.expires')}
                  </span>
                  <span className="text-foreground text-sm">
                    {new Date(subscription.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}

          {machineId && (
            <div className="grid grid-cols-[140px_1fr] gap-x-4">
              <span className="font-medium text-muted-foreground text-sm">
                {t('account.fields.machineId')}
              </span>
              <span className="break-all font-mono text-foreground text-sm">
                {machineId}
              </span>
            </div>
          )}
        </div>
      </div>

      <hr className="border-border-subtle" />

      <TelemetrySetting />

      <hr className="border-border-subtle" />

      <UsageSection />

      <hr className="border-border-subtle" />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onLogout}>
          {t('account.signOut')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void openExternalUrl(CONSOLE_URL)}
        >
          {t('account.openConsole')}
        </Button>
      </div>
    </>
  );
}

const WINDOW_LABEL_KEYS: Record<string, string> = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};

function formatCredits(raw: number): string {
  const dollars = raw / 10_000;
  return `$${dollars.toFixed(2)}`;
}

function formatResetTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return i18n.t('settings:account.usage.resetNow');
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 24)
    return i18n.t('settings:account.usage.resetInHours', { hours: diffH });
  const diffD = Math.floor(diffH / 24);
  return i18n.t('settings:account.usage.resetInDays', { days: diffD });
}

function UsageSection() {
  const { t } = useTranslation('settings');
  const getUsageCurrent = useKartonProcedure(
    (p) => p.userAccount.getUsageCurrent,
  );
  const getUsageCurrentRef = useRef(getUsageCurrent);
  getUsageCurrentRef.current = getUsageCurrent;
  const [usage, setUsage] = useState<CurrentUsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUsageCurrentRef
      .current()
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : t('account.usage.failed');
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-foreground">
        {t('account.usage.title')}
      </h3>

      {loading && (
        <p className="text-muted-foreground text-sm">
          {t('account.usage.loading')}
        </p>
      )}

      {error && <p className="text-error-foreground text-sm">{error}</p>}

      {usage && (
        <div className="flex flex-col gap-5">
          {/* Credits */}
          <div className="grid grid-cols-[140px_1fr] gap-x-4">
            <span className="font-medium text-muted-foreground text-sm">
              {t('account.usage.credits')}
            </span>
            <span className="text-foreground text-sm">
              {t('account.usage.remaining', {
                credits: formatCredits(usage.prepaidBalance),
              })}
            </span>
          </div>

          {/* Rate-limit windows */}
          <div className="flex flex-col gap-3">
            {usage.windows.map((w) => {
              const remaining = Math.max(0, 100 - w.usedPercent);
              const barColor =
                w.usedPercent >= 100
                  ? 'bg-error-solid'
                  : w.usedPercent > 80
                    ? 'bg-warning-solid'
                    : 'bg-primary-solid';
              return (
                <div key={w.type} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">
                      {WINDOW_LABEL_KEYS[w.type]
                        ? t(
                            `account.usage.windows.${WINDOW_LABEL_KEYS[w.type]}`,
                          )
                        : w.type}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {t('account.usage.percentLeft', {
                        percent: remaining.toFixed(0),
                        time: formatResetTime(w.resetsAt),
                      })}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-1">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${w.usedPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetrySetting() {
  const { t } = useTranslation('settings');
  const preferences = useKartonState((s) => s.preferences);
  const updatePreferences = useKartonProcedure((p) => p.preferences.update);

  const telemetryMode = preferences.privacy.telemetryLevel;

  const handleTelemetryChange = async (value: TelemetryLevel) => {
    const [, patches] = produceWithPatches(preferences, (draft) => {
      draft.privacy.telemetryLevel = value;
    });
    await updatePreferences(patches);
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-foreground">
        {t('account.telemetry.title')}
      </h3>
      <p className="text-muted-foreground text-sm">
        {t('account.telemetry.description')}
      </p>

      <div className="flex items-center gap-2">
        <Checkbox
          size="xs"
          id="telemetry-anonymous-checkbox"
          checked={telemetryMode === 'anonymous' || telemetryMode === 'full'}
          onCheckedChange={(checked: boolean) => {
            void handleTelemetryChange(checked ? 'anonymous' : 'off');
          }}
        />
        <label
          htmlFor="telemetry-anonymous-checkbox"
          className="text-muted-foreground text-xs"
        >
          {t('account.telemetry.anonymous')}
        </label>
      </div>
      <div
        className={cn(
          'flex items-center gap-2',
          telemetryMode === 'off' && 'pointer-events-none opacity-50',
        )}
      >
        <Checkbox
          size="xs"
          id="telemetry-full-checkbox"
          checked={telemetryMode === 'full'}
          disabled={telemetryMode === 'off'}
          onCheckedChange={(checked: boolean) => {
            void handleTelemetryChange(checked ? 'full' : 'anonymous');
          }}
        />
        <label
          htmlFor="telemetry-full-checkbox"
          className="text-muted-foreground text-xs"
        >
          {t('account.telemetry.full')}
        </label>
      </div>
    </div>
  );
}
