# Flathub submission

Self-contained manifest for the Flathub repository
(`flathub/eu.deepvibe.StageVibe`). It builds StageVibe from the released
Linux zip and installs it via `org.electronjs.Electron2.BaseApp`.

## Before submitting

1. **Upload the Linux zip** to the GitHub release so the source URL resolves:
   `https://github.com/deepvibe-eu/StageVibe/releases/download/stagevibe@1.0.1/stagevibe-linux-x64-1.0.1.zip`
   (asset name `stagevibe-linux-x64-1.0.1.zip`, from `pnpm -F stagevibe make:release`).
2. **Update `sha256`** in `eu.deepvibe.StageVibe.yml` if the zip is rebuilt:
   ```sh
   sha256sum apps/browser/out/release/make/zip/linux/x64/stagevibe-linux-x64-1.0.1.zip
   ```
3. **Add screenshots** to `eu.deepvibe.StageVibe.metainfo.xml` (`<screenshots>`
   with png/jpg `<image>` URLs). Flathub mirrors them from the given URLs.
4. Verify AppStream: `appstreamcli validate eu.deepvibe.StageVibe.metainfo.xml`.

## Submit

```sh
# flathub/flathub is the submission repo; open a PR from a branch
git clone https://github.com/flathub/flathub.git
cd flathub
git checkout -b eu.deepvibe.StageVibe
# copy the files from this directory to the repo root, then
git add eu.deepvibe.StageVibe.yml eu.deepvibe.StageVibe.desktop \
        eu.deepvibe.StageVibe.metainfo.xml stagevibe-launcher.sh eu.deepvibe.StageVibe.png
git commit -m "Add eu.deepvibe.StageVibe"
git push -u origin eu.deepvibe.StageVibe
# open the PR against flathub/flathub
```

## App id

`eu.deepvibe.StageVibe` requires control of the `deepvibe.eu` domain. If that
is not available, switch to `io.github.<owner>.StageVibe` (D-Bus names cannot
contain `-`, so `deepvibe-eu` becomes `deepvibe_eu`) and update the id in the
manifest, desktop file and metainfo.

## Notes

- `x-checker-data` watches GitHub releases and updates `url`/`sha256`
  automatically once the asset name is stable.
- Permissions are submission-friendly (`--filesystem=home`); users can grant
  more with `flatpak override --filesystem=host eu.deepvibe.StageVibe`.
- Host tooling (`git`, `node`, shells) is reachable through
  `flatpak-spawn --host`, enabled via `--talk-name=org.freedesktop.Flatpak`.
