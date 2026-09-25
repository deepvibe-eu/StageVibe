---
name: Deep Research
description: Run a structured research pipeline that ends in a written report. Use when the user asks for an in-depth investigation (market, technology, literature, comparison) rather than a quick answer.
user-invocable: true
agent-invocable: true
---

# Deep Research

Produce a written report by working through five phases in order. Each phase
writes a file so the next one can build on it. Do **not** answer the research
question directly in chat — the answer is the report file.

## Workspace

Create one scratch directory for the run, outside the user's project tree when
possible, and keep every phase output there:

```
<scratch>/<YYYYMMDD>-<slug>/
├── 1-background.md
├── 2-direction.md
├── 3-analysis.md
├── 4-research-notes.md
└── 5-final.md
```

Write the user's request verbatim to `raw-query.txt` first. Do not paraphrase,
translate, or add inferred intent.

## Phases

1. **Background** — read `raw-query.txt` and establish the facts that already
   exist: terminology, current state, the landscape around the question. No
   judgement yet. → `1-background.md`
2. **Direction** — from the background, decide which angles are worth pursuing
   and which are dead ends. State the guiding question for the deep dive.
   → `2-direction.md`
3. **Analysis** — turn the direction into the concrete questions the research
   must answer, plus the plan for answering them (what to search for, which
   kinds of sources count as evidence). → `3-analysis.md`
4. **Research** — gather evidence and record it with links and dates. Note
   contradictions and gaps explicitly; do not smooth them over.
   → `4-research-notes.md`
5. **Writing** — write the report for the user: direct, structured, with the
   evidence in place. → `5-final.md`

## Rules

- Preserve the original question. Never write your own interpretation into
  `raw-query.txt`.
- Prefer lightweight sources (search, then fetch pages). Only automate a
  browser if the user explicitly needs a logged-in or interactive flow.
- Separate **fact** from **assessment**. Mark estimates and uncertainty.
- Every non-obvious claim in the report needs a source and a date.
- If the user asks a follow-up, keep the same run directory and add a new
  numbered turn folder; reuse the previous `5-final.md` as context.
- Finish by returning `5-final.md` (or a short pointer to it). No execution
  notes, no "I did X" summary in the report.

## Failure handling

- If a phase genuinely lacks material, record the gap in that phase file and
  continue — never invent sources.
- If the request is too vague to research at all, ask exactly one clarifying
  question before creating any files.

See `references/report-structure.md` for the report layout.
