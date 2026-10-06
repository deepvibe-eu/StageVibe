import type { DynamicToolUIPart } from 'ai';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import { ToolPartUINotCollapsible } from './shared/tool-part-ui-not-collapsible';
import { IconGear2Outline18 } from '@stagewise/icons';
import { ExternalAgentToolPart } from './external-agent';
import { useTranslation } from 'react-i18next';

export const UnknownToolPart = ({
  part,
  shimmer = false,
}: {
  part: AgentToolUIPart | DynamicToolUIPart;
  shimmer?: boolean;
}) => {
  const { t } = useTranslation('tools');
  if (part.type === 'dynamic-tool' && part.toolName.startsWith('acp.')) {
    return <ExternalAgentToolPart part={part} shimmer={shimmer} />;
  }
  const streamingText = t('unknown.calling', { type: part.type });
  const finishedText = t('unknown.finished', { type: part.type });
  return (
    <ToolPartUINotCollapsible
      part={part}
      icon={<IconGear2Outline18 className="size-3 shrink-0" />}
      disableShimmer={!shimmer}
      minimal={true}
      streamingText={streamingText}
      finishedText={finishedText}
    />
  );
};
