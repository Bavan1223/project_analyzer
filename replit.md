# Project Auditor

Project Auditor accepts a project description and ZIP archive, inspects the codebase, and returns an evidence-backed AI engineering review with prioritized actions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `OPENAI_API_KEY` — server-side key for the configured OpenAI-compatible provider
- Optional env: `OPENAI_BASE_URL`, `OPENAI_MODEL` — provider endpoint and model override

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/project-auditor/` — responsive review workspace and project ZIP upload flow
- `artifacts/api-server/src/routes/analyses.ts` — archive inspection, AI review, and report APIs
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/db/src/schema/analyses.ts` — persisted review report schema
- `artifacts/project-auditor/src/index.css` — workspace visual system

## Architecture decisions

- The first release stores structured reports, not uploaded archive bytes; ZIP contents are inspected in a temporary server directory and removed after the request.
- Archive inspection excludes dependency/build/version-control directories and sends a bounded evidence window to the model to protect latency and context limits.
- AI output is required to be JSON-shaped and is validated against the generated API response contract before persistence.
- The dashboard is backed by real API and database data, with a seeded report so the workspace is useful on first open.

## Product

- Submit a project name, description, optional goals, and complete ZIP archive.
- Review overall health, category scores, strengths, executive summary, and prioritized findings.
- Open past reports from a dashboard with counts for critical and high-severity issues.
- Route the AI request through an OpenAI-compatible provider using a server-side secret.

## User preferences

- The user wants the reviewer to reason at an expert, top-1% engineering level and inspect the entire uploaded project rather than rely on a short description.

## Gotchas

- The AI provider may expose models in its catalog that are blocked by project policy; keep `OPENAI_MODEL` configurable instead of hardcoding an unavailable model.
- ZIP uploads are limited to 50 MB and the evidence sent to the model is intentionally bounded; larger-repository support should move to an asynchronous chunked pipeline.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
