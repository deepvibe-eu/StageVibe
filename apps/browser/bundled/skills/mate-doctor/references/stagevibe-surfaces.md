# StageVibe surfaces: what to inspect

Read-only recipes for triage. Never modify the live database while the app is
running — copy it first if you need to experiment. Open every query read-only
by passing `-readonly` to `sqlite3` (see below), so an accidental statement
cannot write.

Adjust the data root to the profile in question (see the table in `SKILL.md`).

```sh
# dev profile
DATA=~/.config/stagevibe-dev/stagevibe
DB="$DATA/agents/instances.sqlite"
```

## Chats and messages

```sh
# Instances: model, token count, timestamps
sqlite3 -readonly -header -column "$DB" \
  "SELECT id, used_tokens, active_model_id,
          datetime(last_message_at/1000,'unixepoch') AS last_message
   FROM agentInstances ORDER BY last_message_at DESC LIMIT 20;"

# Message sizes for one instance (find the big ones)
sqlite3 -readonly -header -column "$DB" \
  "SELECT seq, role, length(parts) AS chars
   FROM agentMessages WHERE agent_instance_id='<id>'
   ORDER BY seq;"

# Compaction boundary: which message carries a briefing, and how large it is
sqlite3 -readonly "$DB" \
  "SELECT seq, id, length(metadata) FROM agentMessages
   WHERE agent_instance_id='<id>'
     AND metadata LIKE '%compressedHistory%';"

# Read a briefing (metadata is JSON)
sqlite3 -readonly "$DB" \
  "SELECT json_extract(metadata,'\$.compressedHistory')
   FROM agentMessages WHERE id='<boundary-message-id>';"
```

Interpretation: the prompt sent to the model starts at the **last** message
carrying `compressedHistory`; everything before it is replaced by that briefing.
If the ring looks high but a boundary exists, the prompt is short and the ring
value is the last provider-reported usage (it refreshes on the next step).

## Provider configuration

```sh
# Instances and presets (no secrets in the file; keys are separate)
python3 - <<'PY'
import json, pathlib
p = json.loads(pathlib.Path("~/.config/stagevibe-dev/stagevibe/preferences.json").expanduser().read_text())
for i in p.get("providerInstances", []):
    print(i.get("id"), "|", i.get("typeId"), "|", i.get("name"), "| enabled:", i.get("enabled"))
print("utility:", json.dumps(p.get("agent", {}).get("utilityModels", {})))
PY
```

- Keys live in `credentials.json` (Electron `safeStorage`); they are not
  human-readable. A missing/invalid key surfaces as an auth error, not as a
  database problem.
- Probe definitions (which model IDs are tried for a vendor key) are in
  `apps/browser/src/shared/validation-models.ts`.

## Logs

The app logs to the terminal that started it (`pnpm -F stagewise start:fast`, or
the packaged binary). Useful markers:

- `[BaseAgent:<id>] Compressing history …`, `[history-compression] …` —
  compaction runs and per-model results.
- `[history-compression] Step prompt: history=… compactionBoundary=… modelMessages=… ~… tokens`
  — the real prompt size after truncation.
- `Provider`/`AI SDK` errors — key, base URL or model problems.

## Runtime and data root

- Node/pnpm for tooling: `package.json` → `engines`, `packageManager`.
- Electron runtime versions: About → “Other versions”.
- Profile selection: the app uses `<appData>/<baseName>` where `baseName` is
  `stagevibe`, `stagevibe-dev`, `stagevibe-dev-<hash>`, `stagevibe-nightly` or
  `stagevibe-prerelease`.
