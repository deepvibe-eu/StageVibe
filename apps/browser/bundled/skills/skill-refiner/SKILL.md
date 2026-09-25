---
name: Skill Refiner
description: Improve an existing skill with the smallest evidence-backed change. Use when a skill is factually wrong, outdated, or misses a real edge case. Do not use to author new skills.
user-invocable: false
agent-invocable: true
---

# Skill Refiner

Repair a skill with the smallest change that fixes the actual problem. A skill
is documentation for future runs: the goal is a correct, minimal patch, not a
rewrite.

## Before anything: is there evidence?

You need a concrete, observable reason — not a feeling that the skill "could be
better".

Good evidence:

- A run that produced the wrong outcome and a quote of the instruction that
  caused it.
- A user statement such as "the skill told me to do X, but X is no longer
  correct".
- A changed reality: a renamed command, a removed API, a new required flag.

Not evidence:

- Personal wording or formatting preferences.
- "This could be clearer."
- The agent ignoring a correct instruction (that is an agent mistake, not a
  skill defect).

If you only have a vague complaint, stop and say so.

## Procedure

1. **Read the whole skill first.** Open the `SKILL.md` and any
   `references/`/`scripts/` it points to. Do not patch from memory.
2. **Attribute the failure.**
   - Instruction is wrong or outdated → patch the skill.
   - Instruction was right, agent did not follow it → do not patch; report the
     mistake.
   - Environment changed → update the skill to match reality.
   - Common case works, an edge case fails → add the edge case.
   - Pure style → do not touch it.
3. **Design the minimal patch.** Write down, before editing:
   - Problem: what is broken.
   - Evidence: the quote, error, or user statement.
   - Rationale: why this change fixes it without breaking what already works.
   Prefer editing a sentence or a step over rewriting a section.
4. **Self-check.** Will this address the evidence (not a nearby symptom)? Could
   it break correct behavior? Am I smuggling in generic advice instead of a
   targeted fix? Is this the skill trying to edit itself? If any answer is
   unsatisfying, refine or abandon the patch.
5. **Apply and verify.** Make the edit with a file tool, then re-read the
   result: frontmatter intact, instructions still self-consistent, no dangling
   references. If the patch reads worse, revert it and take another approach.

## Boundaries

- Keep `name` and `description` in the frontmatter working — other tooling and
  skill discovery depend on them.
- Never write secrets (keys, tokens, credentials) into a skill.
- Keep skills reasonably small; if the patch would grow it a lot, split the new
  material into a `references/` file and link it.
- One problem per patch. Unrelated fixes belong in a separate change.
- Do not modify this skill while using it.

## Anti-patterns

- Rewriting a skill when a one-line correction would do.
- Adding generic warnings ("always be careful…") that no future run can act on.
- Deleting a correct instruction because one report was a false positive.
- Bundling several unrelated fixes into one edit.
- Acting on a report without first reproducing or locating the cause.

## Done means

- The specific problem from the evidence is gone.
- The skill still reads coherently end to end.
- You can name the evidence and explain why the patch is sufficient.
