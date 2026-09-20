# Stagewise surfaces: commands and queries

Concrete recipes for triage. Paths assume Linux; `<repo>` is the workspace root
(for example `~/Projects/Agewise`).

## Session store (`kilo.db`)

Read-only. Never edit the live DB while the app is running.

```sh
DB=~/.local/share/kilo/kilo.db

# Recent sessions, with project and directory
sqlite3 -header -column "$DB" \
  "SELECT id, project_id, directory, title,
          datetime(time_updated/1000,'unixepoch') AS updated
   FROM session ORDER BY time_updated DESC LIMIT 20;"

# All user messages of a session
sqlite3 "$DB" \
  "SELECT COALESCE(json_extract(p.data,'\$.text'),'')
   FROM message m JOIN part p ON p.message_id = m.id
   WHERE m.session_id='ses_...'
     AND json_extract(m.data,'\$.role')='user'
     AND json_extract(p.data,'\$.type')='text'
   ORDER BY m.time_created, p.time_created;"

# Tool calls (name + command/file) of a session
sqlite3 "$DB" \
  "SELECT json_extract(p.data,'\$.tool') || ' :: ' ||
          COALESCE(json_extract(p.data,'\$.state.input.command'),
                   json_extract(p.data,'\$.state.input.filePath'),'')
   FROM part p
   WHERE p.session_id='ses_...'
     AND json_extract(p.data,'\$.type')='tool';"

# Why is a session not visible in a project's recall? The session's
# project_id/directory may not match the current workspace path.
```

Note: message/part text is stored in clear text. Treat the DB as sensitive.

## Logs

```sh
ls -la ~/.local/share/kilo/log/
grep -iE "error|warn" ~/.local/share/kilo/log/*.log | tail -50
```

## Worktrees

```sh
cd <repo>
git worktree list
ls -la .kilo/worktrees/
```

## App will not start (Electron sandbox)

On Linux, `FATAL: ... SUID sandbox helper ... aborting` usually means the shell
runs inside a sandbox (e.g. Flatpak VS Code/Codium) where unprivileged user
namespaces are blocked.

```sh
cat /.flatpak-info 2>/dev/null && echo "inside flatpak: $FLATPAK_ID"
unshare --user --map-root-user true   # fails when userns is blocked
```

Start the app from a normal host terminal, or from inside the sandbox:

```sh
flatpak-spawn --host bash -lc \
  'export PATH="$HOME/.local/node22/bin:$PATH"; cd <repo> && pnpm -F stagewise start'
```

## Runtime pin

`pnpm` must match `packageManager` in the root `package.json`; a distro `pnpm`
(major mismatched) can fail electron-forge's `node-linker` check. Check:

```sh
node -v && pnpm -v
pnpm config get node-linker   # must print: hoisted
```

## Provider / API-key errors

- Validation probes per vendor: `apps/browser/src/shared/validation-models.ts`.
- A provider instance keeps an optional `baseUrl` override
  (Settings → provider detail → Base URL override).
- Vendor-specific billing quirks, e.g. MiniMax Credits require a Subscription
  Key while standard keys draw from the account balance.
