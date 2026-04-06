# Condo Management Portal

## End-User Launch

This project now supports a desktop launcher for non-technical users.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your operating system.
2. Download the OS-specific runtime release zip prepared by the maintainer.
3. Unzip the package.
4. Open the `Desktop Launcher` folder inside the unzipped package.
5. Run the launcher for your platform.
6. Click `Start`.

The launcher will:

- verify Docker Desktop is available
- pull the pinned Docker images from Docker Hub
- start the local containers in the background
- open your browser to [http://localhost:3000](http://localhost:3000) when the app is ready

To stop the app, reopen the launcher and click `Stop`.

To close only the launcher window, click `Close`. If the app is still running, the launcher will ask whether to keep it running or stop it first.

## Login

For local sign-in, use the seeded email address and password below. Usernames such as `manager1` and `board1` are not accepted in the email field.

- Manager: `manager@example.com` / `Password123!`
- Board: `board@example.com` / `Password123!`

## Manual Desktop Docker Commands

If you ever need the manual fallback for the desktop stack:

```bash
docker compose --env-file desktop.env -f docker-compose.desktop.yml up -d
```

To stop it:

```bash
docker compose --env-file desktop.env -f docker-compose.desktop.yml down
```

## Developer Workflows

This repo now has three Docker Compose entry points:

- `docker-compose.yml`: production-style local build
- `docker-compose.dev.yml`: Vite hot reload development stack
- `docker-compose.desktop.yml`: end-user launcher stack that pulls pinned runtime images

### Desktop Bundle Variants

- Full bundle: keeps the repo content in the zip for debugging and inspection
- Runtime bundle: includes only the packaged launcher, runtime compose/env files, and user-facing docs

### macOS Launcher Test

To package and open the macOS launcher from a Mac test machine, run:

```bash
bash scripts/desktop/test-macos.sh
```

Run the script from a local copy of the repo on the Mac, not directly from a network share.
The script also removes any prior desktop test containers and volumes before packaging a fresh launcher bundle.
Package and test Mac bundles from local macOS storage only. Avoid Windows-built Mac zips and mounted shared volumes for final validation.

### Development Mode

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Production-Style Local Build

```bash
docker compose up --build
```

### Reset Local Data

```bash
docker compose down -v
```

## Troubleshooting

- Docker Desktop must be open and fully running before the launcher can start the app.
- If port `3000` is already in use, the launcher will fail until that port is free.
- The first launch can take a while because Docker may need to pull images.
- If the launcher says Docker is installed but not running, open Docker Desktop and wait until it reports that the engine is running.

## Maintainers

Desktop image packaging and release steps are documented in [DESKTOP_LAUNCHER_RELEASE.md](./DESKTOP_LAUNCHER_RELEASE.md).
