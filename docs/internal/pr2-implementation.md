# Implementation

Added a new shared type-only contracts layer at [shared/contracts](/d:/projects/2025/condo-project/app/shared/contracts) for the safest existing seams: auth/session/JWT payloads, report DTOs and envelopes, and low-risk env/config contracts. I also updated the existing client and server TS configs to typecheck those shared files, and tightened [client/src/vite-env.d.ts](/d:/projects/2025/condo-project/app/client/src/vite-env.d.ts:1) so the client env shape comes from the shared contract.

This PR does not change runtime behavior. No JS runtime files import these contracts yet, and there were no route/controller/auth/Docker/launcher changes.

# Files Changed

- [shared/contracts/auth.ts](/d:/projects/2025/condo-project/app/shared/contracts/auth.ts:1): added shared auth roles, providers, JWT claims, login/register request types, auth success response, `/auth/me` response shape, and generic message response.
- [shared/contracts/reports.ts](/d:/projects/2025/condo-project/app/shared/contracts/reports.ts:1): added report provider/filter/catalog/query/response types plus existing manager and board monthly DTOs.
- [shared/contracts/env.ts](/d:/projects/2025/condo-project/app/shared/contracts/env.ts:1): added client env, server runtime env, Mongo config, and MySQL config contracts.
- [shared/contracts/index.ts](/d:/projects/2025/condo-project/app/shared/contracts/index.ts:1): added a simple barrel export for future shared imports.
- [client/tsconfig.json](/d:/projects/2025/condo-project/app/client/tsconfig.json:1): expanded `include` so client typecheck covers the shared contracts folder.
- [server/tsconfig.json](/d:/projects/2025/condo-project/app/server/tsconfig.json:1): expanded `include` so server typecheck covers the shared contracts folder.
- [client/src/vite-env.d.ts](/d:/projects/2025/condo-project/app/client/src/vite-env.d.ts:1): now extends the shared client env contract.

# Validation Performed

Validated:
- `npm run typecheck` at repo root
- `npm run build` in `client`

What that proved:
- client and server TS configs both typecheck the new shared contracts successfully
- the client production build still succeeds after the shared-contract and env-typing changes

Not validated:
- server runtime boot
- Docker/compose flows
- auth/OAuth behavior in browser
- launcher/runtime packaging

# Risks / Follow-Ups

The main current API inconsistency is still present and intentionally unchanged:
- login/register return `user.id`
- `/api/auth/me` returns a more document-shaped `user` with `_id` and extra persistence fields

I documented that mismatch in [shared/contracts/auth.ts](/d:/projects/2025/condo-project/app/shared/contracts/auth.ts:42) instead of normalizing behavior in this PR. There are also a few shape ambiguities still worth cleaning up later:
- `provider` is returned in auth responses but not embedded in the JWT
- social login reconstructs `provider` from the query string
- report rows are intentionally typed as `Record<string, unknown>` because the SQL-view shapes are dynamic

# Recommendation For The Next PR

PR3 should stay focused on contract adoption, not framework migration yet. The best next step is to start using these shared contracts in the lowest-risk seams first:
- type the report catalog / filters / run-report flow against [shared/contracts/reports.ts](/d:/projects/2025/condo-project/app/shared/contracts/reports.ts:1)
- type the client auth/session flow against [shared/contracts/auth.ts](/d:/projects/2025/condo-project/app/shared/contracts/auth.ts:1)
- optionally add small mapper/normalizer helpers around `/auth/me` and report responses before any module extraction
