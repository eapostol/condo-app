# Repo Module Map

No code changes were made.

## 1. Current Frontend Domains

| Area | Current ownership | Notes |
|---|---|---|
| App shell and routes | [client/src/App.jsx](/d:/projects/2025/condo-project/app/client/src/App.jsx), [client/src/main.jsx](/d:/projects/2025/condo-project/app/client/src/main.jsx) | Centralized route table with `/login`, `/social-login`, `/`, `/manager/reports`, `/board/reports`. `ProtectedRoute` is defined inline, so route auth logic is coupled to the top-level app shell. |
| Auth UI and session state | [client/src/components/AuthContext.jsx](/d:/projects/2025/condo-project/app/client/src/components/AuthContext.jsx), [client/src/pages/LoginPage.jsx](/d:/projects/2025/condo-project/app/client/src/pages/LoginPage.jsx), [client/src/pages/SocialLoginHandler.jsx](/d:/projects/2025/condo-project/app/client/src/pages/SocialLoginHandler.jsx) | Auth state lives in React context plus `localStorage` (`condo_user`, `condo_token`). OAuth completion is handled client-side by decoding the redirected JWT query param. |
| Shared navigation and API access | [client/src/components/Navbar.jsx](/d:/projects/2025/condo-project/app/client/src/components/Navbar.jsx), [client/src/components/apiClient.jsx](/d:/projects/2025/condo-project/app/client/src/components/apiClient.jsx) | Navbar owns role-based nav visibility. API access is split between a shared axios instance and a hook that injects bearer auth. |
| Dashboard / role landing | [client/src/pages/Dashboard.jsx](/d:/projects/2025/condo-project/app/client/src/pages/Dashboard.jsx) | Dashboard is a role-gated launcher into reporting, not yet a true admin/dashboard module. Admin currently piggybacks on manager/board surfaces. |
| Reporting UI | [client/src/pages/ManagerReports.jsx](/d:/projects/2025/condo-project/app/client/src/pages/ManagerReports.jsx), [client/src/pages/BoardReports.jsx](/d:/projects/2025/condo-project/app/client/src/pages/BoardReports.jsx), [client/src/components/ReportRunner.jsx](/d:/projects/2025/condo-project/app/client/src/components/ReportRunner.jsx), [client/src/components/ReportTable.jsx](/d:/projects/2025/condo-project/app/client/src/components/ReportTable.jsx), [client/src/utils/reportPdf.js](/d:/projects/2025/condo-project/app/client/src/utils/reportPdf.js) | This is the heaviest frontend domain today. `ReportRunner` mixes catalog loading, filter loading, filter UI, execution, and PDF export, so it is the most obviously over-coupled client component. |
| Internal-doc remnants | [client/src/components/DownloadResources.jsx](/d:/projects/2025/condo-project/app/client/src/components/DownloadResources.jsx) | Present in the repo but intentionally not part of the current dashboard surface. |

Recommended future frontend ownership:
- `auth`: login page, social callback, session context, protected-route helpers
- `dashboard`: post-login landing and role entry tiles
- `admin`: future admin-only dashboards instead of piggybacking on manager/board pages
- `reports`: report catalog, filters, runner, table, PDF export
- `condos`: property/unit selectors and condo summary UI
- `issues`: work order / maintenance presentation
- `users`: board-member/user selectors and user-facing lookup UI

## 2. Current Backend Ownership Map

| Layer | Current ownership | Mixed responsibilities |
|---|---|---|
| Bootstrap / runtime | [server/server.js](/d:/projects/2025/condo-project/app/server/server.js) | One file owns env loading, IPv4 networking workaround, Express setup, route mounting, health, Swagger, static serving, and Mongo-gated startup. |
| Route groups | [server/src/routes/authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js), [server/src/routes/condoRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/condoRoutes.js), [server/src/routes/reportRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/reportRoutes.js) | Only three route groups exist. There is no separate `users`, `issues`, or `admin` route surface yet. |
| Controllers | [server/src/controllers/authController.js](/d:/projects/2025/condo-project/app/server/src/controllers/authController.js), [server/src/controllers/condoController.js](/d:/projects/2025/condo-project/app/server/src/controllers/condoController.js), [server/src/controllers/reportController.js](/d:/projects/2025/condo-project/app/server/src/controllers/reportController.js) | Auth and condo controllers talk directly to Mongoose models. Reporting is the only controller layer already separated from persistence by a service. |
| Services | [server/src/services/reportingService.js](/d:/projects/2025/condo-project/app/server/src/services/reportingService.js) | Reporting is the only real service boundary today. Most other business logic is still controller-owned. |
| Models | [server/src/models/User.js](/d:/projects/2025/condo-project/app/server/src/models/User.js), [server/src/models/CondoUnit.js](/d:/projects/2025/condo-project/app/server/src/models/CondoUnit.js), [server/src/models/WorkOrder.js](/d:/projects/2025/condo-project/app/server/src/models/WorkOrder.js), [server/src/models/Payment.js](/d:/projects/2025/condo-project/app/server/src/models/Payment.js) | Operational data is Mongo/Mongoose-based. User persistence is still effectively owned by auth. |
| Repositories | [server/src/repositories/reporting/mysqlReportRepository.js](/d:/projects/2025/condo-project/app/server/src/repositories/reporting/mysqlReportRepository.js), [server/src/repositories/reporting/mongoReportRepository.js](/d:/projects/2025/condo-project/app/server/src/repositories/reporting/mongoReportRepository.js) | Repository abstraction exists only for reporting, and the Mongo provider is still a placeholder. |
| Config / auth wiring | [server/src/config/db.js](/d:/projects/2025/condo-project/app/server/src/config/db.js), [server/src/config/mysql.js](/d:/projects/2025/condo-project/app/server/src/config/mysql.js), [server/src/config/passport.js](/d:/projects/2025/condo-project/app/server/src/config/passport.js), [server/src/middleware/authMiddleware.js](/d:/projects/2025/condo-project/app/server/src/middleware/authMiddleware.js) | JWT signing logic is split between auth controller and Passport config. OAuth provider wiring, redirect rules, and user upsert behavior are coupled inside Passport setup. |
| Reporting schema / SQL views | [server/src/reports.catalog.js](/d:/projects/2025/condo-project/app/server/src/reports.catalog.js), [server/db/mysql/init/01_schema.sql](/d:/projects/2025/condo-project/app/server/db/mysql/init/01_schema.sql), [server/db/mysql/init/04_role_views.sql](/d:/projects/2025/condo-project/app/server/db/mysql/init/04_role_views.sql) | Report IDs and response envelopes are API-facing contracts, but the real read model lives in MySQL views and catalog metadata. |

Key mixed-responsibility spots:
- `server/server.js`: platform, runtime, health, static hosting, and startup orchestration are all mixed.
- `authRoutes.js`: route definitions, OAuth error formatting, and redirect decisions are mixed.
- `passport.js`: provider config, user lookup/upsert, JWT issuance, and Graph fallback are mixed.
- `condoController.js`: report-like read logic for manager/board summaries is still inside the condo controller instead of a domain/service layer.

## 3. Cross-Cutting Concerns

| Concern | Current repo shape | DTO / module candidates |
|---|---|---|
| Auth / session / JWT / OAuth | Client stores session in [AuthContext.jsx](/d:/projects/2025/condo-project/app/client/src/components/AuthContext.jsx). Server issues JWTs in [authController.js](/d:/projects/2025/condo-project/app/server/src/controllers/authController.js) and [passport.js](/d:/projects/2025/condo-project/app/server/src/config/passport.js). OAuth starts and callbacks live in [authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js). | `AuthUser`, `SessionUser`, `JwtPayload`, `LoginResponse`, `OAuthRedirectContract` |
| Reporting / MySQL provider logic | Role-aware catalog and provider switching live in [reportingService.js](/d:/projects/2025/condo-project/app/server/src/services/reportingService.js). Client report execution and filter handling live in [ReportRunner.jsx](/d:/projects/2025/condo-project/app/client/src/components/ReportRunner.jsx). | `ReportCatalogItem`, `ReportFilters`, `ReportResponse<T>`, `ReportProvider` |
| Mongo operational data vs MySQL reporting data | Mongo owns users, units, payments, work orders. MySQL owns reporting views and supporting lookup tables. This split already exists in [server/src/models](/d:/projects/2025/condo-project/app/server/src/models), [server/src/repositories/reporting](/d:/projects/2025/condo-project/app/server/src/repositories/reporting), and [server/db/mysql/init](/d:/projects/2025/condo-project/app/server/db/mysql/init). | Anti-corruption layer between operational models and reporting read models |
| Shared response shapes | `/api/health`, auth login/me, manager/board report pages, and `/api/reports/*` all expose reusable shapes but there is no shared contract package yet. | `HealthResponse`, `ApiError`, `ManagerMonthlyReport`, `BoardMonthlySnapshot` |
| Env / config dependencies | Vite proxy and API URL: [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js), [client/src/components/apiClient.jsx](/d:/projects/2025/condo-project/app/client/src/components/apiClient.jsx). Server env + DB/auth config: [server/server.js](/d:/projects/2025/condo-project/app/server/server.js), [server/src/config](/d:/projects/2025/condo-project/app/server/src/config). | typed env readers for client/server, `PlatformConfig` |
| Runtime contracts | `/api/health`, Vite `/api` proxy, OAuth callback URLs, static serving, and launcher health polling tie together Docker, backend, frontend, and Electron. | keep under platform/infrastructure until deliberate redesign |

Do-not-regress contracts:
- `/api/health` in [server/server.js](/d:/projects/2025/condo-project/app/server/server.js)
- OAuth/social login flow across [client/src/pages/LoginPage.jsx](/d:/projects/2025/condo-project/app/client/src/pages/LoginPage.jsx), [client/src/pages/SocialLoginHandler.jsx](/d:/projects/2025/condo-project/app/client/src/pages/SocialLoginHandler.jsx), and [server/src/routes/authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js)
- Vite `/api` proxy in [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js) and [docker-compose.dev.yml](/d:/projects/2025/condo-project/app/docker-compose.dev.yml)
- Reporting response shapes in [server/src/controllers/reportController.js](/d:/projects/2025/condo-project/app/server/src/controllers/reportController.js)
- Desktop/launcher assumptions in [docker-compose.desktop.yml](/d:/projects/2025/condo-project/app/docker-compose.desktop.yml) and [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js)

## 4. Recommended Future Module Ownership

| Target module | Own this | Pull from current files |
|---|---|---|
| `auth` | login/register/me, JWT issuance/validation, provider entry points, callback handling | [server/src/routes/authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js), [server/src/controllers/authController.js](/d:/projects/2025/condo-project/app/server/src/controllers/authController.js), [server/src/config/passport.js](/d:/projects/2025/condo-project/app/server/src/config/passport.js), [client/src/components/AuthContext.jsx](/d:/projects/2025/condo-project/app/client/src/components/AuthContext.jsx) |
| `users` | user persistence, role/profile/provider identity metadata | [server/src/models/User.js](/d:/projects/2025/condo-project/app/server/src/models/User.js) |
| `condos` | units, properties/building reference data, condo-facing summary APIs | [server/src/models/CondoUnit.js](/d:/projects/2025/condo-project/app/server/src/models/CondoUnit.js), [server/src/routes/condoRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/condoRoutes.js) |
| `issues` / `work-orders` / `maintenance` | work orders and maintenance operations, issue lifecycle | [server/src/models/WorkOrder.js](/d:/projects/2025/condo-project/app/server/src/models/WorkOrder.js), manager report surfaces in [server/src/controllers/condoController.js](/d:/projects/2025/condo-project/app/server/src/controllers/condoController.js) |
| `reports` | report catalog, filter lookups, provider adapters, report execution, SQL view binding, report UI | [server/src/reports.catalog.js](/d:/projects/2025/condo-project/app/server/src/reports.catalog.js), [server/src/services/reportingService.js](/d:/projects/2025/condo-project/app/server/src/services/reportingService.js), [server/src/repositories/reporting](/d:/projects/2025/condo-project/app/server/src/repositories/reporting), [client/src/components/ReportRunner.jsx](/d:/projects/2025/condo-project/app/client/src/components/ReportRunner.jsx) |
| `admin` / `dashboard` | orchestration and role-based landing/read models, not persistence | [client/src/pages/Dashboard.jsx](/d:/projects/2025/condo-project/app/client/src/pages/Dashboard.jsx), role gating in [client/src/App.jsx](/d:/projects/2025/condo-project/app/client/src/App.jsx) |
| `shared` | DTOs, API envelopes, auth/report types, error shapes | new TS contracts built from existing auth and report payloads |
| `platform` / `infrastructure` | env/config, db clients, health, static serving, launcher/runtime contracts, proxy-sensitive integration rules | [server/server.js](/d:/projects/2025/condo-project/app/server/server.js), [server/src/config](/d:/projects/2025/condo-project/app/server/src/config), [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js), [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js) |

Suggested directory direction:
- `client/src/app`, `client/src/features/auth`, `client/src/features/dashboard`, `client/src/features/reports`, `client/src/shared`
- `server/src/platform`, `server/src/shared`, `server/src/modules/auth|users|condos|issues|reports|admin`, and a temporary `server/src/legacy-express`

## 5. Migration Guidance

| Question | Recommendation |
|---|---|
| Best candidate module for PR2 or PR3 | `reports` |
| Why `reports` first | It already has the cleanest backend seam: route -> controller -> service -> repository, and its frontend is clearly identifiable. It is the lowest-risk place to introduce shared TS DTOs and module ownership without touching auth/runtime contracts. |
| Leave late | `auth`, `server/server.js`, Docker/runtime contracts, launcher-facing behavior, and any split-service decision |
| Suggested extraction order | `reports` -> `shared DTOs/platform config` -> `users` -> `condos` -> `issues/work-orders` -> `dashboard/admin orchestration` -> `auth` -> runtime/bootstrap reshaping |
| Main risks for Nest migration | single-origin assumption, OAuth redirects, `/api/health`, static file serving from Express, launcher polling, Mongo+MySQL split, and user ownership still being embedded inside auth |

Practical sequencing:
1. PR2: create shared TS contract files for auth/report/env payloads and start shaping `reports` ownership without changing runtime behavior.
2. PR3: extract reporting catalog/provider/repository types and optionally move reporting files into a module-shaped folder while still mounted by Express.
3. Later: separate `users` from `auth`, then carve out `condos` and `issues`.
4. Much later: mount Nest in-process behind the current backend service, starting with `reports`.

## 6. Output Notes

### PR Readiness Checklist
- [x] No code changes made
- [x] Current ownership mapped
- [x] Future ownership proposed
- [x] Risks and sequencing documented

### Post-Implementation Notes
- Files inspected:
  - [client/src](/d:/projects/2025/condo-project/app/client/src)
  - [server/src](/d:/projects/2025/condo-project/app/server/src)
  - [server/db/mysql/init](/d:/projects/2025/condo-project/app/server/db/mysql/init)
  - [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js)
  - [docker-compose.dev.yml](/d:/projects/2025/condo-project/app/docker-compose.dev.yml)
  - [docker-compose.desktop.yml](/d:/projects/2025/condo-project/app/docker-compose.desktop.yml)
  - [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js)
- Key findings:
  - The repo is still reporting-heavy, and reporting is the clearest modular seam.
  - Auth is the most cross-cutting and least attractive early migration target.
  - Runtime/platform concerns are tightly coupled around a single app origin and health endpoint.
  - Admin is not a real module yet; it is currently a role overlay on reporting and dashboard paths.
- Recommended next PR:
  - Add shared TS contracts for report payloads, auth/session/JWT payloads, and env/config types, then begin report-module extraction planning without changing any runtime routes.
