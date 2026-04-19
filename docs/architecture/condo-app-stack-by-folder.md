# Condo App Stack by Folder

Back to the overview: [condo-app-technical-stack.md](./condo-app-technical-stack.md)

## Top-Level Map

This walkthrough connects the technical stack to the folders that implement it in this repository.

## `client/`

The `client/` folder contains the web frontend.

- `client/package.json`
  Defines the frontend toolchain: React, React Router, Vite, Tailwind CSS, Axios, and PDF-export dependencies.
- `client/src/`
  Holds the application source code.
- `client/src/pages/`
  Page-level React components such as login, dashboard, and report pages.
- `client/src/components/`
  Shared UI and app wiring, including auth context, API client setup, report rendering, and navigation.
- `client/src/utils/`
  Frontend utility code such as PDF export helpers.
- `client/vite.config.js`
  Configures the Vite dev server and the `/api` proxy target.
- `client/public/`
  Public frontend assets that are served to end users.

Stack summary: React 18, React Router, Vite, Tailwind CSS, Axios, jsPDF.

## `server/`

The `server/` folder contains the backend API and data-access logic.

- `server/package.json`
  Defines the backend runtime: Express, Mongoose, MySQL client, Passport, JWT support, and Swagger UI.
- `server/server.js`
  Boots the Express app, loads middleware, registers routes, serves Swagger docs, exposes `/api/health`, and serves the built frontend in production-style mode.
- `server/src/routes/`
  Route modules for auth, condo features, and reporting.
- `server/src/controllers/`
  Request handlers for those route groups.
- `server/src/middleware/`
  Auth and request middleware.
- `server/src/config/`
  Database and auth configuration, including MongoDB connection, MySQL pool creation, and Passport strategy setup.
- `server/src/models/`
  Mongoose models for core entities such as users, units, payments, and work orders.
- `server/src/repositories/reporting/`
  Provider-specific reporting repositories for MySQL and MongoDB.
- `server/src/services/`
  Reporting orchestration and provider selection logic.
- `server/src/docs/swagger.json`
  API documentation source used by Swagger UI.
- `server/db/mysql/init/`
  MySQL schema, sample data, and reporting views loaded into the containerized database.

Stack summary: Node.js, Express, Passport, JWT, Mongoose, MySQL, Swagger.

## `launcher/`

The `launcher/` folder contains the desktop launcher distributed to end users.

- `launcher/package.json`
  Defines Electron and Electron Forge packaging scripts.
- `launcher/main.js`
  Runs the Electron main process, executes Docker commands, tracks state, performs health checks, and opens the browser when the app is ready.
- `launcher/preload.js`
  Exposes a safe bridge between the Electron main process and the renderer.
- `launcher/src/index.html`
  The launcher window markup.
- `launcher/src/renderer.js`
  Renderer-side UI logic for the start, stop, and close actions.
- `launcher/src/styles.css`
  Launcher window styling.
- `launcher/forge.config.cjs`
  Packaging configuration for Electron Forge.

Stack summary: Electron, Electron Forge, local Docker orchestration.

## `scripts/desktop/`

This folder contains Node-based automation for desktop packaging and release assembly.

- Image build, push, and publish helpers
- Release bundle assembly scripts
- Utility scripts for desktop packaging flows

Stack summary: Node.js automation around Docker and release packaging.

## Docker and Runtime Files

These files define how the application runs locally and in packaged desktop mode.

- `docker-compose.yml`
  Production-style local build using the API plus MongoDB and MySQL.
- `docker-compose.dev.yml`
  Development stack with Vite hot reload, API container, MongoDB, and MySQL.
- `docker-compose.desktop.yml`
  Desktop runtime stack used by the launcher bundle.
- `Dockerfile`, `client/Dockerfile.dev`, `server/Dockerfile.dev`
  Build instructions for the relevant app surfaces.
- `desktop.env` and `.env.docker`
  Environment configuration for Dockerized runtime modes.

Stack summary: Docker, Docker Compose, containerized local services.

## `docs/`

The `docs/` folder stores developer-facing documentation.

- `docs/architecture/`
  Architecture and reference documentation, including this walkthrough.
- `docs/internal/`
  Internal planning and operational notes that should not be surfaced in the product.

## Other Supporting Folders

- `patches/`
  Patch or fix artifacts kept with the repo.
- `releases/`
  Generated or staged release outputs.
- `.github/`
  GitHub automation and workflow configuration.
- `.vscode/`
  Workspace-specific IDE settings.
- `src/`
  Contains an archived zip artifact rather than active application source in the current repo layout.

## How the Pieces Fit Together

1. `client/` renders the condo portal UI.
2. `server/` processes auth, business routes, and report requests.
3. `server/src/services/` selects MongoDB or MySQL-backed reporting.
4. Docker Compose wires the client, server, MongoDB, and MySQL services into runnable environments.
5. `launcher/` gives end users a desktop wrapper around the Docker runtime.
6. `scripts/desktop/` packages and releases that launcher-based experience.

## Related Documents

- Overview: [condo-app-technical-stack.md](./condo-app-technical-stack.md)
- One-page diagram: [condo-app-architecture-diagram.md](./condo-app-architecture-diagram.md)
