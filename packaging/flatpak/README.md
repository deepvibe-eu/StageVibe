# StageVibe Flatpak

Local Flatpak packaging for StageVibe (`eu.deepvibe.StageVibe`), built from the
unpacked Linux release bundle via `org.electronjs.Electron2.BaseApp`.

## Prerequisites

- `flatpak` and `flatpak-builder` (e.g. `sudo pacman -S flatpak-builder` on Arch/CachyOS)
- Runtimes matching the manifest (`25.08`):
  ```sh
  flatpak install flathub org.freedesktop.Platform//25.08 org.freedesktop.Sdk//25.08
  flatpak install flathub org.electronjs.Electron2.BaseApp//25.08
  ```

## Build & install

```sh
pnpm -F stagevibe make:release   # -> apps/browser/out/release/stagevibe-linux-x64
packaging/flatpak/build.sh
```

Run it:

```sh
flatpak run eu.deepvibe.StageVibe
```

## Files

| File | Purpose |
|------|---------|
| `eu.deepvibe.StageVibe.yml` | Flatpak manifest |
| `stagevibe-launcher.sh` | `zypak-wrapper` launcher (Chromium sandbox in Flatpak) |
| `eu.deepvibe.StageVibe.desktop` | Desktop entry |
| `eu.deepvibe.StageVibe.metainfo.xml` | AppStream metadata |
| `build.sh` | Build + install helper |

## Sandbox caveats

StageVibe is an agentic IDE that runs shells, `git`, `node`/`pnpm` and other
host tooling. A Flatpak sandbox does not contain those binaries. The manifest
therefore requests `--filesystem=host` and `--talk-name=org.freedesktop.Flatpak`
so the app can reach host tooling via `flatpak-spawn --host <cmd>`. The agent's
shell/tool execution may need to be routed through `flatpak-spawn --host` to
work fully sandboxed.

## Flathub

For a Flathub submission, replace the local `type: dir` source in the manifest
with a remote source of the released bundle and pin its checksum:

```yaml
      - type: archive
        url: https://github.com/deepvibe-eu/StageVibe/releases/download/stagevibe@1.0.1/stagevibe-linux-x64-1.0.1.zip
        sha256: <sha256>
```

The app id (`eu.deepvibe.StageVibe`) must be under a domain the project
controls, or switch to `io.github.<owner>.StageVibe`.
