import { useState, useMemo } from 'react';
import { cn } from '@ui/utils';
import { IconTriangleWarning } from '@stagewise/icons';
import { IconLockKeyOutline18 } from '@stagewise/icons';
import { Button } from '@stagewise/stage-ui/components/button';
import {
  RefreshCcwIcon,
  CopyIcon,
  CopyCheckIcon,
  ArrowUpRightIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@stagewise/stage-ui/components/collapsible';
import { ChevronDownIcon } from 'lucide-react';
import { useKartonState, useKartonProcedure } from '@ui/hooks/use-karton';
import { useOpenAgent } from '@ui/hooks/use-open-chat';
import { getAvailableModel } from '@shared/available-models';
import type { ModelProvider } from '@shared/karton-contracts/ui/shared-types';
import type { AgentRuntimeError } from '@shared/karton-contracts/ui/agent';
import { useCmdEnterTarget } from '@ui/hooks/use-cmd-enter-target';
import { CmdEnterPriority } from '@ui/utils/cmd-enter-registry';
import { HotkeyCombo } from '@ui/components/hotkey-combo';
import { HotkeyActions } from '@shared/hotkeys';
import { useTranslation } from 'react-i18next';
import i18n from '@ui/i18n';

interface RetryActionProps {
  retryRef?: (element: HTMLElement | null) => void;
  showRetryHotkey?: boolean;
}

const consoleUrl =
  import.meta.env.VITE_STAGEWISE_CONSOLE_URL || 'https://console.stagewise.io';

type GenericRuntimeError = Extract<AgentRuntimeError, { kind?: undefined }>;

/** Check if an error message indicates an API authorization failure */
function isAuthorizationError(error: GenericRuntimeError): boolean {
  const msg = error.message.toLowerCase();
  const code = error.code;
  if (code === 401 || code === 403) return true;
  return (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('unauthorized') ||
    msg.includes('authentication') ||
    msg.includes('unauthenticated') ||
    msg.includes('invalid api key') ||
    msg.includes('invalid x-api-key') ||
    msg.includes('no api key') ||
    msg.includes('missing api key') ||
    msg.includes('api key provided') ||
    msg.includes('permission denied') ||
    msg.includes('access denied')
  );
}

function formatRelativeTime(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return i18n.t('chat:errors.time.shortly');
  const minutes = Math.ceil(diff / 60_000);
  if (minutes < 60)
    return i18n.t('chat:errors.time.inMinutes', { count: minutes });

  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return i18n.t('chat:errors.time.inHours', { count: hours });

  const days = Math.ceil(hours / 24);
  return i18n.t('chat:errors.time.inDays', { count: days });
}

export function MessageRuntimeError({
  agentInstanceId,
  error,
  onRetry,
  canRetry,
  isWorking = false,
}: {
  agentInstanceId: string;
  error: AgentRuntimeError;
  onRetry: () => void;
  canRetry: boolean;
  /** Whether the agent is currently streaming. Used to suppress Retry in UIs
   *  that bypass the `canRetry` last-message gate (e.g. upstream-overload). */
  isWorking?: boolean;
}) {
  const canShowRetry = canRetry || !isWorking;

  const { setRef: retryRef, isWinner: retryIsWinner } = useCmdEnterTarget({
    id: `message-runtime-error-retry-${agentInstanceId}`,
    priority: CmdEnterPriority.ERROR_RETRY,
    action: onRetry,
    enabled: canShowRetry,
  });
  const retryProps: RetryActionProps = {
    retryRef,
    showRetryHotkey: retryIsWinner,
  };

  if (error.kind === 'upstream-overload') {
    return (
      <UpstreamOverloadError
        error={error}
        isWorking={isWorking}
        onRetry={onRetry}
        {...retryProps}
      />
    );
  }

  if (error.kind === 'plan-limit-exceeded') {
    return (
      <PlanLimitExceededError
        error={error}
        canRetry={canShowRetry}
        onRetry={onRetry}
        {...retryProps}
      />
    );
  }

  if (error.kind === 'model-restricted') {
    return (
      <ModelRestrictedError
        error={error}
        canRetry={canShowRetry}
        onRetry={onRetry}
        {...retryProps}
      />
    );
  }

  if (error.kind === 'subscription-required') {
    return (
      <SubscriptionRequiredError
        error={error}
        canRetry={canShowRetry}
        onRetry={onRetry}
        {...retryProps}
      />
    );
  }

  if (error.kind === 'waiting-for-connection') {
    return (
      <WaitingForConnectionError
        error={error}
        canRetry={canShowRetry}
        onRetry={onRetry}
        {...retryProps}
      />
    );
  }

  return (
    <GenericError
      agentInstanceId={agentInstanceId}
      error={error}
      canRetry={canShowRetry}
      onRetry={onRetry}
      {...retryProps}
    />
  );
}

function PlanLimitExceededError({
  error,
  canRetry,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  error: Extract<AgentRuntimeError, { kind: 'plan-limit-exceeded' }>;
  canRetry: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  const subscription = useKartonState((s) => s.userAccount.subscription);
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);
  const openExternalUrl = useKartonProcedure((p) => p.openExternalUrl);
  const plan = subscription?.plan;

  const resetsAt = error.exceededWindows[0]?.resetsAt;
  const resetLabel = resetsAt ? formatRelativeTime(resetsAt) : null;

  const { heading, description, ctaLabel, ctaHref } = useMemo(() => {
    const resetSuffix = resetLabel
      ? t('errors.limitResets', { when: resetLabel })
      : '';

    switch (plan) {
      case 'ultra':
        return {
          heading: t('errors.usageLimitReached'),
          description: t('errors.descriptionUltra', { reset: resetSuffix }),
          ctaLabel: t('errors.buyCredits'),
          ctaHref: consoleUrl,
        };
      case 'pro':
        return {
          heading: t('errors.usageLimitReached'),
          description: t('errors.descriptionPro', { reset: resetSuffix }),
          ctaLabel: t('errors.buyCredits'),
          ctaHref: consoleUrl,
        };
      default:
        return {
          heading: t('errors.usageLimitReached'),
          description: t('errors.descriptionFree', { reset: resetSuffix }),
          ctaLabel: t('errors.buyCredits'),
          ctaHref: consoleUrl,
        };
    }
  }, [plan, resetLabel, t]);

  return (
    <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-derived-strong p-2 text-sm">
      <span className="font-medium text-foreground">{heading}</span>

      <div className="text-foreground">{description}</div>

      <div className="flex flex-row items-center justify-between gap-2 pt-1">
        <div>
          {canRetry && (
            <Button ref={retryRef} variant="ghost" size="xs" onClick={onRetry}>
              <RefreshCcwIcon className="size-3" />
              {t('errors.retry')}
              {showRetryHotkey && (
                <HotkeyCombo
                  action={HotkeyActions.CMD_ENTER}
                  size="xs"
                  variant="ghost"
                  className="ml-0.5"
                />
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => void openSettings({ section: 'models-providers' })}
          >
            {t('errors.configureOtherApiKeys')}
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => void openExternalUrl(ctaHref)}
          >
            {ctaLabel}
            <ArrowUpRightIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shows a card when a free-tier user tries to use a model that is not on
 * the free-tier whitelist and they have no prepaid credits. Offers CTAs to
 * upgrade the plan or configure BYOK API keys.
 */
function ModelRestrictedError({
  error,
  canRetry,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  error: Extract<AgentRuntimeError, { kind: 'model-restricted' }>;
  canRetry: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);
  const openExternalUrl = useKartonProcedure((p) => p.openExternalUrl);

  const modelName = useMemo(() => {
    if (!error.model) return null;
    // Strip the provider prefix to get the bare model ID for lookup
    const bareId = error.model.includes('/')
      ? error.model.split('/').slice(1).join('/')
      : error.model;
    const m = getAvailableModel(bareId);
    return m?.modelDisplayName ?? null;
  }, [error.model]);

  const planLabel = error.plan ?? 'free';
  const heading = modelName
    ? t('errors.modelNotAvailableOnPlan', { model: modelName, plan: planLabel })
    : t('errors.modelNotAvailableOnPlanGeneric', { plan: planLabel });

  return (
    <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-derived-strong p-2 text-sm">
      <span className="font-medium text-foreground">{heading}</span>

      <div className="text-foreground">{t('errors.byokDescription')}</div>

      <div className="flex flex-row items-center justify-between gap-2 pt-1">
        <div>
          {canRetry && (
            <Button ref={retryRef} variant="ghost" size="xs" onClick={onRetry}>
              <RefreshCcwIcon className="size-3" />
              {t('errors.retry')}
              {showRetryHotkey && (
                <HotkeyCombo
                  action={HotkeyActions.CMD_ENTER}
                  size="xs"
                  variant="ghost"
                  className="ml-0.5"
                />
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => void openSettings({ section: 'models-providers' })}
          >
            {t('errors.configureOtherApiKeys')}
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => void openExternalUrl(consoleUrl)}
          >
            {t('errors.upgradePlan')}
            <ArrowUpRightIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shows a card when a user without a subscription tries to use AI models
 * through Stagewise Inference. Offers CTAs to upgrade, configure BYOK,
 * or connect a coding plan.
 */
function SubscriptionRequiredError({
  canRetry,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  error: Extract<AgentRuntimeError, { kind: 'subscription-required' }>;
  canRetry: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);
  const openExternalUrl = useKartonProcedure((p) => p.openExternalUrl);

  return (
    <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-derived-strong p-2 text-sm">
      <div className="flex flex-row items-center gap-1.5">
        <IconLockKeyOutline18 className="size-3.5 shrink-0 text-foreground" />
        <span className="font-medium text-foreground">
          {t('errors.subscriptionRequired')}
        </span>
      </div>

      <div className="text-foreground">
        {t('errors.subscriptionRequiredDescription')}
      </div>

      <div className="flex flex-row items-center justify-between gap-2 pt-1">
        <div>
          {canRetry && (
            <Button ref={retryRef} variant="ghost" size="xs" onClick={onRetry}>
              <RefreshCcwIcon className="size-3" />
              {t('errors.retry')}
              {showRetryHotkey && (
                <HotkeyCombo
                  action={HotkeyActions.CMD_ENTER}
                  size="xs"
                  variant="ghost"
                  className="ml-0.5"
                />
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => void openSettings({ section: 'models-providers' })}
          >
            {t('errors.configureApiKeys')}
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => void openExternalUrl(consoleUrl)}
          >
            {t('errors.upgradePlan')}
            <ArrowUpRightIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shows a formal, non-alarming card for upstream-provider overload errors
 * (429/502/503/529, Anthropic `overloaded_error`).
 *
 * Retry is shown whenever the agent is not currently streaming. We
 * intentionally bypass the shared `canRetry` gate (which requires the tail
 * of history to be a user message) because `onError` often fires after an
 * empty assistant message has been appended, yet the backend's
 * `retryLastUserMessage` walks history backward to find the last user
 * message and works regardless.
 */
function UpstreamOverloadError({
  error,
  isWorking,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  error: Extract<AgentRuntimeError, { kind: 'upstream-overload' }>;
  isWorking: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  const description = t('errors.upstreamDescription');

  // Read the name from the error snapshot (not live state) so that switching
  // the active model while the card is visible does not mislabel the heading.
  const modelName = useMemo(() => {
    if (!error.modelId) return null;
    const m = getAvailableModel(error.modelId);
    return m?.modelDisplayName ?? null;
  }, [error.modelId]);
  const heading = modelName
    ? t('errors.modelTemporarilyUnavailable', { model: modelName })
    : t('errors.modelTemporarilyUnavailableGeneric');

  return (
    <div className="mt-6 flex w-full flex-col gap-2 rounded-lg border border-derived bg-surface-1 p-3 text-sm">
      <span className="font-medium text-foreground">{heading}</span>

      <span className="text-muted-foreground text-xs">{description}</span>

      {!isWorking && (
        <div className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button ref={retryRef} variant="primary" size="xs" onClick={onRetry}>
            <RefreshCcwIcon className="size-3" />
            {t('errors.retry')}
            {showRetryHotkey && (
              <HotkeyCombo
                action={HotkeyActions.CMD_ENTER}
                size="xs"
                variant="solid"
                className="ml-0.5"
              />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function WaitingForConnectionError({
  error,
  canRetry,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  error: Extract<AgentRuntimeError, { kind: 'waiting-for-connection' }>;
  canRetry: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  return (
    <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-warning-solid/30 bg-warning-background p-2 text-sm">
      <div className="flex flex-row items-center gap-1.5">
        <IconTriangleWarning className="size-3.5 shrink-0 text-warning-foreground" />
        <span className="font-medium text-warning-foreground">
          {t('errors.waitingForConnection')}
        </span>
      </div>

      <div className="text-foreground">
        {t('errors.waitingForConnectionDescription')}
      </div>

      <div className="text-muted-foreground text-xs">
        {t('errors.lastNetworkError', { message: error.originalMessage })}
      </div>

      {canRetry && (
        <div className="flex flex-row justify-end pt-1">
          <Button ref={retryRef} variant="primary" size="xs" onClick={onRetry}>
            <RefreshCcwIcon className="size-3" />
            {t('errors.retry')}
            {showRetryHotkey && (
              <HotkeyCombo
                action={HotkeyActions.CMD_ENTER}
                size="xs"
                variant="solid"
                className="ml-0.5"
              />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function GenericError({
  agentInstanceId,
  error,
  canRetry,
  onRetry,
  retryRef,
  showRetryHotkey,
}: {
  agentInstanceId: string;
  error: GenericRuntimeError;
  canRetry: boolean;
  onRetry: () => void;
} & RetryActionProps) {
  const { t } = useTranslation('chat');
  const [helpExpanded, setHelpExpanded] = useState(false);
  const openExternalUrl = useKartonProcedure((p) => p.openExternalUrl);
  const [hasCopied, setHasCopied] = useState(false);
  const [openAgent] = useOpenAgent();
  const openSettings = useKartonProcedure((p) => p.appScreen.openSettings);

  const activeModelId = useKartonState((s) =>
    openAgent ? s.agents.instances[openAgent]?.state.activeModelId : undefined,
  );

  const providerConfigs = useKartonState((s) => s.preferences?.providerConfigs);

  const stagewiseLoginRequired = useMemo(() => {
    if (!isAuthorizationError(error)) return false;
    if (!activeModelId || !providerConfigs) return false;

    const builtInModel = getAvailableModel(activeModelId);
    if (!builtInModel) return false;

    const provider = builtInModel.officialProvider as ModelProvider | undefined;
    if (!provider) return false;
    return providerConfigs[provider]?.mode === 'stagewise';
  }, [error, activeModelId, providerConfigs]);

  if (stagewiseLoginRequired) {
    return (
      <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-derived-strong p-2 text-sm">
        <div className="flex flex-row items-center gap-1.5">
          <IconLockKeyOutline18 className="size-3.5 shrink-0 text-foreground" />
          <span className="font-medium text-foreground">
            {t('errors.notLoggedIn')}
          </span>
        </div>

        <div className="text-foreground">
          {t('errors.notLoggedInDescription')}
        </div>

        <div className="flex flex-row items-center justify-between gap-2 pt-1">
          <div>
            {canRetry && (
              <Button
                ref={retryRef}
                variant="ghost"
                size="xs"
                onClick={onRetry}
              >
                <RefreshCcwIcon className="size-3" />
                {t('errors.retry')}
                {showRetryHotkey && (
                  <HotkeyCombo
                    action={HotkeyActions.CMD_ENTER}
                    size="xs"
                    variant="ghost"
                    className="ml-0.5"
                  />
                )}
              </Button>
            )}
          </div>
          <div className="flex flex-row justify-end gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => void openSettings({ section: 'models-providers' })}
            >
              {t('errors.configureOtherApiKeys')}
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={() => void openSettings({ section: 'account' })}
            >
              {t('errors.logIn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const copyError = () => {
    const errorText = `Error${error.code ? ` (Code: ${error.code})` : ''}: ${error.message}${error.stack ? `\n\nStack trace:\n${error.stack}` : ''}`;
    navigator.clipboard.writeText(errorText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const reportIssueUrl = `https://github.com/stagewise-io/stagewise/issues/new?template=5.agent_issue.yml&conversation-id=${agentInstanceId}&error-data=${encodeURIComponent(JSON.stringify(error))}`;

  return (
    <div className="mt-6 flex w-full flex-col gap-1.5 rounded-lg border border-derived-strong p-2 text-sm">
      <div className="flex flex-row items-center gap-1.5">
        <IconTriangleWarning className="size-3.5 shrink-0 text-error-foreground" />
        <span className="font-medium text-error-foreground">
          {t('errors.heading')}
        </span>
        <Button
          variant="ghost"
          size="icon-2xs"
          className="ml-auto"
          onClick={copyError}
        >
          {hasCopied ? (
            <CopyCheckIcon className="size-3" />
          ) : (
            <CopyIcon className="size-3" />
          )}
        </Button>
      </div>

      <div className="text-foreground">
        {error.message}{' '}
        {error.code && (
          <span className="text-muted-foreground text-xs">
            {t('errors.errorCode', { code: error.code })}
          </span>
        )}
      </div>

      <Collapsible open={helpExpanded} onOpenChange={setHelpExpanded}>
        <CollapsibleTrigger
          size="condensed"
          className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between gap-2 py-0.5"
        >
          <span className="text-xs">{t('errors.whatToDo')}</span>
          <ChevronDownIcon
            className={cn(
              'size-3 transition-transform',
              helpExpanded && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-0.5 text-muted-foreground text-xs">
            {t('errors.reportPrefix')}{' '}
            <a
              href={reportIssueUrl}
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                void openExternalUrl(reportIssueUrl);
              }}
              className="text-primary-foreground underline hover:text-primary-foreground/80"
            >
              {t('errors.reportLink')}
            </a>
            {t('errors.reportSuffix')}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {canRetry && (
        <div className="flex flex-row justify-end pt-1">
          <Button ref={retryRef} variant="primary" size="xs" onClick={onRetry}>
            <RefreshCcwIcon className="size-3" />
            {t('errors.retry')}
            {showRetryHotkey && (
              <HotkeyCombo
                action={HotkeyActions.CMD_ENTER}
                size="xs"
                variant="solid"
                className="ml-0.5"
              />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
