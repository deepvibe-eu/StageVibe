import { useKartonState } from '@ui/hooks/use-karton';
import type {
  UserMessageMetadata,
  AttachmentMetadata,
} from '@shared/karton-contracts/ui/agent/metadata';
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  memo,
} from 'react';
import type { ReasoningUIPart } from 'ai';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { GlobToolPart } from './glob';
import { IconMagnifierOutline18 } from '@stagewise/icons';
import { GrepSearchToolPart } from './grep-search';
import { ReadToolPart } from './read';
import { LsToolPart } from './ls';
import { SearchInLibraryDocsToolPart } from './search-in-library-docs';
import { ListLibraryDocsToolPart } from './list-library-docs';
import { cn } from '@ui/utils';
import { useTranslation } from 'react-i18next';
import type { PluginDefinition } from '@shared/plugins';
import { useIsTruncated } from '@ui/hooks/use-is-truncated';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@stagewise/stage-ui/components/tooltip';
import { ToolPartUI } from './shared/tool-part-ui';
import { ThinkingPart } from '../thinking';
import { ReadConsoleLogsToolPart } from './read-console-logs';
import { ExecuteSandboxJsToolPart } from './execute-sandbox-js';
import { GetLintingDiagnosticsToolPart } from './get-linting-diagnostics';
import {
  getSandboxLabel,
  parseCDPCalls,
  parseWriteFileCalls,
  parseReadAttachmentCalls,
  parseOutputAttachmentCalls,
  resolveTabHostname,
  getAttachmentLabel,
} from './utils/sandbox-label-utils';

// Context for tracking expanded children within exploring section
interface ExploringContentContextValue {
  registerExpanded: (id: string) => void;
  unregisterExpanded: (id: string) => void;
}

export const ExploringContentContext =
  createContext<ExploringContentContextValue | null>(null);

export const useExploringContentContext = () => {
  return useContext(ExploringContentContext);
};

export type ReadOnlyToolPart =
  | Extract<
      AgentToolUIPart,
      {
        type:
          | 'tool-glob'
          | 'tool-grepSearch'
          | 'tool-read'
          | 'tool-ls'
          | 'tool-searchInLibraryDocs'
          | 'tool-listLibraryDocs'
          | 'tool-executeSandboxJs'
          | 'tool-readConsoleLogs'
          | 'tool-getLintingDiagnostics';
      }
    >
  | ReasoningUIPart;

export function isReadOnlyToolPart(
  part: AgentToolUIPart | ReasoningUIPart,
): part is ReadOnlyToolPart {
  return (
    part.type === 'reasoning' ||
    part.type === 'tool-glob' ||
    part.type === 'tool-grepSearch' ||
    part.type === 'tool-read' ||
    part.type === 'tool-ls' ||
    part.type === 'tool-searchInLibraryDocs' ||
    part.type === 'tool-listLibraryDocs' ||
    part.type === 'tool-executeSandboxJs' ||
    part.type === 'tool-readConsoleLogs' ||
    part.type === 'tool-getLintingDiagnostics'
  );
}

const PartContent = ({
  part,
  minimal = false,
  disableShimmer = false,
  thinkingDuration,
  isLastPart = false,
  capMaxHeight = false,
  messageAttachments,
}: {
  part: ReadOnlyToolPart;
  minimal?: boolean;
  disableShimmer?: boolean;
  thinkingDuration?: number;
  isLastPart?: boolean;
  capMaxHeight?: boolean;
  messageAttachments?: AttachmentMetadata[];
}) => {
  switch (part.type) {
    case 'reasoning':
      return (
        <ThinkingPart
          part={part}
          isShimmering={!disableShimmer}
          thinkingDuration={thinkingDuration}
          isLastPart={isLastPart}
          capMaxHeight={capMaxHeight}
        />
      );
    case 'tool-glob':
      return (
        <GlobToolPart
          key={part.toolCallId}
          minimal={minimal}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-grepSearch':
      return (
        <GrepSearchToolPart
          key={part.toolCallId}
          minimal={minimal}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-read':
      return (
        <ReadToolPart
          minimal={minimal}
          key={part.toolCallId}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-ls':
      return (
        <LsToolPart
          minimal={minimal}
          key={part.toolCallId}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-searchInLibraryDocs':
      return (
        <SearchInLibraryDocsToolPart
          key={part.toolCallId}
          minimal={minimal}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-listLibraryDocs':
      return (
        <ListLibraryDocsToolPart
          key={part.toolCallId}
          minimal={minimal}
          part={part}
          disableShimmer={disableShimmer}
        />
      );
    case 'tool-executeSandboxJs':
      return (
        <ExecuteSandboxJsToolPart
          key={part.toolCallId}
          showBorder={!minimal}
          part={part}
          disableShimmer={disableShimmer}
          isLastPart={isLastPart}
          capMaxHeight={capMaxHeight}
          messageAttachments={messageAttachments}
        />
      );
    case 'tool-readConsoleLogs':
      return (
        <ReadConsoleLogsToolPart
          key={part.toolCallId}
          part={part}
          disableShimmer={disableShimmer}
          isLastPart={isLastPart}
          capMaxHeight={capMaxHeight}
        />
      );
    case 'tool-getLintingDiagnostics':
      return (
        <GetLintingDiagnosticsToolPart
          key={part.toolCallId}
          part={part}
          disableShimmer={disableShimmer}
          isLastPart={isLastPart}
          capMaxHeight={capMaxHeight}
        />
      );
    default:
      return null;
  }
};

const PLUGIN_SKILL_RE = /^plugins\/([^/]+)\/SKILL\.md$/;
const WORKSPACE_SKILL_RE =
  /^[^/]+\/\.(?:stagewise|agents)\/skills\/([^/]+)\/SKILL\.md$/;

export const ExploringToolParts = memo(
  function ExploringToolParts({
    items,
    isAutoExpanded,
    isShimmering,
    partsMetadata,
    messageAttachments,
  }: {
    items: { part: ReadOnlyToolPart; originalIndex: number }[];
    isAutoExpanded: boolean;
    isShimmering: boolean;
    partsMetadata: UserMessageMetadata['partsMetadata'];
    /** Attachments from the parent assistant message metadata */
    messageAttachments?: AttachmentMetadata[];
  }) {
    const { t } = useTranslation('tools');
    const [expanded, setExpanded] = useState(isAutoExpanded);
    const [expandedChildren, setExpandedChildren] = useState<Set<string>>(
      new Set(),
    );
    const isOnlyOnePart = useMemo(() => items.length === 1, [items]);
    const activeTabs = useKartonState((s) => s.contentTabs.tabs);
    const plugins = useKartonState((s) => s.plugins);

    const partsMetadataRef = useRef(partsMetadata);
    partsMetadataRef.current = partsMetadata;

    useEffect(() => {
      setExpanded(isAutoExpanded);
    }, [isAutoExpanded]);

    const registerExpanded = useCallback((id: string) => {
      setExpandedChildren((prev) => new Set(prev).add(id));
    }, []);

    const unregisterExpanded = useCallback((id: string) => {
      setExpandedChildren((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, []);

    const contextValue = useMemo(
      () => ({ registerExpanded, unregisterExpanded }),
      [registerExpanded, unregisterExpanded],
    );

    const hasExpandedChild = expandedChildren.size > 0;

    const partContents = useMemo(() => {
      return items.map((item, index) => {
        const { part, originalIndex } = item;
        // Use a stable key for reasoning parts (index-based) instead of part.text which changes during streaming
        const stableKey =
          part.type === 'reasoning' ? `reasoning-${index}` : part.toolCallId;
        const isLastPart = index === items.length - 1;
        const metadata = partsMetadataRef.current;
        return (
          <PartContent
            key={stableKey}
            part={part}
            minimal={true}
            disableShimmer
            isLastPart={isLastPart}
            messageAttachments={messageAttachments}
            thinkingDuration={
              part.type === 'reasoning' && originalIndex !== undefined
                ? (metadata?.[originalIndex]?.endedAt?.getTime() ?? 0) -
                  (metadata?.[originalIndex]?.startedAt?.getTime() ?? 0)
                : undefined
            }
          />
        );
      });
    }, [items, messageAttachments]);

    const explorationMetadata = useMemo(() => {
      let filesRead = 0;
      let filesFound = 0;
      const linesRead = 0;
      let docsRead = 0;
      let consoleLogsRead = 0;
      let hasUsedContext7Tools = false;
      let hasUsedFileTools = false;
      let lintingErrors = 0;
      let lintingWarnings = 0;
      let hasCheckedLinting = false;

      let screenshotsTaken = 0;
      let stylesInspected = 0;
      let domInspected = 0;
      let sandboxScriptsRun = 0;
      let sandboxFilesWritten = 0;
      const attachmentLabels: string[] = [];
      const inspectedHostnames = new Set<string>();
      const enabledPlugins = new Map<string, PluginDefinition>();
      const enabledWorkspaceSkills = new Set<string>();

      const finishedParts = items
        .map((i) => i.part)
        .filter((part) => part.state === 'output-available');
      finishedParts.forEach((part) => {
        switch (part.type) {
          case 'tool-read': {
            const path = part.input?.path ?? '';
            const pluginSkillMatch = path.match(PLUGIN_SKILL_RE);
            if (pluginSkillMatch) {
              const plugin = plugins.find((p) => p.id === pluginSkillMatch[1]);
              if (plugin) {
                enabledPlugins.set(plugin.id, plugin);
                break;
              }
            }
            const wsSkillMatch = path.match(WORKSPACE_SKILL_RE);
            if (wsSkillMatch?.[1]) {
              enabledWorkspaceSkills.add(wsSkillMatch[1]);
              break;
            }
            filesRead += 1;
            hasUsedFileTools = true;
            break;
          }
          case 'tool-ls': {
            filesRead += 1;
            hasUsedFileTools = true;
            break;
          }
          case 'tool-glob':
          case 'tool-grepSearch':
            filesFound += part.output?.result?.totalMatches ?? 0;
            hasUsedFileTools = true;
            break;
          case 'tool-searchInLibraryDocs':
            docsRead += 1;
            hasUsedContext7Tools = true;
            break;
          case 'tool-executeSandboxJs': {
            const script = part.input?.script ?? '';
            const cdpCalls = parseCDPCalls(script);
            const writeFileCalls = parseWriteFileCalls(script);
            const readAttCalls = parseReadAttachmentCalls(script);
            const multimodalCalls = parseOutputAttachmentCalls(script);

            if (multimodalCalls.length > 0) {
              for (let i = 0; i < multimodalCalls.length; i++)
                attachmentLabels.push(getAttachmentLabel(undefined, t));
            }

            if (readAttCalls.length > 0)
              for (let i = 0; i < readAttCalls.length; i++)
                attachmentLabels.push(t('sandbox.attachment'));

            const realWrites = writeFileCalls.filter(
              (c) => !c.relativePath.startsWith('att/'),
            );
            sandboxFilesWritten += realWrites.length;

            if (cdpCalls.length > 0) {
              for (const call of cdpCalls) {
                const hostname = resolveTabHostname(call.tabId, activeTabs);
                if (hostname) inspectedHostnames.add(hostname);

                if (call.method === 'Page.captureScreenshot')
                  screenshotsTaken++;
                else if (
                  call.method.startsWith('CSS.') &&
                  call.method !== 'CSS.enable'
                )
                  stylesInspected++;
                else if (
                  call.method.startsWith('DOM.') &&
                  call.method !== 'DOM.enable'
                )
                  domInspected++;
              }
            } else sandboxScriptsRun++;

            break;
          }
          case 'tool-readConsoleLogs':
            consoleLogsRead += 1;
            break;
          case 'tool-getLintingDiagnostics':
            hasCheckedLinting = true;
            lintingErrors += part.output?.summary?.errors ?? 0;
            lintingWarnings += part.output?.summary?.warnings ?? 0;
            break;
        }
      });

      const hasUsedBrowserTools =
        screenshotsTaken > 0 ||
        stylesInspected > 0 ||
        domInspected > 0 ||
        sandboxScriptsRun > 0 ||
        sandboxFilesWritten > 0 ||
        consoleLogsRead > 0;

      return {
        filesRead,
        filesFound,
        linesRead,
        docsRead,
        consoleLogsRead,
        hasUsedBrowserTools,
        hasUsedContext7Tools,
        hasUsedFileTools,
        lintingErrors,
        lintingWarnings,
        hasCheckedLinting,
        screenshotsTaken,
        stylesInspected,
        domInspected,
        sandboxScriptsRun,
        sandboxFilesWritten,
        attachmentLabels,
        inspectedHostnames,
        enabledPlugins,
        enabledWorkspaceSkills,
      };
    }, [items, activeTabs, plugins, t]);

    const isReasoningOnly = useMemo(
      () => items.every((i) => i.part.type === 'reasoning'),
      [items],
    );

    const explorationFinishedText = useMemo(() => {
      if (isReasoningOnly) return t('exploring.thought');

      const {
        filesFound,
        filesRead,
        docsRead,
        consoleLogsRead,
        hasUsedBrowserTools,
        hasUsedContext7Tools,
        hasUsedFileTools,
        lintingErrors,
        lintingWarnings,
        hasCheckedLinting,
        screenshotsTaken,
        stylesInspected,
        domInspected,
        sandboxScriptsRun,
        sandboxFilesWritten,
        attachmentLabels,
        inspectedHostnames,
        enabledPlugins,
        enabledWorkspaceSkills,
      } = explorationMetadata;

      const listSeparator = t('exploring.listSeparator');
      const joinList = (parts: string[]): string =>
        parts.length <= 1
          ? (parts[0] ?? '')
          : `${parts.slice(0, -1).join(listSeparator)}${t('exploring.listConjunction')}${parts.at(-1)}`;

      // Build the "Enabled ..." phrase for skill reads (plugins + workspace)
      const allSkillNames: string[] = [
        ...Array.from(enabledPlugins.values()).map((p) => p.displayName),
        ...Array.from(enabledWorkspaceSkills),
      ];
      let enabledText: string | null = null;
      if (allSkillNames.length > 0) {
        enabledText =
          allSkillNames.length <= 2
            ? t('exploring.enabledNames', {
                names: allSkillNames.join(listSeparator),
              })
            : enabledWorkspaceSkills.size > 0
              ? t('exploring.enabledCountSkills', {
                  count: allSkillNames.length,
                })
              : t('exploring.enabledCountPlugins', {
                  count: allSkillNames.length,
                });
      }

      const hostSuffix =
        inspectedHostnames.size === 1
          ? t('exploring.hostSuffixSingle', {
              hostname: Array.from(inspectedHostnames)[0],
            })
          : inspectedHostnames.size > 1
            ? t('exploring.hostSuffixMany', {
                count: inspectedHostnames.size,
              })
            : '';

      const textParts: string[] = [];
      if (filesFound > 0 || filesRead > 0)
        textParts.push(t('exploring.files', { count: filesFound + filesRead }));

      if (docsRead > 0)
        textParts.push(t('exploring.docs', { count: docsRead }));

      if (consoleLogsRead > 0)
        textParts.push(t('exploring.consoleLogs', { count: consoleLogsRead }));

      if (screenshotsTaken > 0)
        textParts.push(
          t('exploring.screenshots', {
            count: screenshotsTaken,
            suffix: hostSuffix,
          }),
        );

      if (stylesInspected > 0)
        textParts.push(t('exploring.styles', { suffix: hostSuffix }));

      if (domInspected > 0 && stylesInspected === 0)
        textParts.push(t('exploring.dom', { suffix: hostSuffix }));

      if (
        sandboxScriptsRun > 0 &&
        screenshotsTaken === 0 &&
        stylesInspected === 0 &&
        domInspected === 0
      )
        textParts.push(
          t('exploring.scripts', {
            count: sandboxScriptsRun,
            suffix: hostSuffix,
          }),
        );

      if (sandboxFilesWritten > 0)
        textParts.push(
          t('exploring.sandboxFiles', { count: sandboxFilesWritten }),
        );

      if (attachmentLabels.length > 0) {
        const allSame = attachmentLabels.every(
          (l) => l === attachmentLabels[0],
        );
        const noun = allSame
          ? attachmentLabels[0]!
          : t('exploring.attachmentGeneric');
        textParts.push(
          attachmentLabels.length === 1
            ? t('exploring.attachmentOne', { noun })
            : t('exploring.attachmentMany', {
                count: attachmentLabels.length,
                noun,
              }),
        );
      }

      const hasExploredFiles = filesFound > 0 || filesRead > 0;

      if (hasCheckedLinting && (lintingErrors > 0 || lintingWarnings > 0)) {
        const lintParts: string[] = [];
        if (lintingErrors > 0)
          lintParts.push(t('exploring.lintErrors', { count: lintingErrors }));
        if (lintingWarnings > 0)
          lintParts.push(
            t('exploring.lintWarnings', { count: lintingWarnings }),
          );
        textParts.push(lintParts.join(listSeparator));
      }

      if (textParts.length === 0) {
        if (hasCheckedLinting && lintingErrors === 0 && lintingWarnings === 0) {
          const lintText = t('exploring.checkedLintingNoIssues');
          return enabledText
            ? t('exploring.enabledAndFound', {
                enabled: enabledText,
                list: lintText,
              })
            : lintText;
        }
        if (hasUsedBrowserTools) textParts.push(t('exploring.theBrowser'));
        if (hasUsedContext7Tools) textParts.push(t('exploring.documentation'));
        if (hasUsedFileTools) textParts.push(t('exploring.filesWord'));
      }

      if (!hasExploredFiles && hasCheckedLinting) {
        const list = joinList(textParts);
        return enabledText
          ? t('exploring.enabledAndFound', { enabled: enabledText, list })
          : t('exploring.foundOnly', { list });
      }

      if (textParts.length === 0) return enabledText ?? t('exploring.codebase');

      const list = joinList(textParts);
      return enabledText
        ? t('exploring.enabledAndExplored', { enabled: enabledText, list })
        : t('exploring.exploredOnly', { list });
    }, [explorationMetadata, isReasoningOnly, t]);

    const explorationInProgressText = useMemo(() => {
      const lastNonReasoningPart = items
        .map((i) => i.part)
        .filter((part) => part.type !== 'reasoning')
        .at(-1);
      switch (lastNonReasoningPart?.type || '') {
        case 'tool-read': {
          const p = lastNonReasoningPart as Extract<
            AgentToolUIPart,
            { type: 'tool-read' }
          >;
          const path = p.input?.path ?? '';
          const pluginMatch = path.match(PLUGIN_SKILL_RE);
          if (pluginMatch) {
            const plugin = plugins.find((pl) => pl.id === pluginMatch[1]);
            if (plugin)
              return t('exploring.inProgress.enabling', {
                name: plugin.displayName,
              });
          }
          const wsMatch = path.match(WORKSPACE_SKILL_RE);
          if (wsMatch?.[1])
            return t('exploring.inProgress.enabling', { name: wsMatch[1] });
          return t('exploring.inProgress.readingFile');
        }
        case 'tool-ls':
          return t('exploring.inProgress.listingDirectory');
        case 'tool-glob':
        case 'tool-grepSearch':
          return t('exploring.inProgress.exploringFiles');
        case 'tool-searchInLibraryDocs': {
          const p = lastNonReasoningPart as Extract<
            AgentToolUIPart,
            { type: 'tool-searchInLibraryDocs' }
          >;
          if (!p.input?.libraryId)
            return t('exploring.inProgress.exploringDocumentation');
          return t('exploring.inProgress.readingDocsFor', {
            libraryId: p.input.libraryId,
          });
        }
        case 'tool-listLibraryDocs': {
          const p = lastNonReasoningPart as Extract<
            AgentToolUIPart,
            { type: 'tool-listLibraryDocs' }
          >;
          if (!p.input?.name)
            return t('exploring.inProgress.exploringDocumentation');
          return t('exploring.inProgress.searchingDocsFor', {
            name: p.input.name,
          });
        }
        case 'tool-executeSandboxJs': {
          const p = lastNonReasoningPart as Extract<
            AgentToolUIPart,
            { type: 'tool-executeSandboxJs' }
          >;
          if (p.input?.explanation) return `${p.input.explanation}...`;
          return getSandboxLabel(p.input?.script, activeTabs, true, t);
        }
        case 'tool-readConsoleLogs': {
          const p = lastNonReasoningPart as Extract<
            AgentToolUIPart,
            { type: 'tool-readConsoleLogs' }
          >;
          const tab = activeTabs[p.input?.id ?? ''];
          if (!tab) return t('exploring.inProgress.exploringTheBrowser');
          const hostname = new URL(tab.url).hostname;
          return t('exploring.inProgress.readingLogsFrom', { hostname });
        }
        case 'tool-getLintingDiagnostics':
          return t('exploring.inProgress.checkingLinting');
        default:
          return isReasoningOnly
            ? t('exploring.inProgress.thinking')
            : t('exploring.inProgress.exploring');
      }
    }, [items, activeTabs, plugins, isReasoningOnly, t]);

    // True when at least one tool part is still actively streaming/executing
    const anyPartStreaming = useMemo(
      () =>
        items.some(
          (i) =>
            i.part.type !== 'reasoning' &&
            i.part.state !== 'output-available' &&
            i.part.state !== 'output-error',
        ),
      [items],
    );

    const headerText =
      anyPartStreaming || isShimmering
        ? explorationInProgressText
        : explorationFinishedText;

    const headerRef = useRef<HTMLSpanElement>(null);
    const { isTruncated, tooltipOpen, setTooltipOpen } =
      useIsTruncated(headerRef);

    // For single part, show it inline without the exploring wrapper — unless
    // the part is settled and we're still shimmering, in which case fall
    // through to the multi-part path whose header can shimmer independently.
    if (
      isOnlyOnePart &&
      (items[0]?.part.type === 'reasoning' || anyPartStreaming || !isShimmering)
    ) {
      // Use the original index from msg.parts to look up the correct metadata
      const firstItem = items[0]!;
      return (
        <PartContent
          part={firstItem.part}
          minimal={true}
          disableShimmer={!isShimmering}
          messageAttachments={messageAttachments}
          thinkingDuration={
            firstItem.originalIndex !== undefined
              ? (partsMetadata?.[firstItem.originalIndex]?.endedAt?.getTime() ??
                  0) -
                (partsMetadata?.[
                  firstItem.originalIndex
                ]?.startedAt?.getTime() ?? 0)
              : undefined
          }
          isLastPart={isAutoExpanded}
          capMaxHeight={true}
        />
      );
    }

    // For multiple parts, use MinimalToolPartUI with collapsible content
    return (
      <ToolPartUI
        expanded={expanded}
        setExpanded={setExpanded}
        isShimmering={isShimmering}
        autoScroll={isShimmering}
        trigger={
          <div className={cn(`flex flex-row items-center justify-start gap-2`)}>
            <div className="flex min-w-0 flex-1 flex-row items-center justify-start gap-1 text-xs">
              <IconMagnifierOutline18
                className={cn(
                  'size-3 shrink-0',
                  isShimmering && 'text-primary-foreground',
                )}
              />
              <Tooltip
                open={isTruncated && tooltipOpen}
                onOpenChange={setTooltipOpen}
              >
                <TooltipTrigger delay={50}>
                  <span
                    ref={headerRef}
                    className={cn(
                      'min-w-0 truncate',
                      isShimmering && 'shimmer-text-primary',
                    )}
                  >
                    {headerText}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <div className="max-w-xs break-all">{headerText}</div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        }
        content={
          <ExploringContentContext.Provider value={contextValue}>
            <div className="flex flex-col gap-1.25 pb-1 opacity-75">
              {partContents}
            </div>
          </ExploringContentContext.Provider>
        }
        contentClassName={hasExpandedChild ? 'max-h-96!' : 'max-h-60!'}
      />
    );
  },
  (prev, next) => {
    // Element-wise comparison: settled groups keep stable part references
    // via Immer structural sharing, so this bails out for all non-active groups.
    if (prev.items.length !== next.items.length) return false;
    for (let i = 0; i < prev.items.length; i++) {
      if (prev.items[i]!.part !== next.items[i]!.part) return false;
    }
    if (prev.isAutoExpanded !== next.isAutoExpanded) return false;
    if (prev.isShimmering !== next.isShimmering) return false;
    if (prev.messageAttachments !== next.messageAttachments) return false;
    return true;
  },
);
