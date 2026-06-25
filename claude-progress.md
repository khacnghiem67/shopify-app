# Progress Log — BulkPrice

## Current Verified State

- Repository root: shopify-app (branch `feat/bulkprice-app`)
- App: official Shopify Remix template (Remix 2 + Polaris 12 + Prisma) → BulkPrice bulk price editor
- Standard startup + verification path: `bash init.sh` (Node 22 → install → prisma generate → typecheck → lint → test → build)
- Last verification: **HARNESS GREEN** (2026-06-25); feat-002 tests 18/18 + typecheck clean (2026-06-26)
- Current highest-priority unfinished feature: **feat-003** (products loader — Admin GraphQL read)
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
- **feat-002 (passing)**: implemented `app/lib/pricing.ts` (pure, framework-free) test-first with Vitest — percentage / round-to-.99 / set-compare-at / money parse+format, clamp ≤0 → 0.01. Subagent-driven: implementer (commit 05f14e0) → task review (spec ✅, quality approved) → post-review hardening (empty-string guard + 3 tests, 18/18). 
- Next best step: **feat-003** — products loader in `app/routes/app._index.tsx` via Admin GraphQL `products` query (brief ready at `.superpowers/sdd/task-3-brief.md`). Then feat-004 (Polaris UI + preview) and feat-005 (Apply via `productVariantsBulkUpdate`) — both edit the same route; consider building 003+004+005 as one route task. The plan, all task briefs (2–5), and the SDD ledger are in `docs/superpowers/` and `.superpowers/sdd/`.
