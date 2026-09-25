import { describe, expect, it } from 'vitest';
import type { AgentMessage } from '@shared/karton-contracts/ui/agent';
import { historyToMarkdown } from './history-to-markdown';

function userMessage(parts: unknown[], metadata?: unknown): AgentMessage {
  return {
    id: 'u1',
    role: 'user',
    parts,
    metadata,
  } as unknown as AgentMessage;
}

function assistantMessage(parts: unknown[]): AgentMessage {
  return { id: 'a1', role: 'assistant', parts } as unknown as AgentMessage;
}

describe('historyToMarkdown', () => {
  it('renders user and assistant text with speaker headings', () => {
    const md = historyToMarkdown([
      userMessage([{ type: 'text', text: 'Hello there' }]),
      assistantMessage([{ type: 'text', text: 'Hi! How can I help?' }]),
    ]);

    expect(md).toContain('## User\n\nHello there');
    expect(md).toContain('## Assistant\n\nHi! How can I help?');
  });

  it('adds a title when provided', () => {
    const md = historyToMarkdown([userMessage([{ type: 'text', text: 'x' }])], {
      title: 'My chat',
    });
    expect(md.startsWith('# My chat')).toBe(true);
  });

  it('excludes reasoning by default and includes it when asked', () => {
    const messages = [
      assistantMessage([
        { type: 'reasoning', text: 'secret thoughts' },
        { type: 'text', text: 'answer' },
      ]),
    ];

    expect(historyToMarkdown(messages)).not.toContain('secret thoughts');
    const withReasoning = historyToMarkdown(messages, {
      includeReasoning: true,
    });
    expect(withReasoning).toContain('<summary>Thinking</summary>');
    expect(withReasoning).toContain('secret thoughts');
  });

  it('summarises tool calls compactly and includes output in a details block', () => {
    const md = historyToMarkdown([
      assistantMessage([
        {
          type: 'tool-read',
          state: 'output-available',
          input: { path: 'w0/src/index.ts' },
          output: { text: 'file contents' },
        },
      ]),
    ]);

    expect(md).toContain('> `read` — w0/src/index.ts');
    expect(md).toContain('<summary>Output</summary>');
    expect(md).toContain('file contents');
  });

  it('marks failed tool calls', () => {
    const md = historyToMarkdown([
      assistantMessage([
        {
          type: 'tool-executeShellCommand',
          state: 'output-error',
          input: { command: 'npm test' },
          errorText: 'exit 1',
        },
      ]),
    ]);

    expect(md).toContain('> `executeShellCommand` — npm test (failed)');
    expect(md).toContain('exit 1');
  });

  it('can omit tool calls', () => {
    const md = historyToMarkdown(
      [
        assistantMessage([
          {
            type: 'tool-read',
            state: 'output-available',
            input: { path: 'a' },
          },
          { type: 'text', text: 'done' },
        ]),
      ],
      { includeTools: false },
    );
    expect(md).not.toContain('`read`');
    expect(md).toContain('done');
  });

  it('marks a compaction boundary with the briefing', () => {
    const md = historyToMarkdown([
      userMessage([{ type: 'text', text: 'recent message' }], {
        compressedHistory: '## Old topic\nwe decided to use SQLite',
      }),
    ]);

    expect(md).toContain('> **Compacted history**');
    expect(md).toContain('> ## Old topic');
    expect(md).toContain('> we decided to use SQLite');
    expect(md).toContain('recent message');
  });

  it('lists attachments and mentions on user messages', () => {
    const md = historyToMarkdown([
      userMessage([{ type: 'text', text: 'see this' }], {
        attachments: [{ name: 'shot.png' }],
        mentions: [{ path: 'src/app.ts' }],
      }),
    ]);

    expect(md).toContain('*(attached: shot.png; mentioned: src/app.ts)*');
  });

  it('uses a longer code fence when content contains backticks', () => {
    const md = historyToMarkdown([
      assistantMessage([
        {
          type: 'tool-read',
          state: 'output-available',
          input: { path: 'a' },
          output: { text: '```js\nconst a = 1;\n```' },
        },
      ]),
    ]);

    expect(md).toContain('````');
    expect(md).toContain('```js');
  });

  it('renders inline image files as images and other files as links', () => {
    const md = historyToMarkdown([
      assistantMessage([
        {
          type: 'file',
          filename: 'shot.png',
          mediaType: 'image/png',
          url: 'data:image/png;base64,AAA',
        },
        {
          type: 'file',
          filename: 'doc.pdf',
          mediaType: 'application/pdf',
          url: 'https://x/doc.pdf',
        },
      ]),
    ]);

    expect(md).toContain('![shot.png](inline:image/png)');
    expect(md).toContain('[doc.pdf](https://x/doc.pdf)');
  });
});
