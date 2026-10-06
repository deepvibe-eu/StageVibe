import {
  IconTriangleWarningOutline18,
  IconCheck2Outline18,
  IconLoader6Outline18,
  IconXmarkOutline18,
} from '@stagewise/icons';
import { useMemo } from 'react';
import { ToolPartUI } from './shared/tool-part-ui';
import { cn, stripMountPrefix } from '@ui/utils';
import { useToolAutoExpand } from './shared/use-tool-auto-expand';
import type { LintingDiagnostic } from '@shared/karton-contracts/ui/agent/tools/types';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { useTranslation } from 'react-i18next';

export const GetLintingDiagnosticsToolPart = ({
  part,
  disableShimmer = false,
  capMaxHeight = false,
  isLastPart = false,
}: {
  part: Extract<AgentToolUIPart, { type: 'tool-getLintingDiagnostics' }>;
  disableShimmer?: boolean;
  capMaxHeight?: boolean;
  isLastPart?: boolean;
}) => {
  const { t } = useTranslation('tools');
  const streaming = useMemo(() => {
    return part.state === 'input-streaming' || part.state === 'input-available';
  }, [part.state]);

  const state = useMemo(() => {
    if (streaming) return 'streaming';
    if (part.state === 'output-error') return 'error';
    return 'success';
  }, [part.state, streaming]);

  // Use the unified auto-expand hook
  const { expanded, handleUserSetExpanded } = useToolAutoExpand({
    isStreaming: streaming,
    isLastPart,
  });

  const summary = part.output?.summary;
  const errors = summary?.errors ?? 0;
  const warnings = summary?.warnings ?? 0;
  const totalFiles = summary?.totalFiles ?? 0;
  const hasDiagnostics = useMemo(
    () => errors > 0 || warnings > 0,
    [errors, warnings],
  );

  // Parse files from output
  const files = useMemo(() => {
    return part.output?.files ?? [];
  }, [part.output?.files]);

  // Error state display
  if (state === 'error') {
    return (
      <div className={cn('group/exploring-part block min-w-32 rounded-xl')}>
        <div className="flex h-6 cursor-default items-center gap-1 rounded-lg text-muted-foreground">
          <div className="flex w-full flex-row items-center justify-start gap-1">
            <IconXmarkOutline18 className="size-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground text-xs">
              {part.errorText ?? t('linting.errorChecking')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToolPartUI
      expanded={expanded}
      setExpanded={handleUserSetExpanded}
      isShimmering={!disableShimmer && streaming}
      trigger={
        <>
          {!streaming &&
            (hasDiagnostics ? (
              <IconTriangleWarningOutline18 className="size-3 shrink-0" />
            ) : (
              <IconCheck2Outline18 className="size-3 shrink-0" />
            ))}
          <div className={cn('flex flex-row items-center justify-start gap-1')}>
            {streaming ? (
              <LoadingHeader disableShimmer={disableShimmer} />
            ) : (
              <SuccessHeader
                errors={errors}
                warnings={warnings}
                totalFiles={totalFiles}
                hasDiagnostics={hasDiagnostics}
              />
            )}
          </div>
        </>
      }
      content={
        <>
          {streaming && (
            <div className="overflow-x-hidden text-muted-foreground text-xs opacity-75">
              {t('linting.checkingForIssues')}
            </div>
          )}
          {state === 'success' && hasDiagnostics && files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((file) => (
                <div key={file.path} className="flex flex-col gap-0.5">
                  <div className="truncate font-medium text-muted-foreground text-xs">
                    {stripMountPrefix(file.path)}
                  </div>
                  <div className="flex flex-col gap-0.5 pl-2">
                    {file.diagnostics.map((diag, idx) => (
                      <DiagnosticRow
                        key={`${file.path}-${idx}`}
                        diagnostic={diag}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {state === 'success' && !hasDiagnostics && (
            <div className="pb-1 text-muted-foreground text-xs opacity-75">
              {t('linting.noIssuesFound')}
            </div>
          )}
        </>
      }
      contentClassName={capMaxHeight ? 'max-h-48' : undefined}
      contentFooterClassName="px-0"
    />
  );
};

const DiagnosticRow = ({ diagnostic }: { diagnostic: LintingDiagnostic }) => {
  const isError = diagnostic.severity === 1;

  return (
    <div className="flex flex-row items-start gap-1.5 text-xs">
      {isError ? (
        <IconXmarkOutline18 className="mt-0.5 size-3 shrink-0 text-error-foreground" />
      ) : (
        <IconTriangleWarningOutline18 className="mt-0.5 size-3 shrink-0 text-warning-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate text-muted-foreground opacity-75">
        {diagnostic.message}
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground/50 tabular-nums">
        L{diagnostic.line}:{diagnostic.column}
      </span>
    </div>
  );
};

const SuccessHeader = ({
  errors,
  warnings,
  totalFiles,
  hasDiagnostics,
}: {
  errors: number;
  warnings: number;
  totalFiles: number;
  hasDiagnostics: boolean;
}) => {
  const { t } = useTranslation('tools');
  return (
    <div className="pointer-events-none flex flex-row items-center justify-start gap-1 overflow-hidden">
      <span className={cn('shrink-0 text-xs')}>
        {hasDiagnostics ? (
          <>
            <span className="font-medium">{t('linting.foundLabel')} </span>
            {errors > 0 && (
              <span>{t('linting.errorCount', { count: errors })}</span>
            )}
            {errors > 0 && warnings > 0 && ', '}
            {warnings > 0 && (
              <span>{t('linting.warningCount', { count: warnings })}</span>
            )}
            {totalFiles > 0 && t('linting.inFiles', { count: totalFiles })}
          </>
        ) : (
          t('linting.noIssues')
        )}
      </span>
    </div>
  );
};

const LoadingHeader = ({ disableShimmer }: { disableShimmer?: boolean }) => {
  const { t } = useTranslation('tools');
  return (
    <div className="flex flex-row items-center justify-start gap-1 overflow-hidden">
      <IconLoader6Outline18
        className={cn(
          'size-3 shrink-0 animate-spin',
          disableShimmer ? '' : 'text-primary-foreground',
        )}
      />
      <span
        dir="ltr"
        className={cn(
          'truncate text-xs',
          disableShimmer ? '' : 'shimmer-text-primary',
        )}
      >
        {t('linting.checkingForIssues')}
      </span>
    </div>
  );
};
