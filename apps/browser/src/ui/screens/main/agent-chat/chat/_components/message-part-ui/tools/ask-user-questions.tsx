import { useMemo } from 'react';
import {
  IconHelpChatOutline18,
  IconPenWriting3Outline18,
} from '@stagewise/icons';
import type { AgentToolUIPart } from '@shared/karton-contracts/ui/agent';
import type {
  AskUserQuestionsToolInput,
  AskUserQuestionsToolOutput,
  QuestionField,
} from '@shared/karton-contracts/ui/agent/tools/types';
import { InlineMarkdown } from '@ui/components/streamdown';
import { useTranslation } from 'react-i18next';
import i18n from '@ui/i18n';

type AskUserQuestionsPart = Extract<
  AgentToolUIPart,
  { type: 'tool-askUserQuestions' }
>;

/** Format a field's answered value for display */
function formatAnswerValue(
  field: QuestionField | undefined,
  value: unknown,
): string {
  if (value === undefined || value === null || value === '')
    return i18n.t('tools:askQuestions.answer.empty');
  if (field?.type === 'input' && field.inputType === 'password') {
    return '••••••';
  }

  // Handle "Other" radio values
  if (typeof value === 'string' && value.startsWith('__other__:')) {
    const customText = value.slice('__other__:'.length);
    return customText || i18n.t('tools:askQuestions.answer.empty');
  }

  // For radio-group, resolve to label
  if (field?.type === 'radio-group' && typeof value === 'string') {
    const opt = field.options.find((o) => o.value === value);
    return opt?.label ?? value;
  }

  // For checkbox-group, resolve values to labels
  if (field?.type === 'checkbox-group' && Array.isArray(value)) {
    if (value.length === 0) return i18n.t('tools:askQuestions.answer.none');
    return value
      .map((v) => {
        const opt = field.options.find((o) => o.value === v);
        return opt?.label ?? v;
      })
      .join(', ');
  }

  if (typeof value === 'boolean')
    return value
      ? i18n.t('tools:askQuestions.answer.yes')
      : i18n.t('tools:askQuestions.answer.no');
  return String(value);
}

/** Build a lookup from questionId to field definition across all steps */
function buildFieldMap(
  input: AskUserQuestionsToolInput | undefined,
): Map<string, QuestionField> {
  const map = new Map<string, QuestionField>();
  if (!input?.steps) return map;
  for (const step of input.steps) {
    if (!step?.fields) continue;
    for (const field of step.fields) {
      map.set(field.questionId, field);
    }
  }
  return map;
}

export const AskUserQuestionsToolPart = ({
  part,
}: {
  part: AskUserQuestionsPart;
}) => {
  const { t } = useTranslation('tools');
  const input = part.input as AskUserQuestionsToolInput | undefined;
  const output = part.output as AskUserQuestionsToolOutput | undefined;

  const fieldMap = useMemo(() => buildFieldMap(input), [input]);

  // ── Error state (agent stopped while questions were pending) ──
  if (part.state === 'output-error') {
    return (
      <div className="flex h-6 w-full select-none items-center gap-1 font-medium text-muted-foreground">
        <IconHelpChatOutline18 className="size-3 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs">
          {t('askQuestions.cancelledAgentStopped')}
        </span>
      </div>
    );
  }

  // ── Streaming / Waiting state ──
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    const isStreaming = part.state === 'input-streaming';
    const label = isStreaming
      ? t('askQuestions.writingQuestions')
      : t('askQuestions.waitingResponse');
    const Icon = isStreaming ? IconPenWriting3Outline18 : IconHelpChatOutline18;

    return (
      <div className="flex h-6 w-full select-none items-center gap-1 font-medium text-muted-foreground">
        <Icon
          className={
            isStreaming
              ? 'size-3 shrink-0 text-primary-foreground'
              : 'size-3 shrink-0'
          }
        />
        <span
          dir="ltr"
          className={isStreaming ? 'shimmer-text-primary text-xs' : 'text-xs'}
        >
          {label}
        </span>
      </div>
    );
  }

  // ── Output available: show results ──
  if (output) {
    const wasCancelled = output.cancelled;
    const cancelReason = output.cancelReason;

    let triggerText: string;
    if (output.notice) {
      triggerText = t('askQuestions.sentAnswersMessage');
    } else if (wasCancelled) {
      triggerText =
        cancelReason === 'agent_stopped'
          ? t('askQuestions.cancelledAgentStopped')
          : t('askQuestions.dismissed');
    } else {
      triggerText = input?.title ?? t('askQuestions.answered');
    }

    // Build answer summary
    const answerEntries = Object.entries(output.answers ?? {});
    const hasAnswers = answerEntries.length > 0;

    const icon = (
      <IconHelpChatOutline18 className="size-3 shrink-0 text-muted-foreground" />
    );

    return (
      <>
        <div className="flex h-6 w-full select-none items-center gap-1 font-medium text-muted-foreground">
          {icon}
          <span className="truncate text-xs">{triggerText}</span>
        </div>
        {hasAnswers && (
          <div className="flex flex-col gap-2 rounded-md border border-border-subtle p-2.5">
            {answerEntries.map(([questionId, answerValue]) => {
              const field = fieldMap.get(questionId);
              const label = field?.label ?? questionId;
              const displayValue = formatAnswerValue(field, answerValue);
              return (
                <div key={questionId} className="flex flex-col gap-0.5">
                  <span className="font-medium text-muted-foreground text-xs">
                    <InlineMarkdown>{label}</InlineMarkdown>
                  </span>
                  <span className="text-foreground text-sm">
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // Fallback: no output yet (shouldn't normally happen)
  return (
    <div className="flex h-6 w-full select-none items-center gap-1 font-medium text-muted-foreground">
      <IconHelpChatOutline18 className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate text-xs">
        {input?.title ?? t('askQuestions.userQuestions')}
      </span>
    </div>
  );
};
