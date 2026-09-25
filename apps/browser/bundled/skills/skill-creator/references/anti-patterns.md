# Anti-patterns

Common reasons a skill does not work.

- **Overlapping with an existing skill.** Two skills that both match a request
  make loading unpredictable. Improve the existing one instead.
- **Vague description.** The skill loads for everything or nothing. See
  `description-rubric.md`.
- **Teaching prose.** Feature tours, API overviews, background essays. The run
  needs instructions, not a manual.
- **Unfollowable rules.** "Be careful", "write clean code", "consider edge
  cases" — no run can act on these.
- **Inlining bulk.** Long schemas, tables, or variants inside `SKILL.md` bloat
  every load. Move them into `references/` and link them.
- **Scripts for trivial work.** If it is a couple of steps, describe them; only
  bundle a script when the logic is genuinely deterministic and repetitive.
- **No failure path.** A skill that only describes the happy path breaks the
  moment the expected input is missing.
- **Duplicated trigger list.** Repeating the description as a "When to use"
  section costs tokens and drifts out of sync.
