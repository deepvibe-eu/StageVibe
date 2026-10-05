# Releasing StageVibe

This fork is hosted on the project's own Gitea, so the GitHub Actions release
workflows under `.github/workflows-disabled/` do **not** run there (they are
parked; Gitea would otherwise pick up `.github/workflows/` and fail on the
missing GitHub secrets). Continuous integration lives in
`.gitea/workflows/ci.yml` and runs on a self-hosted `act_runner` in host mode.

A release is therefore a local, manual sequence: bump, build, tag, attach.

## 1. Bump version and changelog

The release script bumps `apps/browser/package.json`, generates the changelog
from commits in the `stagewise` scope, and prints the tag command. It refuses to
run with uncommitted changes.

```bash
export PATH="$HOME/.local/node22/bin:$PATH"

# preview first
pnpm tsx scripts/release/index.ts --package stagewise --channel release --dry-run

# for real (asks for confirmation)
pnpm version:stagewise:release        # final release
pnpm version:stagewise:beta           # prerelease
pnpm version:stagewise:alpha          # early testing
```

Version formats and the channel rules (including the 999 counter cap) are in
[`VERSIONING.md`](./VERSIONING.md).

## 2. Commit and tag

```bash
git add apps/browser/package.json CHANGELOG.md
git commit -m "chore(stagewise): release <version>"
git tag -a "stagewise@<version>" -m "stagewise@<version>"
git push origin custom
git push origin "stagewise@<version>"
```

## 3. Build the artefacts

`make` reads `.env.prod`. The Linux targets need the matching system tools
(`zip` for the zip maker, `dpkg` for the .deb maker); `rpm` currently fails in
its generator, so prefer AppImage and zip.

```bash
pnpm -F stagewise make --targets AppImage
pnpm -F stagewise make --targets zip
# artefacts land in apps/browser/out/dev/make/<target>/x64/
```

## 4. Publish on Gitea

1. Open the repository on Gitea → **Releases** → **New release**.
2. Choose the tag created above (`stagewise@<version>`).
3. Paste the changelog section for this version as the release notes.
4. Attach the artefacts from `apps/browser/out/dev/make/…`.
5. Publish.

## Notes

- CI runs on the self-hosted `act_runner` in host mode (`ubuntu-latest:host`).
  The workflow installs Node 22 and pnpm 10.30.3 itself via actions, so the
  server needs neither Node nor Docker — only `git` and the runner.
- `make` builds the **dev** release channel unless told otherwise; the release
  channel comes from the environment used to build. Check the version and
  channel shown on the app's About screen after packaging.
- Windows installers need Windows (Squirrel) and macOS installers need macOS
  (DMG); neither can be produced on Linux. Use a Gitea Actions runner on those
  platforms, or build on the target OS.
- Code signing (Windows/macOS) is not configured in this fork, so those builds
  show an unsigned-app warning until certificates are set up.
