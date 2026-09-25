---
name: mate-team
description: >
  Coordinate a small team of sub-agents toward one deliverable. Use only when
  the user explicitly invokes /mate-team, or 100% unambiguously asks for an
  agent team / multi-agent team. Do not infer team use from complexity,
  research depth, long-running work, parallelism, specialist value, or
  verification risk.
user-invocable: true
agent-invocable: false
---

# Mate Team (Agewise port)

Orchestrate a small team toward one deliverable, but only after an explicit
`/mate-team` invocation or a 100% unambiguous "use an agent team" request.
The owner session keeps responsibility for planning, launch, intervention,
decisions, integration, and cleanup. Workers produce bounded deliverables and
exit.

This is the original multi-agent operating model re-implemented on Agewise
primitives. It does **not** call the original daemon CLI and needs no external daemon. See `references/orchestration.md` for how Mate roles map to Agewise.

## Hard rules

- **Explicit trigger only.** If this loaded without `/mate-team` or an
  unambiguous agent-team request, stop and keep working in the owner session.
- **Use the smallest sufficient plan.** One owner plus a light verifier beats a
  broad team unless parallelism genuinely reduces time or risk.
- **User-facing text follows the user's language.** Technical tokens, file
  paths, and commands stay literal.
- **Every plan declares a validation closure:** independent verification, a
  final PASS/FAIL gate, or a concrete low-risk skip reason.
- **Never create or spawn agents silently.** Propose the roster and let the
  user approve it.
- Do not use this skill merely because work is complex, long-running, or
  parallelizable. Those are planning considerations *after* the trigger.

## Preflight

Answer these before writing any plan:

1. What is the final deliverable?
2. Why is a team better than one owner plus a light verifier?
3. Which deliverables can run independently, and which dependencies are real?
4. Which tools, sources, and files does each track need?
5. What evidence closes the plan: per-task verifier, final gate, or skip
   reason?

For code work, also read `references/verification.md`.

## Split the work

Split by **verifiable deliverable**, not by activity. A good task can be
completed by a fresh worker with its prompt plus the repository.

- Parallelize independent deliverables with distinct outputs, tool surfaces, or
  verification boundaries.
- Serialize only for real output consumption, shared contracts, or shared
  mutable state.
- Do not split one coherent task into ritual steps ("research", "implement",
  "format").
- If tracks feel coupled, write the shared contract first, then fan out.

## Roles on Agewise

| Mate role | Agewise equivalent |
| --- | --- |
| Owner | this chat session (keeps final responsibility) |
| Worker | a sub-task with a self-contained prompt, ideally run in parallel/background |
| Verifier | a separate, read-only pass that re-runs checks against primary evidence |
| Plan | the `plan` skill's plan file plus the todo list |
| Decision cycle | todo update plus a short status message to the user |

## Orchestrate

1. **Plan** — invoke the `plan` skill; write the deliverable split to the plan
   file, then mirror it as todos.
2. **Launch** — hand each worker a self-contained prompt: deliverable, expected
   files/output, constraints, and a stop condition. Run tasks in parallel only
   when they are genuinely independent.
3. **Verify** — an independent pass that runs commands, inspects original
   sources, and recomputes key numbers. Never grade the producer's own summary.
4. **Integrate and report** — run the end-to-end gate, then report what changed,
   with evidence.

## Validation closure

- Verify serious/risky deliverables independently, where an error would be hard
  to notice or expensive to recover from.
- Low-risk deliverables may skip verification with a concrete written reason.
- A verifier's job is checks against primary evidence, not reading a summary.
- Do not add a final gate merely because the plan has several tasks; add it only
  when it checks a distinct end-to-end boundary.

## Intervention

| Signal | Action |
| --- | --- |
| Worker waits/sleeps on CI or a human | Tell it to stop waiting, write its deliverable, and exit. |
| Worker progresses but is near a limit | Narrow scope; ask for the partial deliverable plus a precise blocker. |
| Worker is stuck or drifting | Steer with a concrete correction. |
| Verification must change | Change it explicitly and record why. |
| Plan is unrecoverable | Cancel and take over in the owner session. |

A timeout is not proof of failure: first check for deliverables, commits, or
outputs.

## Mid-plan scope changes

| Situation | Action |
| --- | --- |
| User changes the goal | Re-state the new objective, then steer, re-plan, or cancel. |
| New evidence invalidates the plan | Stop trusting the old split; steer or cancel before launching more work. |
| Running work is now wrong | Steer it immediately (abort or redirect). |
| Only future work changed | Let the current work finish, then update the todos/plan. |

If previously accepted output is now invalid, add a corrective task or gate —
do not pretend an old PASS still proves the new objective.
