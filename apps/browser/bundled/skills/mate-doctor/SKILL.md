---
name: mate-doctor
description: >
  Diagnose why an Agewise session, chat, provider or app run behaved
  incorrectly. Load when asked about stuck runs, failed tool calls, provider or
  API-key errors, missing history, context/compaction problems, or recovery.
user-invocable: true
agent-invocable: false
---

# Mate Doctor (Agewise)

Root-cause first. Find the evidence before proposing a fix; never guess at a
cause you can read from the data.

## Where the truth lives

| Surface | Location | Answers |
| --- | --- | --- |
| Chat/agent database | `<dataRoot>/agents/instances.sqlite` (tables `agentInstances`, `agentMessages`) | messages, tool calls, model, tokens, timestamps, compaction briefings |
| Other databases | `history.sqlite`, `asset-cache.sqlite`, `favicon.sqlite`, `file-read-cache.sqlite`, `processed-image-cache.sqlite`, `diff-history/data.sqlite` | browsing history, caches, diffs |
| Config | `<dataRoot>/preferences.json`, `config.json`, `credentials.json`, `identity.json`, `auth-session.json` | provider instances, presets, utility models, sign-in state |
| Data root | dev `~/.config/agewise-dev/agewise`, release `~/.config/agewise/agewise`, also `…-prerelease`, `…-nightly`, isolated `…-dev-<hash>` | which profile a run used |
| Logs | the terminal that started the app (no log files by default) | startup, service and provider errors |
| Provider diagnostics | Settings → Models & Providers; probe definitions in `apps/browser/src/shared/validation-models.ts` | why a key was rejected |
| Runtime | `package.json` (`engines.node`, `packageManager`) and About → “Other versions” (Electron runtime) | version mismatches |

How to read the database, check the compaction boundary and inspect provider
config: `references/agewise-surfaces.md`.

## Workflow

1. **Reproduce or locate.** Identify the session, the failing action and the
   time it happened. Ask for the terminal output if you cannot see it.
2. **Read the evidence.** Query the database and config; check the log lines
   around the failure. Quote what you found.
3. **Attribute.** Separate app bug, provider/key problem, model behaviour and
   user-environment issue. Say plainly which one it is.
4. **Report and, if asked, fix.** State cause, evidence, and the smallest
   corrective step (setting change, restart, rebuild, config edit).
5. **Never edit the live database** while the app is running; copy it if you
   need to experiment.

## Common findings

- **Ring shows high usage after compaction** → the briefing is applied at prompt
  time; `used_tokens` only refreshes on a step. Check the compaction boundary in
  the DB before assuming compaction failed.
- **Provider “insufficient balance” / auth errors** → key type or plan, not the
  app; check the probe result and the instance config.
- **Nothing happens on a UI action** → check whether the app is running
  (single-instance lock) and whether the relevant RPC command exists in the
  build (`pnpm build` after package changes).
- **Data looks missing after the rename** → confirm which profile is in use and
  whether the `stagewise*` → `agewise*` migration ran.
