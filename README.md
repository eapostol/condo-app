# Condo Management Portal (Demo) — Docker Setup Guide

This package is a **demo** condo-management web portal. It runs entirely in Docker.

## What you do (quick start)

1. Install Docker (one-time).
2. Unzip this folder.
3. Run this single command in the unzipped folder:

```bash
docker compose up --build
```

4. Open the app in your browser:

- http://localhost:3000

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

---

For more detail, open the PDF: **Condo-App_Docker_Setup_Guide_2026-01-16.pdf**
