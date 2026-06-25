# Progress Log — BulkPrice

## Current Verified State

- Repository root: shopify-app (branch `feat/bulkprice-app`)
- App: official Shopify Remix template (Remix 2 + Polaris 12 + Prisma) → BulkPrice bulk price editor
- Standard startup + verification path: `bash init.sh` (Node 22 → install → prisma generate → typecheck → lint → test → build)
- Last verification: **HARNESS GREEN** (2026-06-25)
- Current highest-priority unfinished feature: **feat-002** (pricing core + Vitest tests)
- Current blocker: none

## Session Log

### Session 002 — Build BulkPrice (2026-06-25)

- Goal: implement the BulkPrice Shopify app per the plan, demonstrating the harness methodology.
- Completed:
  - **feat-001 (passing)**: scaffolded the Shopify Remix app (cloned the official template, since `create-app` needs interactive Partner-org selection), copied it into the repo preserving harness files, rewrote `AGENTS.md`/`feature_list.json`/`init.sh`, added `docs/PRODUCT.md` + `docs/ARCHITECTURE.md`, added `.nvmrc` (22) and `typecheck`/`test` scripts + `vitest` devDep.
  - Wrote design spec + implementation plan under `docs/superpowers/`.
- Verification run: `bash init.sh` → HARNESS GREEN (see feat-001 evidence).
- Key fix: pinned `@shopify/shopify-api` to `13.1.0` via `overrides`/`resolutions` — the template's `^` ranges pulled two copies (12.3.0 + 13.1.0), which broke `PrismaSessionStorage` `Session` typing.
- Known risk: `npm audit` reports vulnerabilities inherited from the template (not addressed; out of scope for the demo). The live store path (`npm run dev`) needs a Partner dev store — manual demo step.
- Next best step: **feat-002** — implement `app/lib/pricing.ts` (pure functions) test-first with Vitest.
