---
name: mavis-doctor
description: >
  Diagnose why a Stagewise session, agent, provider, or app run behaved
  incorrectly. Load when the user mentions a session id (ses_...), wants logs,
  root-cause analysis, or asks about stuck runs, failed tool calls, provider or
  API-key errors, or recovery.
user-invocable: true
agent-invocable: false
---

# Mavis Doctor (Stagewise port)

Root-cause-first triage for this Stagewise fork. Adapted from MiniMax Mavis
Doctor: the daemon-specific parts (mvs_ ids, `~/.mavis`, the `mavis-session-log`
bakery) are replaced with the surfaces that actually exist here.

## Where the truth lives

| Surface | Location | Answers |
| --- | --- | --- |
| Session store | `~/.local/share/kilo/kilo.db` (tables `session`, `message`, `part`, `todo`) | transcript, tool calls, timestamps, token/cost |
| Logs | `~/.local/share/kilo/log/` | startup, service and provider errors |
| Worktrees | `<repo>/.kilo/worktrees/` | parallel agent sessions |
| Provider config | Settings → Models & Providers (keys encrypted via Electron `safeStorage`) | which instances/keys/base URLs exist |
| Validation probes | `apps/browser/src/shared/validation-models.ts` | why a key was rejected |
| Runtime pin | `package.json` (`engines.node`, `packageManager`) | expected Node/pnpm versions |

Concrete queries and commands: `references/stagewise-surfaces.md`.

## Route

- One bad session (`ses_...`): read the transcript from `kilo.db`.
- Provider or API-key error: check the validation probes and the instance's
  base URL (Settings → provider detail → Base URL override).
- App will not start: check Flatpak vs host and the Electron sandbox first
  (`references/stagewise-surfaces.md`).
- Unknown symptom: start from the session store, then the logs.

## Hard rules

- Never `cat` huge blobs; use `sqlite3` queries, `grep`, `head`, `tail`.
- Absence in one surface is not proof of absence elsewhere; check the transcript
  **and** the logs.
- Reproduce the symptom before concluding.
- Prefer artifact-producing steps over one-off archaeology when follow-up
  analysis is likely.

## Output contract

- **Scope** — session / provider / app-startup / tool-call / uncertain
- **Evidence** — concrete files, queries, timestamps, error strings
- **Conclusion** — the narrowest cause the evidence supports
- **Next action** — the smallest confirming or fixing step

Return concrete commands and paths, not only prose.
