# Session Handoff — BulkPrice

## Current Objective

- Goal: BulkPrice — a Shopify bulk price editor that demonstrates the Harness/AI methodology (course final project).
- Current status: **app is feature-complete & verified offline.** feat-001/002/003/004/007/008/009 **passing**; feat-005 in_progress, feat-006 not_started (both need a live dev store). `bash init.sh` → HARNESS GREEN; **29/29 tests**.
- Branch / commit: `feat/bulkprice-app` == remote `submit`/`main` (github.com/khacnghiem67/shopify-app), latest `ce24de6`. Working tree clean.

## The ONE remaining task (needs the user)

The live-store demo (feat-005/006) — requires a Shopify **Partner dev store**:
1. `npm run dev` (the dev fix `shopify.web.toml` is in place; app loads embedded — NOT the grey placeholder).
2. Select products → −20% → Apply → confirm new price + strikethrough compare-at in Shopify admin.
3. Save before/after screenshots to `docs/demo/`, set feat-005/006 `passing` with that evidence, commit + push.

## What exists now

- **App:** official Shopify Remix template (Remix 2 + Polaris 12 + Prisma). Route `app/routes/app._index.tsx` = loader (Admin GraphQL `products` read) + Polaris UI (select, rule form, search, live preview) + action (`productVariantsBulkUpdate` write).
- **Pure logic (tested):** `app/lib/pricing.ts` (percentage + fixed-amount + round-.99 + compare-at + money parse/format), `app/lib/filter.ts` (search). 29 Vitest tests.
- **Harness:** `AGENTS.md`/`CLAUDE.md`, `init.sh`, `feature_list.json`, `claude-progress.md`, this file, `docs/PRODUCT.md` + `docs/ARCHITECTURE.md`. Spec + plan + task briefs under `docs/superpowers/` and `.superpowers/sdd/`.
- **Hooks/permissions (committed):** `.claude/settings.json` allowlist + `PostToolUse` hook `.claude/hooks/test-on-code-change.sh` (auto-runs Vitest on `app/**.ts(x)` edits).
- **Presentation:** `docs/PRESENTATION.md` (English, 6 answers) + `docs/presentation.html` (12-slide **Vietnamese** deck, author Bùi Đình Dự). Submission: repo link + presentation.html + PRESENTATION.md.

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Full chain | `bash init.sh` | HARNESS GREEN |
| Tests | `npm run test` | 29/29 passing |
| Typecheck / lint / build | `npm run typecheck` · `lint` · `build` | clean / clean / ok |

> Note: running `bash init.sh` while `npm run dev` is active can EPERM at `prisma generate` (dev holds the engine DLL). Stop dev first, or run the four checks directly.

## Blockers / Risks

- Live store demo needs a Partner dev store + linked app (already linked: "Du-demo", scope `write_products`).
- `npm audit` shows template-inherited vulnerabilities (out of scope for the demo).

## Next Session Startup

1. Read `AGENTS.md`, then `feature_list.json` + `claude-progress.md` + this file.
2. `bash init.sh` (expect HARNESS GREEN) — stop any `npm run dev` first.
3. If continuing: either do the live-store demo (feat-005/006) or keep polishing `docs/presentation.html`. Optional: final whole-branch code review of the route.
