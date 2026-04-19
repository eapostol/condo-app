# Unified TS Adoption

The safest target architecture is a TypeScript-first monolith with one public origin and one backend process for now: keep React/Vite on the frontend, keep the current Express app as the request owner, and introduce NestJS later inside the existing backend service rather than as a separate Docker service. That avoids breaking the current contracts around `/api/health`, Vite proxying, OAuth callbacks, Electron launcher health checks, and production static serving from the Node container. Concretely, the current pressure points are [server/server.js](/d:/projects/2025/condo-project/app/server/server.js:63), [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js:5), [docker-compose.dev.yml](/d:/projects/2025/condo-project/app/docker-compose.dev.yml:31), [docker-compose.desktop.yml](/d:/projects/2025/condo-project/app/docker-compose.desktop.yml:3), [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js:7), and [server/src/routes/authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js:88).

A good target folder shape is:
```text
client/src/
  app/
  shared/
    api/
    types/
    ui/
    utils/
  features/
    auth/
    dashboard/
    admin/
    reports/
    condos/
    issues/
    users/

server/src/
  platform/
  shared/
  modules/
    auth/
    users/
    condos/
    issues/
    reports/
    admin/
  legacy-express/
```
For boundaries, `auth` should own login/OAuth/JWT, `users` should separate user persistence from auth, `condos` should own units/properties, `issues` should own work-order/maintenance concerns, `reports` should own catalog/filter/provider adapters, and `admin/dashboard` should be orchestration/read models. Today those concerns are still concentrated in [client/src/App.jsx](/d:/projects/2025/condo-project/app/client/src/App.jsx:11), [client/src/components/AuthContext.jsx](/d:/projects/2025/condo-project/app/client/src/components/AuthContext.jsx:5), [client/src/components/ReportRunner.jsx](/d:/projects/2025/condo-project/app/client/src/components/ReportRunner.jsx:5), [server/src/controllers/authController.js](/d:/projects/2025/condo-project/app/server/src/controllers/authController.js:8), [server/src/config/passport.js](/d:/projects/2025/condo-project/app/server/src/config/passport.js:27), [server/src/controllers/condoController.js](/d:/projects/2025/condo-project/app/server/src/controllers/condoController.js:5), [server/src/services/reportingService.js](/d:/projects/2025/condo-project/app/server/src/services/reportingService.js:1), and [server/src/models/WorkOrder.js](/d:/projects/2025/condo-project/app/server/src/models/WorkOrder.js:3).

Recommended migration phases:
1. Add repo TS foundations only: root `tsconfig.base.json`, package `tsconfig.json` files, `typecheck` scripts, TS dev deps, `allowJs`, `noEmit`, `moduleResolution: NodeNext`.
2. Add shared contracts before file renames: auth/JWT types, report DTOs, env/config types, API response types.
3. Convert lowest-risk leaf areas first: frontend bootstrap/API helpers, backend reporting catalog/config/repositories/service.
4. Extract module-shaped folders while Express still serves everything.
5. Introduce Nest in-process and migrate `reports` first, because it already has the cleanest controller -> service -> repository seam.
6. Migrate `users`, `condos`, `issues`, then `auth`; leave [server/server.js](/d:/projects/2025/condo-project/app/server/server.js:1), Docker wiring, and launcher-facing contracts late.
7. Revisit a separate Nest service only after you intentionally redesign launcher, compose, proxy, callback, and static-serving contracts.

Immediate risks and do-not-regress areas:
- `/api/health` used by the launcher at [server/server.js](/d:/projects/2025/condo-project/app/server/server.js:68) and [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js:428)
- OAuth start/callback and `social-login` token redirect flow in [server/src/routes/authRoutes.js](/d:/projects/2025/condo-project/app/server/src/routes/authRoutes.js:93) and [client/src/pages/SocialLoginHandler.jsx](/d:/projects/2025/condo-project/app/client/src/pages/SocialLoginHandler.jsx:11)
- Vite `/api` proxy behavior in [client/vite.config.js](/d:/projects/2025/condo-project/app/client/vite.config.js:11)
- Single-service desktop/runtime assumptions in [docker-compose.desktop.yml](/d:/projects/2025/condo-project/app/docker-compose.desktop.yml:4) and [launcher/main.js](/d:/projects/2025/condo-project/app/launcher/main.js:393)
- Reporting response shape and provider/filter behavior in [server/src/reports.catalog.js](/d:/projects/2025/condo-project/app/server/src/reports.catalog.js:1), [server/src/controllers/reportController.js](/d:/projects/2025/condo-project/app/server/src/controllers/reportController.js:1), and [server/src/repositories/reporting/mysqlReportRepository.js](/d:/projects/2025/condo-project/app/server/src/repositories/reporting/mysqlReportRepository.js:1)
- Mongo/MySQL domain split: auth and operational data are Mongo, but reporting filters/views are MySQL

First PR recommendation: `chore(ts): add repo TypeScript scaffolding with no runtime behavior changes`. Smallest safe touch set is [package.json](/d:/projects/2025/condo-project/app/package.json:1), [client/package.json](/d:/projects/2025/condo-project/app/client/package.json:1), [server/package.json](/d:/projects/2025/condo-project/app/server/package.json:1), optional [launcher/package.json](/d:/projects/2025/condo-project/app/launcher/package.json:1), plus new `tsconfig.base.json`, `client/tsconfig.json`, `server/tsconfig.json`, optional `launcher/tsconfig.json`, and `client/src/vite-env.d.ts`. I would not touch Express routes, Dockerfiles, compose files, launcher code, or auth/runtime code in PR 1. Rollback should just be reverting that scaffolding commit.

No code changes were made in this pass. If you approve, the next step can be an implementation-ready PR plan or the actual first PR.

<oai-mem-citation>
<citation_entries>
MEMORY.md:27-35|note=[used repo-specific auth and docker routing guardrails to avoid risky migration recommendations]
MEMORY.md:296-296|note=[used prior note that reporting spans Mongo and MySQL in this repo]
</citation_entries>
<rollout_ids>
019d92a5-4a60-7200-a750-d9124f2f6860
</rollout_ids>
</oai-mem-citation>
