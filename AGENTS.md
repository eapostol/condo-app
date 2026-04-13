# AGENTS.md

This file captures repo-specific working rules for AI coding agents operating in this project.

## Repo Intent

- This repository contains the condo portal application, supporting Docker-based local development, and an Electron launcher used to manage local startup and shutdown flows.
- Prefer small, targeted changes that preserve the existing product behavior unless the user explicitly requests broader refactors or UI changes.

## Internal Documentation Safety

- Treat internal planning, rollout, architecture, and implementation notes as developer-only by default.
- Place internal docs under `docs/internal/` unless the user explicitly requests another internal docs location.
- Architecture/reference docs may live under `docs/architecture/` when they are still developer-facing and not product-facing.
- Do not store internal docs in `client/public/`, `public/`, or any path that is directly served to end users.
- Do not add links, downloads, dashboard cards, menu items, launcher entries, or other UI exposure for internal docs unless the user explicitly asks for that product change.
- Do not change routes, API payloads, navigation, or page content to surface documentation unless explicitly requested.
- If a task asks for "documentation" and the destination is ambiguous, prefer returning the draft in chat or writing to `docs/internal/`.
- If documentation may be both internal and user-facing, stop and separate the outputs into two deliverables before making code changes.

## Safe Defaults For Documentation Tasks

- When asked to generate documentation from repo context, prefer analysis-only output first.
- If files are requested, write only to the explicitly approved docs location.
- If there is any uncertainty about whether a path is public or user-facing, treat it as user-facing and do not write documentation there.
- Never expose internal documents through the dashboard, downloads area, navbar, API responses, or launcher UI unless the user explicitly requests that product work.

## Product Surface Guardrails

- Treat `client/public/` and any downloadable/public asset path as user-facing.
- Treat dashboard content, launcher UI, navigation, menus, routes, and API-backed UI data as product surface area.
- Avoid user-visible changes when the request is about planning, architecture, internal process, or developer documentation only.

## Change Discipline

- Keep documentation changes separate from product changes whenever practical.
- If a request could reasonably imply both internal docs and app changes, confirm intent or limit the work to the internal-doc portion first.
- Prefer the smallest safe implementation that satisfies the request.
