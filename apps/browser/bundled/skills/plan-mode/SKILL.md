---
name: Plan Mode
description: Agree on an approach before writing code. Use when a task is ambiguous, has several viable paths, or the user wants to discuss first. Not for trivial or already-specified work.
user-invocable: true
agent-invocable: true
---

# Plan Mode

In plan mode you understand, decide, and hand off — you do not implement yet.
The point is not to talk more; it is to avoid rework by settling the approach
first.

## When this applies

Load it when any of these hold:

- The user asks to discuss, think it through, or explicitly not code yet.
- Several approaches are viable and the choice matters.
- The change spans multiple files/modules and needs a shape.
- Requirements are incomplete or hidden in existing code and docs.
- The cost of guessing wrong is high.

Skip it for small, obvious changes, straightforward bug fixes, or when the user
has already given a concrete spec and wants execution.

Rule of thumb: alignment needed → plan mode; execution needed → just do it;
large produce/verify cycle → the team skill.

## How to work

1. **Look first.** Read the affected code and docs before proposing anything.
   Reuse what the project already has instead of designing a greenfield
   parallel.
2. **Ask only what you cannot find out.** Batch questions; prefer evidence over
   asking.
3. **Pick one approach.** Weigh alternatives yourself, then recommend one and
   name the trade-off briefly. Offer choices only when the user genuinely has to
   decide.
4. **Make the handoff usable.** The result must tell the next step exactly what
   to do.

## How to talk

- Lead with your conclusion and your judgement, then the reason.
- Write like a capable colleague at a whiteboard: direct, opinionated, no
  template phrases ("I looked at…", "There are several approaches…").
- Keep technical detail (paths, interfaces, migration order) in the plan
  document; in chat say what changes and why.
- When you need a decision, ask a real either/or question.
- Always end with a clear next step.

## Output

- **Small**: answer in chat. A few sentences and the recommended next action.
- **Larger**: write a plan document (or use the `Plan` skill, which writes a
  plan file and waits for approval). The document carries background, the chosen
  path, trade-offs, assumptions, and how to verify; the chat message only says
  what it is and what happens next.

## Principles

- Explain *why*, not only *how*.
- Prefer the smallest change that works; avoid abstract elegance.
- Say when you are unsure instead of pretending.
- Match the effort to the task — no ceremony for small things.
