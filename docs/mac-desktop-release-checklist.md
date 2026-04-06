# Mac Desktop Release Checklist

This checklist is for building and packaging the Condo desktop launcher on macOS.

It covers two release paths:

- Unsigned test release: useful for internal testing and validation
- Signed production release: required when you want a smoother trust experience on macOS and intend to distribute the app more broadly

## Scope

This checklist assumes the current branch already includes:

- the Electron launcher
- the desktop Docker bundle scripts
- the runtime MySQL image support
- the architecture-aware macOS bundle flow

## Prerequisites

- A Mac with enough disk space for Electron packaging, Docker images, and release zips
- Docker Desktop installed and running
- Node.js and npm installed
- Git installed
- Access to the GitHub repository and the target branch
- Access to the Docker registry used by `desktop.env`

## Repo Preparation

1. Clone the repository or pull the latest changes for the target branch.
2. Keep the repo on local macOS storage for packaging and testing. Do not use mounted Windows shares, SMB shares, or other non-native volumes for the final Mac artifact workflow.
3. Open a terminal in the repo root.
4. Confirm `desktop.env` contains both required image tags:
   - `CONDO_APP_IMAGE=...`
   - `CONDO_DB_IMAGE=...`
5. Install dependencies:

```bash
npm run install:all
```

## Architecture Decision

Choose which macOS launcher package you need:

- Apple Intel: `x64`
- Apple Silicon: `arm64`
- Both: build both if you want separate artifacts for each architecture

The current menu script supports all three choices through:

```bash
npm run desktop:menu
```

If you prefer direct commands, use the architecture-specific bundle scripts:

```bash
npm run desktop:bundle:mac:x64
npm run desktop:bundle:mac:arm64
```

## Docker Image Preparation

If the app and seeded MySQL images are already published under the tags in `desktop.env`, you can skip this section.

If you need to publish images from the Mac:

1. Build local images:

```bash
npm run desktop:image:build
```

2. Choose one publish path:

- Standard push when the local build is already done and a normal push is enough:

```bash
npm run desktop:image:push
```

- Multi-architecture publish when you want broader registry compatibility:

```bash
npm run desktop:image:publish
```

## Unsigned Test Release Path

Use this path when you want a testable Mac artifact without Apple signing or notarization.

1. Make sure Docker Desktop is running.
2. Install repo dependencies:

```bash
npm run install:all
```

3. Package the launcher for the target Mac architecture:

```bash
npm run launcher:package:mac -- --arch=x64
```

or

```bash
npm run launcher:package:mac -- --arch=arm64
```

4. Assemble the final release zip:

```bash
npm run desktop:release:mac:x64
```

or

```bash
npm run desktop:release:mac:arm64
```

5. Optionally use the combined commands instead:

```bash
npm run desktop:bundle:mac:x64
npm run desktop:bundle:mac:arm64
```

6. Verify the generated zip exists in `releases/`.
7. Extract the zip on local macOS storage on a Mac test machine.
8. Launch the packaged app.
9. Expect macOS to show trust warnings because the app is unsigned.
10. Confirm the launcher can start Docker, pull the pinned images, and open `http://localhost:3000`.

### Unsigned Validation Checklist

- The packaged app opens
- The launcher window renders correctly
- `Start` pulls the pinned images successfully
- The browser opens to the local app URL
- Login works
- `Stop` shuts down the compose stack
- `Close` shows the expected running-app prompt
- The zip contains the expected launcher and runtime files

## Signed Production Release Path

Use this path when you want a proper production-facing macOS release.

### Additional Prerequisites

- Active Apple Developer membership
- A valid Developer ID Application certificate installed in Keychain
- Access to Apple notarization credentials
- A signing/notarization configuration for Electron packaging

### Important Note

The current repo packages an unsigned Electron app. If you want a fully signed and notarized production Mac release, you still need to add or confirm the Electron Forge signing and notarization configuration before the final production build.

That usually includes:

- macOS code signing identity configuration
- hardened runtime settings
- entitlements, if needed
- notarization credentials and submission flow

### Signed Release Checklist

1. Confirm the signing certificate is available in Keychain.
2. Confirm the required Apple credentials are available to the packaging environment.
3. Confirm the Electron packaging configuration includes macOS signing settings.
4. Build or publish the Docker images referenced by `desktop.env`, if needed.
5. Package the launcher for the target architecture on the Mac.
6. Sign the app during packaging.
7. Notarize the packaged app.
8. Staple the notarization ticket, if your release flow uses that step.
9. Assemble the final release zip after the signed app bundle is ready.
10. Test the signed artifact on a clean Mac.

### Signed Validation Checklist

- The app launches without the unsigned-app warning path
- Signature validation succeeds
- Notarization succeeds
- The app starts Docker and the local web app correctly
- Login works
- Stop and close flows behave correctly
- The final zip is the correct architecture and release tag

## Recommended Command Paths

### Fast Internal Test on Apple Silicon

```bash
npm run install:all
npm run desktop:bundle:mac:arm64
```

### Fast Internal Test on Intel Mac

```bash
npm run install:all
npm run desktop:bundle:mac:x64
```

### Build Both Architectures

```bash
npm run install:all
npm run desktop:bundle:mac:x64
npm run desktop:bundle:mac:arm64
```

### Menu-Driven Flow

```bash
npm run desktop:menu
```

Then choose:

1. `Bundle launcher`
2. `macOS`
3. `Apple Intel`, `Apple Silicon`, or `Build both`

## Output Expectations

Expected macOS bundle names now include the architecture so Intel and Apple Silicon releases do not overwrite each other.

Examples:

- `condo-management-portal-<tag>-darwin-x64.zip`
- `condo-management-portal-<tag>-darwin-arm64.zip`

Runtime variants follow the same pattern, with `-runtime` at the end.

## Troubleshooting

### Packaging Works on Windows but Final Mac Release Should Still Be Built on macOS

- Cross-assembly is useful for testing
- Final production Mac packaging is more reliable on macOS
- Signing and notarization should be done on macOS
- Package and launch the app from local macOS storage, not from mounted shared folders or Windows-hosted volumes

### Wrong Architecture

- Re-run the package command with the correct `--arch`
- Re-run the matching `desktop:release:mac:<arch>` command

### Missing Packaged Launcher

- Make sure the launcher package step completed first
- Check `launcher/out/` for the expected `darwin-x64` or `darwin-arm64` folder

### Docker Startup Issues

- Confirm Docker Desktop is running
- Confirm the image tags in `desktop.env` exist in the registry
- Confirm local port `3000` is free

## Final Maintainer Sign-Off

Before shipping a Mac release, confirm:

- Correct branch was used
- Correct image tags were used
- Correct architecture was packaged
- Zip file exists in `releases/`
- Release was tested on a Mac matching the target architecture
- Signed/notarized requirements were satisfied for production releases
