# Desktop Launcher Release Guide

## Purpose

This guide covers the maintainer workflow for the Electron launcher and the desktop Docker bundles.

The desktop release path depends on:

- `desktop.env` for the pinned Docker Hub image tags
- `docker-compose.desktop.yml` for the end-user stack
- `launcher/` for the Electron launcher
- `docker/mysql/Dockerfile` for the packaged MySQL seed image

## 1. Pin the Desktop Image Tags

Update [`desktop.env`](./desktop.env) before each release:

```env
CONDO_APP_IMAGE=djeddiej/condo-app:desktop-c9b22a2-r1
CONDO_DB_IMAGE=djeddiej/condo-db:desktop-c9b22a2-r1
```

Do not use `latest`. Each release zip should point at explicit tags.

## 2. Install Dependencies

From the repo root:

```bash
npm run install:all
```

This installs the root, server, client, and launcher dependencies.

## 3. Build and Push the Desktop Images

Build the production-style images referenced by `desktop.env`:

```bash
npm run desktop:image:build
```

Push them to Docker Hub:

```bash
npm run desktop:image:push
```

If you need tags that work on Windows-hosted Docker, Apple Silicon Macs, Intel Macs, and Linux, publish multi-architecture images instead:

```bash
npm run desktop:image:publish
```

## 4. Package the Launcher

Run the package script for the target operating system:

```bash
npm run launcher:package:win
npm run launcher:package:mac
npm run launcher:package:linux
```

Electron Forge writes packaged output into `launcher/out/`.

If you need a specific architecture, pass it through to Electron Forge after `--`. Example:

```bash
npm run launcher:package:mac -- --arch=arm64
```

## 5. Assemble the End-User Zip

Once the launcher has been packaged for the target OS, assemble one of the distributable zips.

Full debug bundle with repo files:

```bash
npm run desktop:release:win
npm run desktop:release:mac
npm run desktop:release:linux
```

Runtime-only client bundle:

```bash
npm run desktop:release:runtime:win
npm run desktop:release:runtime:mac
npm run desktop:release:runtime:linux
```

Or run the combined bundle commands:

```bash
npm run desktop:bundle:win
npm run desktop:bundle:mac
npm run desktop:bundle:linux

npm run desktop:bundle:runtime:win
npm run desktop:bundle:runtime:mac
npm run desktop:bundle:runtime:linux
```

Release zips are written to `releases/`.

Bundle contents:

- Full bundle: packaged launcher plus the repo files needed for debugging and inspection
- Runtime bundle: packaged launcher plus `desktop.env`, `docker-compose.desktop.yml`, `.env.docker`, and user-facing docs

## 6. Validate the Release

Before shipping a release zip, verify:

1. Docker Desktop is already installed on the test machine.
2. Launching the packaged app opens the Electron window.
3. Clicking `Start` pulls the pinned images and opens `http://localhost:3000`.
4. Logging in works with the demo accounts.
5. Clicking `Stop` removes the desktop compose containers.
6. Clicking `Close` while the app is running prompts to keep running or stop first.

## Notes

- The v1 launcher is unsigned, so Windows and macOS may still show trust warnings.
- The launcher expects to find `docker-compose.desktop.yml` and `desktop.env` by walking upward from its own folder. Keep the packaged launcher inside the extracted bundle.
- If you change the image names or tags, rebuild the release zip so the bundled launcher and compose config stay aligned.
- The runtime bundle no longer needs the local MySQL SQL seed folder because those files are baked into the published MySQL image.
- For macOS releases, package and test the app on local macOS storage only. Avoid Windows-built Mac zips, network shares, and mounted shared volumes when validating `.app` bundles.
