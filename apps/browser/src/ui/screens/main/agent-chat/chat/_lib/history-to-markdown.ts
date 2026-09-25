import type { AgentMessage } from '@shared/karton-contracts/ui/agent';

export type HistoryToMarkdownOptions = {
  /** Document heading. Omit to start directly with the messages. */
  title?: string;
  /** Include reasoning/thinking blocks (collapsed). Default: false. */
  includeReasoning?: boolean;
  /** Include compact tool-call markers and outputs. Default: true. */
  includeTools?: boolean;
  /** Include browser preview metadata on user messages. Default: true. */
  includeMessageMetadata?: boolean;
};

/**
 * Renders a chat history as a single Markdown document.
 *
 * The exporter is intentionally independent of the React rendering layer:
 * it walks the stored UI messages (the same data the chat renders) and
 * produces a portable document. Every message is included chronologically, so
 * nothing that was compacted out of the *model prompt* is lost here — a
 * compaction boundary is instead marked with the briefing that replaced it.
 */
export function historyToMarkdown(
  messages: AgentMessage[],
  options: HistoryToMarkdownOptions = {},
): string {
  const {
    title,
    includeReasoning = false,
    includeTools = true,
    includeMessageMetadata = true,
  } = options;

  const blocks: string[] = [];
  if (title?.trim()) blocks.push(`# ${title.trim()}`);

  for (const message of messages) {
    const speaker = message.role === 'user' ? 'User' : 'Assistant';
    const sections: string[] = [];

    const briefing = message.metadata?.compressedHistory;
    if (typeof briefing === 'string' && briefing.trim().length > 0) {
      sections.push(
        [
          '> **Compacted history** — the messages above this point were',
          '> summarised into the briefing below for the model.',
          '>',
          ...briefing
            .trim()
            .split('\n')
            .map((line) => (line.length > 0 ? `> ${line}` : '>')),
        ].join('\n'),
      );
    }

    const partTexts: string[] = [];
    for (const part of message.parts) {
      const rendered = renderPart(part, {
        includeReasoning,
        includeTools,
      });
      if (rendered) partTexts.push(rendered);
    }

    if (includeMessageMetadata && message.role === 'user') {
      const meta = renderUserMetadata(message);
      if (meta) partTexts.push(meta);
    }

    sections.push(...partTexts);

    const body = sections.join('\n\n').trim();
    blocks.push(`## ${speaker}${body ? `\n\n${body}` : ''}`);
  }

  return `${blocks.join('\n\n')}\n`;
}

function renderPart(
  part: AgentMessage['parts'][number],
  options: { includeReasoning: boolean; includeTools: boolean },
): string | null {
  const type = (part as { type?: string }).type;
  if (!type) return null;

  if (type === 'text') {
    const text = (part as { text?: unknown }).text;
    return typeof text === 'string' && text.trim().length > 0
      ? text.trim()
      : null;
  }

  if (type === 'reasoning') {
    if (!options.includeReasoning) return null;
    const text = (part as { text?: unknown }).text;
    if (typeof text !== 'string' || text.trim().length === 0) return null;
    return `<details>\n<summary>Thinking</summary>\n\n${text.trim()}\n\n</details>`;
  }

  if (type === 'file') {
    const file = part as {
      filename?: unknown;
      mediaType?: unknown;
      url?: unknown;
    };
    const name =
      typeof file.filename === 'string' && file.filename.length > 0
        ? file.filename
        : 'attachment';
    const url = typeof file.url === 'string' ? file.url : '';
    const isImage =
      typeof file.mediaType === 'string' && file.mediaType.startsWith('image/');
    // Inline (data URL) files carry megabytes of base64; reference them by
    // type instead of dumping the payload into the document.
    const label = url.startsWith('data:')
      ? `inline:${file.mediaType ?? 'file'}`
      : url;
    return isImage ? `![${name}](${label})` : `[${name}](${label})`;
  }

  if (type.startsWith('tool-')) {
    if (!options.includeTools) return null;
    return renderToolPart(part, type.slice('tool-'.length));
  }

  // step-start, data-*, source-* and other transport parts carry no user
  // facing content for an export.
  return null;
}

function renderToolPart(
  part: AgentMessage['parts'][number],
  toolName: string,
): string | null {
  const candidate = part as {
    state?: unknown;
    input?: unknown;
    output?: unknown;
    errorText?: unknown;
  };
  const state = typeof candidate.state === 'string' ? candidate.state : '';
  const summary = summarizeToolInput(candidate.input);

  const lines: string[] = [];
  const status =
    state === 'output-error'
      ? ' (failed)'
      : state === 'input-streaming' || state === 'input-available'
        ? ' (incomplete)'
        : '';
  lines.push(`> \`${toolName}\`${summary ? ` — ${summary}` : ''}${status}`);

  const errorText =
    typeof candidate.errorText === 'string' ? candidate.errorText.trim() : '';
  if (errorText) {
    lines.push('', codeFence(errorText));
    return lines.join('\n');
  }

  const outputText = extractText(candidate.output);
  if (outputText) {
    lines.push('', '<details>', '<summary>Output</summary>', '');
    lines.push(codeFence(outputText));
    lines.push('', '</details>');
  }

  return lines.join('\n');
}

function summarizeToolInput(input: unknown): string {
  if (input === null || typeof input !== 'object') return '';
  const record = input as Record<string, unknown>;

  for (const key of [
    'path',
    'filePath',
    'file_path',
    'relativePath',
    'directory',
    'query',
    'pattern',
    'command',
    'url',
    'script',
    'name',
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      const oneLine = value.trim().replace(/\s+/g, ' ');
      return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine;
    }
  }

  try {
    const json = JSON.stringify(record);
    if (!json || json === '{}') return '';
    return json.length > 120 ? `${json.slice(0, 117)}…` : json;
  } catch {
    return '';
  }
}

function extractText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value && typeof value === 'object') {
    const record = value as {
      text?: unknown;
      message?: unknown;
      content?: unknown;
    };
    for (const key of ['text', 'message', 'content'] as const) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }
  return null;
}

function renderUserMetadata(message: AgentMessage): string | null {
  const metadata = message.metadata;
  if (!metadata) return null;

  const notes: string[] = [];
  const attachments = Array.isArray(metadata.attachments)
    ? metadata.attachments.map(describeEntry).filter(Boolean)
    : [];
  const mentions = Array.isArray(metadata.mentions)
    ? metadata.mentions.map(describeEntry).filter(Boolean)
    : [];

  if (attachments.length > 0) {
    notes.push(`attached: ${attachments.join(', ')}`);
  }
  if (mentions.length > 0) {
    notes.push(`mentioned: ${mentions.join(', ')}`);
  }
  return notes.length > 0 ? `*(${notes.join('; ')})*` : null;
}

function describeEntry(entry: unknown): string | null {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const record = entry as Record<string, unknown>;
    for (const key of [
      'name',
      'path',
      'fileName',
      'filename',
      'label',
      'url',
    ]) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return null;
}

/** Wraps text in a fence longer than any backtick run it contains. */
function codeFence(text: string): string {
  const runs = text.match(/`+/g);
  const longest = runs ? Math.max(...runs.map((run) => run.length)) : 0;
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}\n${text}\n${fence}`;
}
