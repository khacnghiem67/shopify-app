# BulkPrice — Shopify bulk price editor

An embedded **Shopify admin app** that lets a merchant change prices on many
products at once: select products → pick a rule (percentage change, optional
round-to-.99, optional set-compare-at-to-original) → preview before/after →
**Apply**. Built on the official Shopify Remix template (Remix + Polaris + App
Bridge + Prisma).

This is the final project for the *Harness Design, Team Adoption & Cross-Model*
course — it is built to demonstrate the AI-harness methodology (5 subsystems,
planning, TDD, evidence-gated "done", guardrails). See **`docs/PRESENTATION.md`**
for the demo write-up and the six course answers.

## Quick start

```bash
nvm use            # Node 22 (see .nvmrc)
bash init.sh       # install + verify: typecheck + lint + test + build -> HARNESS GREEN
```

`init.sh` is green **without** a connected store. To run the app live against a
Shopify **Partner dev store** (manual demo step):

```bash
npm run config:link   # link this app to your Partner org/app (interactive)
npm run dev           # opens the embedded app in your dev store
```

## How it's built

| Piece | File |
|---|---|
| Pure pricing logic (no framework imports) + tests | `app/lib/pricing.ts`, `app/lib/pricing.test.ts` |
| App route: loader (read) + Polaris UI + action (write) | `app/routes/app._index.tsx` |
| Admin GraphQL: `products` (read), `productVariantsBulkUpdate` (write) | see `docs/ARCHITECTURE.md` |

## The harness (course methodology)

| Subsystem | Artifact |
|---|---|
| Guidance | `AGENTS.md` / `CLAUDE.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` |
| Environment | `init.sh`, `.nvmrc`, `package.json`, `package-lock.json` |
| State | `feature_list.json`, `claude-progress.md` |
| Feedback | `init.sh` verify chain + Vitest; evidence required before `passing` |
| Lifecycle | `session-handoff.md` |

Design spec and step-by-step plan: `docs/superpowers/`.

## Status

`bash init.sh` → **HARNESS GREEN** (typecheck, lint, 18/18 tests, build).
feat-001…004 + feat-007 **passing**; feat-005/006 are code-complete and build,
with the live-store write demo + screenshots as the one remaining manual step
(needs a Partner dev store). See `feature_list.json`.
