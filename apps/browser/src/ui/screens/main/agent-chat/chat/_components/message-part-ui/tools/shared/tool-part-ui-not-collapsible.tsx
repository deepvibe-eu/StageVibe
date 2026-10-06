import { memo, useMemo } from 'react';
import type { ToolUIPart } from '@shared/karton-contracts/ui';
import type { DynamicToolUIPart } from '@shared/karton-contracts/ui';
import { cn } from '@ui/utils';
import { XIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@stagewise/stage-ui/components/tooltip';
import { ToolPartUI } from './tool-part-ui';
import { useTranslation } from 'react-i18next';

export const ToolPartUINotCollapsible = memo(
  ({
    streamingText,
    finishedText,
    part,
    disableShimmer = false,
    minimal = false,
    icon,
    content,
  }: {
    streamingText: string;
    finishedText: string | React.ReactNode | undefined;
    part: ToolUIPart | DynamicToolUIPart;
    disableShimmer?: boolean;
    minimal?: boolean;
    icon?: React.ReactNode;
    content?: React.ReactNode;
  }) => {
    const { t } = useTranslation('tools');
    const trigger = useMemo(() => {
      if (part.state === 'output-available') {
        return (
          <div
            className={cn(
              'flex cursor-default select-none flex-row items-center justify-start gap-1 text-muted-foreground text-xs hover:text-foreground',
            )}
          >
            {icon && <div className="size-3 shrink-0">{icon}</div>}
            <span className="min-w-0 truncate">
              {finishedText ?? t('fallback.finished')}
            </span>
          </div>
        );
      }

      if (
        part.state === 'input-streaming' ||
        part.state === 'input-available'
      ) {
        return (
          <div
            className={cn(
              'flex min-w-0 cursor-default select-none flex-row items-center justify-start gap-1 text-muted-foreground text-xs hover:text-foreground',
            )}
          >
            {icon && (
              <div
                className={`size-3 shrink-0 ${disableShimmer ? '' : 'animate-icon-pulse text-primary-foreground hover:text-primary-foreground'}`}
              >
                {icon}
              </div>
            )}
            <span
              className={`truncate ${disableShimmer ? '' : 'shimmer-text-primary'}`}
            >
              {streamingText}
            </span>
          </div>
        );
      }

      if (part.state === 'output-error') {
        return (
          <div className="flex max-w-full cursor-default select-none flex-row items-center gap-1 text-muted-foreground text-xs hover:text-foreground">
            <XIcon className="size-3 shrink-0" />
            <Tooltip>
              <TooltipTrigger>
                <span className="min-w-0 truncate text-xs">
                  {part.errorText ?? t('fallback.error')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {part.errorText ?? t('fallback.error')}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    }, [
      part.state,
      part.errorText,
      icon,
      finishedText,
      streamingText,
      disableShimmer,
      t,
    ]);

    return minimal ? (
      trigger
    ) : (
      <ToolPartUI trigger={trigger} content={content} />
    );
  },
);
