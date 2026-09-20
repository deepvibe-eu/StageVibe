# Orchestration: Mavis → Stagewise mapping

This reference explains how the original Mavis Team roles are reproduced with
Stagewise primitives, and where the port is honestly narrower.

## Concept mapping

| Mavis concept | Stagewise implementation |
| --- | --- |
| Owner session | This chat session. The owner plans, launches, intervenes, decides, integrates, and cleans up. |
| Worker agent | A sub-task with a fully self-contained prompt. It must be able to finish from its prompt plus the repository, without the owner's context. |
| Team plan (YAML) | The `plan` skill's plan file, mirrored into the todo list. |
| `depends_on` | Real ordering only: a worker's prompt needs another worker's output/contract. |
| `verified_by` | A separate verification pass (see `verification.md`). |
| `mavis team plan status` | Re-read the todos and the plan file; summarize state to the user. |
| `mavis team plan steer` | Send a concrete correction to the running/next worker. |
| `mavis team plan decision` | Update the todos and give the user a short round summary. |

## Trigger and scope

The original skill is deliberately hard to trigger: only an explicit
`/mavis-team` (or `/team`) invocation, or a 100% unambiguous request, starts a
team. Keep that. Complexity, long-running work, or a plausible need for
specialists are **not** triggers.

Even when triggered, prefer one owner plus a light verifier when that
satisfies the request. A broad parallel team is justified only when it
measurably reduces time or risk.

## Worker prompt contract

Every worker prompt must state:

1. **Deliverable** — the concrete artifact (file, patch, report) and where it
   lives.
2. **Context** — the exact paths, interfaces, conventions, and constraints the
   worker cannot infer.
3. **Stop condition** — what "done" means, and when to stop instead of waiting
   (never wait on CI, review, or a human reply).
4. **Evidence to report** — commands run, outputs, changed files, hashes.

Bad: "Based on your findings, implement the fix."
Good: "Update `src/validators/plan-schema.ts` so duplicate task ids and missing
dependency ids are rejected before launch. Add unit tests. Report changed files
and the test command."

## Limitations versus the original

- The original coordinates a daemon-managed fleet through `mavis team plan`
  commands. This port has no daemon and no such CLI; parallelism is bounded by
  what sub-tasks the host actually supports.
- Do not invent a `mavis` command. If a step would have used the CLI, do it
  with Stagewise tools (plan file, todos, sub-tasks) instead.
- If genuine parallel execution is unavailable, say so and fall back to a
  sequential owner+verifier plan rather than pretending a team is running.
