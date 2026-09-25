import type {
  TextFileSaveRequest,
  TextFileSaveResult,
} from '@shared/karton-contracts/ui/shared-types';
import type { AgentMessage } from '@shared/karton-contracts/ui/agent';
import { toast } from '@stagewise/stage-ui/components/toaster';
import { historyToMarkdown } from './history-to-markdown';

export type MarkdownExportSource = {
  history: AgentMessage[] | undefined;
  title: string | undefined;
};

export type MarkdownExportProcedures = {
  copyText: (text: string) => Promise<void>;
  saveTextFile: (request: TextFileSaveRequest) => Promise<TextFileSaveResult>;
};

/** Filesystem-safe file name stem for an exported conversation. */
export function toMarkdownFileStem(title: string | undefined): string {
  const stem = (title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return stem.length > 0 ? stem : 'conversation';
}

function notify(
  title: string,
  message: string,
  type: 'info' | 'error',
  duration = type === 'error' ? 15_000 : 6_000,
): void {
  toast({
    id: crypto.randomUUID(),
    title,
    message,
    type,
    duration,
    actions: [],
  });
}

function build(source: MarkdownExportSource): string | null {
  if (!source.history || source.history.length === 0) return null;
  return historyToMarkdown(source.history, { title: source.title });
}

/** Copies the whole conversation to the clipboard as Markdown. */
export async function copyAgentHistoryAsMarkdown(
  source: MarkdownExportSource,
  procedures: Pick<MarkdownExportProcedures, 'copyText'>,
): Promise<void> {
  const markdown = build(source);
  if (!markdown) {
    notify(
      'Nothing to export',
      'This conversation has no messages yet.',
      'info',
    );
    return;
  }
  try {
    await procedures.copyText(markdown);
    notify(
      'Copied as Markdown',
      'The full conversation is on your clipboard.',
      'info',
    );
  } catch (error) {
    notify(
      'Copy failed',
      error instanceof Error ? error.message : String(error),
      'error',
    );
  }
}

/** Asks for a destination and writes the conversation as a Markdown file. */
export async function saveAgentHistoryAsMarkdown(
  source: MarkdownExportSource,
  procedures: Pick<MarkdownExportProcedures, 'saveTextFile'>,
): Promise<void> {
  const markdown = build(source);
  if (!markdown) {
    notify(
      'Nothing to export',
      'This conversation has no messages yet.',
      'info',
    );
    return;
  }
  const result = await procedures.saveTextFile({
    title: 'Export conversation as Markdown',
    defaultFileName: `${toMarkdownFileStem(source.title)}.md`,
    content: markdown,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (result.status === 'failed') {
    notify('Export failed', result.error, 'error');
  }
}
