# Condo App Technical Stack

## Document Set

- Overview: `docs/architecture/condo-app-technical-stack.md`
- One-page diagram: [condo-app-architecture-diagram.md](./condo-app-architecture-diagram.md)
- Stack-by-folder walkthrough: [condo-app-stack-by-folder.md](./condo-app-stack-by-folder.md)

## Overview

This condo application is built as a JavaScript/Node monorepo with three primary runtime surfaces:

1. A React web client for the condo portal UI.
2. An Express API server for auth, condo data, and reports.
3. An Electron desktop launcher that manages Docker-based startup and shutdown for end users.

The repository is operationally centered on Docker Compose. It supports both a developer-oriented hot-reload workflow and a desktop-oriented runtime bundle that can be launched by non-technical users.

## Core Technologies

### Frontend

- React 18 for the user interface
- React Router for page navigation
- Vite for local development and production builds
- Tailwind CSS v4 for styling
- Axios for API calls
- jsPDF and `jspdf-autotable` for client-side PDF export

The client runs on port `3000` in development and proxies `/api` calls to the backend through Vite.

### Backend

- Node.js with ES modules
- Express 4 for HTTP APIs
- `cors` and `dotenv` for environment and request handling
- `jsonwebtoken` for JWT-based auth
- Passport for OAuth integrations
- Swagger UI for API documentation

The backend exposes route groups under `/api/auth`, `/api/condo`, `/api/reports`, and `/api/docs`, plus `/api/health` for runtime readiness checks.

### Authentication

The app supports multiple sign-in paths:

- Local email/password auth
- Google OAuth via `passport-google-oauth20`
- Microsoft / Azure AD OAuth via `passport-azure-ad-oauth2`

JWTs are issued by the backend and then used by the client for authenticated API requests.

### Data Layer

This is not a pure MERN application anymore.

- MongoDB with Mongoose is still used for core domain models such as users, condo units, payments, and work orders.
- MySQL is also present and is the default reporting provider for report queries and reporting views.

The reporting service switches between Mongo-backed and MySQL-backed repositories based on the `REPORTING_PROVIDER` environment variable. In the current compose configuration, MySQL is the default reporting path.

### Desktop / Distribution

- Electron powers the desktop launcher
- Electron Forge packages the launcher for Windows, macOS, and Linux
- The launcher shells out to Docker Compose commands, watches health checks, opens the browser, and manages clean stop/start flows

This gives the project both a developer workflow and a desktop-distribution workflow without requiring end users to run commands manually.

### DevOps / Runtime

- Docker and Docker Compose for local orchestration
- Separate compose files for production-style local build, development hot reload, and desktop runtime bundles
- Dockerized MongoDB and MySQL services
- Node-based release and packaging scripts under `scripts/desktop`

## Runtime Shape

At a high level, the system works like this:

1. The browser loads the React app on `localhost:3000`.
2. The React client sends `/api` requests through the Vite dev proxy in development, or directly to the backend in bundled/runtime scenarios.
3. The Express server handles auth, business routes, report requests, and health checks.
4. MongoDB stores core application entities.
5. MySQL serves reporting data and SQL views used by the reporting layer.
6. The Electron launcher can bring the Dockerized stack up or down for packaged desktop use.

## Repo-Level Summary

- `client/` contains the React + Vite frontend.
- `server/` contains the Express API and data-access layers.
- `launcher/` contains the Electron desktop launcher.
- `scripts/desktop/` contains build, packaging, and release automation for desktop distribution.
- `docker-compose*.yml` files define the main runtime modes.

## Linked Artifacts

For a system-level picture, see [condo-app-architecture-diagram.md](./condo-app-architecture-diagram.md).

For a repo-structure walkthrough, see [condo-app-stack-by-folder.md](./condo-app-stack-by-folder.md).
