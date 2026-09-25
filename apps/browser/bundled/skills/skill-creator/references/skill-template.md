# Skill template

```markdown
---
name: <Short Display Name>
description: <When to load this skill, and what it is not for.>
user-invocable: true
agent-invocable: true
---

# <Title>

<One sentence: what this skill makes the run produce.>

## Procedure

1. <Concrete step.>
2. <Concrete step.>
3. <Concrete step.>

## Rules

- <Hard constraint the run must respect.>
- <Input/output contract.>

## Failure handling

- <What to do when the expected input is missing or the step fails.>
```

Notes:

- Only add sections that carry weight. A short skill with five real rules beats a
  long one with twenty vague ones.
- `references/` files are read on demand — link them from the body, don't inline
  their content.
- `scripts/` are for deterministic work the model should not re-derive each run.
