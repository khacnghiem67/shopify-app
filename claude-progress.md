# Progress Log — BulkPrice

## Current Verified State

- Repository root: shopify-app (branch `feat/bulkprice-app`)
- App: official Shopify Remix template (Remix 2 + Polaris 12 + Prisma) → BulkPrice bulk price editor
- Standard startup + verification path: `bash init.sh` (Node 22 → install → prisma generate → typecheck → lint → test → build)
- Last verification (2026-06-26): typecheck 0 · lint clean · **29/29 tests** · build ✓. (`bash init.sh` also runs `prisma generate`, which can EPERM if `npm run dev` is holding the engine DLL — stop dev first, or run the four checks directly.)
- Features passing: feat-001, 002, 003, 004, 007, 008 (search/filter), 009 (fixed-amount rule). feat-005 in_progress, feat-006 not_started.
- Current highest-priority unfinished feature: **feat-005/006** — code complete & builds; only the **live store write demo + screenshots** remain (needs a Partner dev store).
- Current blocker: none for offline work; live demo requires the user's dev store.
- Remote: pushed to `submit` = https://github.com/khacnghiem67/shopify-app, branch `main`. Latest commit `ce24de6`. Local branch `feat/bulkprice-app` == remote `main`.
- Runnability fix shipped: added `shopify.web.toml` (the clone lacked it) so `shopify app dev` serves the embedded app instead of the grey placeholder. `shopify.app.toml` is linked to the user's app "Du-demo" (client_id e349…), scope `write_products`.
- Hooks/permissions are genuinely applied (committed): `.claude/settings.json` has a `permissions.allow` allowlist + a `PostToolUse(Edit|Write)` hook → `.claude/hooks/test-on-code-change.sh` (auto-runs Vitest when an `app/**.ts(x)` file changes; node-parsed, never blocks). May need `/hooks` reload to activate in a live session.
- Presentation: `docs/presentation.html` = 12-slide **Vietnamese** deck built from `docs/PRESENTATION.md`, answering the 6 course questions (author: Bùi Đình Dự). Several plain-VN clarifications applied (guardrails, feature-status, test/build glosses); "khó khăn" reframed around working-with-AI.

## Session Log

### Session 005 — Presentation + hooks/permissions (2026-06-26)
- Created `docs/presentation.html` — 12-slide Vietnamese deck from PRESENTATION.md (title, mục tiêu, app làm gì, tính năng, Câu hỏi 2 knowledge ×2, AI hỗ trợ, kết quả, khó khăn, bài học, demo script, tổng kết). Author corrected to **Bùi Đình Dự**.
- Iterated slide wording per user: knowledge table maps every keyword + a "tự dựng harness (file lõi)" row; Guardrails defined plainly; "khó khăn" reframed to AI-process (not logic bugs); feature-status rewritten with plain VN names (dropped 001/002 IDs); plain-VN glosses for typecheck/lint/test/build.
- **Made hooks/permissions genuinely true** (was overclaimed): added committed `.claude/settings.json` permissions.allow + a PostToolUse test-on-change hook (`.claude/hooks/test-on-code-change.sh` + README), pipe-tested.
- All committed + pushed to `submit`/main (through `ce24de6`). Working tree clean.
- Remaining unchanged: feat-005/006 live store demo (needs the user's Partner dev store).

### Session 002 — Build BulkPrice (2026-06-25)

- Goal: implement the BulkPrice Shopify app per the plan, demonstrating the harness methodology.
- Completed:
  - **feat-001 (passing)**: scaffolded the Shopify Remix app (cloned the official template, since `create-app` needs interactive Partner-org selection), copied it into the repo preserving harness files, rewrote `AGENTS.md`/`feature_list.json`/`init.sh`, added `docs/PRODUCT.md` + `docs/ARCHITECTURE.md`, added `.nvmrc` (22) and `typecheck`/`test` scripts + `vitest` devDep.
  - Wrote design spec + implementation plan under `docs/superpowers/`.
- Verification run: `bash init.sh` → HARNESS GREEN (see feat-001 evidence).
- Key fix: pinned `@shopify/shopify-api` to `13.1.0` via `overrides`/`resolutions` — the template's `^` ranges pulled two copies (12.3.0 + 13.1.0), which broke `PrismaSessionStorage` `Session` typing.
- Known risk: `npm audit` reports vulnerabilities inherited from the template (not addressed; out of scope for the demo). The live store path (`npm run dev`) needs a Partner dev store — manual demo step.
- **feat-002 (passing)**: `app/lib/pricing.ts` pure rules, test-first with Vitest (18/18), reviewed + hardened.
- **feat-003 + feat-004 (passing)**: BulkPrice route in `app/routes/app._index.tsx` — loader reads products via Admin GraphQL; Polaris IndexTable selection + rule form + live before/after preview (using pricing.ts); empty-state + submitting states. typecheck + lint + build green (commit 4b74da3).
- **feat-005 (in_progress)**: Apply action (`productVariantsBulkUpdate`, server-side re-read, updated/skipped/errors banner) — code complete & builds; **live store write demo pending a Partner dev store**.
- **feat-007 (passing)**: `docs/PRESENTATION.md` (six course answers + demo script), README rewrite, `docs/demo/` placeholder.

### Session 004 — Extra features + fixes (2026-06-26)
- Added `shopify.web.toml` + restored `write_products` scope (fixes the grey "Find this app" placeholder; `app dev` had no web process to run).
- feat-008 product search/filter (pure `filterByTitle` + 5 tests + Polaris search box).
- feat-009 fixed-amount rule (pure `applyFixedAmount` + 6 tests + Operation dropdown). Suite now 29/29.
- UI fix: wrapped IndexTable price cells in `<Text>` (bare text was hidden on row hover); new price tints green when selected.
- All pushed to remote `submit`/main. Remaining: live store demo (feat-005/006).

### Session 003 — Route + docs (2026-06-26)
- Built feat-003/004/005 as one cohesive route (inline, after subagent runs were interrupted by process exits); verified typecheck/lint/build + full `init.sh` GREEN.
- Wrote feat-007 docs/presentation. Pushed to https://github.com/khacnghiem67/shopify-app (main).
- **Next best step / remaining**: the live-store demo for **feat-005 + feat-006** — run `npm run config:link` then `npm run dev` against a Partner dev store, do the -20% → Apply flow, capture before/after screenshots into `docs/demo/`, then set feat-005/006 `passing` with that evidence. A final whole-branch code review of the route is also recommended (SDD final gate).
