# BulkPrice — AGENTS.md

> Canonical entrypoint (system of record) for any AI agent (Claude Code, Codex,
> Cursor, ...). `CLAUDE.md` points back here. The repo is the spec: what is not
> in the repo does not exist. This is a map, not a manual.

## 1. What this is

**BulkPrice** is an embedded Shopify admin app that lets a merchant bulk-edit
product prices: select products → apply a rule (percentage change, optional
round-to-.99, optional set-compare-at-to-original) → preview before/after →
Apply. Product detail: `docs/PRODUCT.md`. Architecture: `docs/ARCHITECTURE.md`.

This app is also the final project for the *Harness Engineering* course: it is
built to demonstrate the 5-subsystem harness, evidence-gated "done", TDD, and
guardrails. See `docs/PRESENTATION.md` for the demo write-up.

## 2. Tech stack (FIXED — do not change)

- Official **Shopify Remix app template**: Remix 2 + Polaris 12 + App Bridge +
  `@shopify/shopify-app-remix` + Prisma (SQLite session storage).
- **Node 22** (see `.nvmrc`). Shopify CLI is the **local** dev-dependency — never
  require a global install.
- Admin GraphQL API. Access scope: **`write_products`** (in `shopify.app.toml`).
- Pure pricing logic lives in `app/lib/pricing.ts` with **zero** Shopify/Remix/
  Polaris imports, unit-tested with **Vitest**.

## 3. Startup (one path from a clean checkout)

```bash
nvm use            # Node 22 per .nvmrc
bash init.sh       # install + verify (typecheck + lint + test + build)
```

`init.sh` is green WITHOUT a connected store. The live store path is a manual
demo step: `npm run config:link` then `npm run dev`.

## 4. Working loop each session (act → observe → feedback)

1. Read `feature_list.json` — pick the highest-priority feature whose
   dependencies are all `passing`. **One active feature at a time.**
2. Read `claude-progress.md` for what the last session left.
3. Set that feature `in_progress`.
4. Implement. After each meaningful change, run the relevant verify command (§6).
5. When done: re-run the full verify chain and paste real output into the
   feature's `evidence`.
6. Update `feature_list.json` (`passing`), `claude-progress.md`,
   `session-handoff.md` so the next session resumes from `bash init.sh`.

## 5. Scope & feature order

Source of truth: `feature_list.json` (feat-001 → feat-007), a valid DAG. Do not
skip a dependency that is not yet `passing`.

## 6. Verification commands (run from repo root)

| Purpose | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests (Vitest) | `npm run test` |
| Build | `npm run build` |
| Full chain | `bash init.sh` |
| Run against a dev store (manual) | `npm run config:link` then `npm run dev` |

## 7. Definition of DONE (evidence required)

A feature is `passing` only when ALL are true:
- `npm run typecheck` clean (0 type errors).
- `npm run lint` clean.
- `npm run test` green (new tests cover new logic).
- `npm run build` succeeds.
- The `evidence` field in `feature_list.json` holds REAL command output — not a
  promise. **Separate the doer from the checker:** never self-declare done by
  feeling; paste verify output.

The store-write demo (feat-005) is verified manually against a dev store; its
evidence is the action result + before/after screenshots.

## 8. Hard constraints (constrain, don't micromanage)

- Do NOT change the tech stack, the `write_products` scope, or the package.json
  script names.
- Do NOT commit `.env` (secrets stay local; only non-secret config is committed).
- `app/lib/pricing.ts` stays pure (no framework imports) so it is unit-testable.
- Money from Shopify is a string; parse → compute → format to a 2-decimal string.
- Leave **clean state**: the next session only needs `bash init.sh`.

## 9. Escalation

- `npm run dev` needs a Partner org + dev store (interactive `config:link`). This
  is intentionally a manual step; `init.sh` never depends on it.
- Build/typecheck red without obvious cause: record a blocker in
  `claude-progress.md` + `session-handoff.md`. Do NOT mark the feature done.

## 10. Links

- Product: `docs/PRODUCT.md` · Architecture: `docs/ARCHITECTURE.md`
- Demo write-up: `docs/PRESENTATION.md`
- Spec: `docs/superpowers/specs/2026-06-25-bulkprice-shopify-app-design.md`
- Plan: `docs/superpowers/plans/2026-06-25-bulkprice-shopify-app.md`
- Feature state: `feature_list.json` · Log: `claude-progress.md` · Handoff: `session-handoff.md`
