# Condo Management Portal (Demo) — Docker Setup Guide

## Overview

This package is a **demo** condo-management web portal. It runs entirely in Docker.

## What You Do (Quick Start)

1. (one-time only) Install the version of [Docker Desktop](https://www.docker.com/products/docker-desktop/) appropriate for your operating system.
2. Unzip this folder.
3. Run this single command in the unzipped folder:

   ```bash
   docker compose up --build
   ```

4. Open the app in your browser:

- [http://localhost:3000](http://localhost:3000)

## Login (demo accounts)

- **Manager login**: `manager1` / `Password123!`
- **Board login**: `board1` / `Password123!`

## How to stop

- In the same terminal window: press **Ctrl + C**
- Then run:

```bash
docker compose down
```

## If you need a full reset

This removes the demo databases and returns the app to a clean state:

```bash
docker compose down -v
```

## Troubleshooting

- **Docker says it isn’t running**: open Docker Desktop and wait until it’s “Running”.
- **Port already in use**: something is already using port 3000. Close that app or change ports in `docker-compose.yml`.
- **First run takes a while**: that’s normal; Docker is building images.

### Windows PowerShell: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

If you see an error similar to:

```text
unable to get image 'mongo:7': error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/...": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

This means Docker CLI cannot reach the Docker Desktop Linux engine. The issue is usually Docker Desktop not running yet, the Linux engine not selected, or Docker context mismatch.

In **PowerShell**, run:

```powershell
docker version
docker context ls
docker context use default
docker info
```

Then make sure Docker Desktop is open and shows **Engine running**. If needed, restart Docker Desktop.

If it still fails, restart Docker services from an elevated PowerShell:

```powershell
Restart-Service com.docker.service
```

After Docker is healthy, retry from repo root:

```powershell
docker compose -f docker-compose.dev.yml pull mongo
docker compose -f docker-compose.dev.yml up --build
```

---

For more detail, open the PDF: **Condo-App_Docker_Setup_Guide_2026-01-16.pdf**

2026-02-02

## Running in Dev Mode (Vite + Hot Reload)

This repo supports two Docker Compose modes:

- **Production-style** (`docker-compose.yml`): builds the client and serves it from the API container.
- **Development** (`docker-compose.dev.yml`): runs the Vite client separately for fast refresh/hot reload.

### Start Dev Mode

From the repo root (where `docker-compose.dev.yml` is located):

```bash
docker compose -f docker-compose.dev.yml up --build -d
```
