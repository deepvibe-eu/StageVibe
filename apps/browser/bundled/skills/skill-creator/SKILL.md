---
name: Skill Creator
description: Turn a repeated workflow into a reusable skill. Use when the user asks to create a skill or capture a workflow; not for fixing an existing one (use Skill Refiner).
user-invocable: true
agent-invocable: true
---

# Skill Creator

A skill is instructions for a future run, not documentation. Write the smallest
text that reliably makes that run go well.

## Collect only what is missing

1. **Goal** — what should a run achieve?
2. **Triggers** — which user requests should load it?
3. **Boundaries** — which nearby requests should not?
4. **Success** — what does one good run look like?

If the idea is still vague, plan it first (e.g. with the `Plan` skill) instead of
inventing a long interview here.

## Where the skill lives

| Situation | Location |
|---|---|
| Specific to this repository | `.agents/skills/<name>/` |
| Useful across the user's projects | a user skill directory the user added in **Settings → Skills** |
| Ships with the app (maintainers only) | `apps/browser/bundled/skills/<name>/` |

Check first whether a similar skill already exists; if it does, improve it with
`Skill Refiner` rather than adding a near-duplicate.

## How to write it

- Put the trigger and the boundary in the frontmatter `description` — that is
  what decides whether the skill loads. Do not repeat it as a "When to use"
  section.
- Keep the body imperative: procedure, rules, failure handling. One or two
  examples at most.
- Be concrete: name tools, files, and outputs. Remove anything a future run
  cannot act on.
- Use the structure `SKILL.md` plus, only when needed, `references/` for bulky
  material and `scripts/` for deterministic work. Do not add scaffolding such as
  README, CHANGELOG, or .env.
- Match the frontmatter used by the bundled skills:

```yaml
---
name: <Short Display Name>
description: <When to use it — one or two sentences, including what it is not for>
user-invocable: true
agent-invocable: true
---
```

## Before you call it done

1. Run the linter: `node <skill-dir>/scripts/lint-skill.mjs <path-to-skill>` when
   you bundle the script, or check the same points by hand:
   - `SKILL.md` exists, frontmatter is complete and closed;
   - folder name is kebab-case and matches the skill's purpose;
   - every `references/…` link points at a file that exists;
   - the body is focused (roughly under ~30 KB).
2. Try it against one **real** prompt that should trigger it. If the result is no
   better than answering without the skill, the skill is either unnecessary or
   its description is wrong — fix that before adding more text.

## Anti-patterns

- Duplicating an existing skill instead of refining it.
- Vague descriptions ("helps with code") that make the skill load for everything.
- Teaching prose: feature tours, API overviews, long trigger lists.
- Rules that cannot be followed ("be careful", "write good code").
- Bundling scripts for work that is just a couple of steps.

See `references/skill-template.md`, `references/description-rubric.md` and
`references/anti-patterns.md`.
