# BulkPrice — Demo & Presentation

> Final project for the *Harness Design, Team Adoption & Cross-Model* course.
> This file answers the six end-of-course questions and gives a live demo script.
> Repo: https://github.com/khacnghiem67/shopify-app

---

## 1. What is the app's goal?

**BulkPrice** is an embedded Shopify admin app that lets a merchant change prices
on many products at once — e.g. run a "20% off" sale in a few clicks instead of
editing products one by one.

The merchant selects products, picks a rule (percentage change, optional
**round to .99**, optional **set compare-at to original** so a strikethrough
"sale" price shows), previews the before→after table, and clicks **Apply**.

The app is deliberately small. Its real purpose is to demonstrate the **harness
engineering** methodology from the course on a real, working Shopify app.

## 2. Which course knowledge was applied?

| Course concept | Where it shows up in this repo |
|---|---|
| **5-subsystem harness** | Guidance (`AGENTS.md`/`CLAUDE.md`/`docs/`), Environment (`init.sh`, `.nvmrc`, `package.json`, `package-lock.json`), State (`feature_list.json`, `claude-progress.md`), Feedback (`init.sh` verify chain), Lifecycle (`session-handoff.md`) |
| **Repo is the spec / source of truth** | `AGENTS.md` is canonical; `CLAUDE.md` is a thin stub pointing to it |
| **Planning before code** | Committed design **spec** then implementation **plan** under `docs/superpowers/` |
| **Delegation** | Each feature built by a fresh **implementer subagent**, checked by a separate **reviewer subagent** (separate the doer from the checker) |
| **Prompt / context engineering** | Each subagent got a focused *task brief* file, not the whole plan — curated context, clean controller context |
| **Verification & TDD** | `app/lib/pricing.ts` written **test-first** (RED→GREEN), 18 Vitest tests; `init.sh` runs typecheck + lint + test + build |
| **Evidence-gated "done"** | A feature is `passing` only with real command output pasted into `feature_list.json` — never a feeling |
| **Guardrails** | One active feature at a time; DAG dependencies; pure pricing module with zero framework imports; `.env` never committed; secrets kept out of git history |
| **Harness as shared infra** | `init.sh` green is the merge gate; everything reviewed in PR like code |

## 3. How did AI (Claude Code) help during the build?

- **Scaffolding the harness**: turned a placeholder template into a real,
  app-specific harness (AGENTS.md, feature_list DAG, init.sh, docs).
- **Test-first core logic**: wrote the failing Vitest suite first, then the pure
  `pricing.ts` to make it green.
- **Authoring + schema-validating the Admin GraphQL**: the `products` query and
  `productVariantsBulkUpdate` mutation were validated against the live Shopify
  schema (API 2026-04) *before* being written into the code.
- **Driving the loop**: act → run `init.sh` → read failures → fix → repeat, with
  evidence recorded at each step.
- **Catching real bugs** (see §5) that a naive "just generate code" run would have
  shipped broken.

## 4. What results were achieved?

- A working embedded Shopify app on the official Remix template (Remix + Polaris +
  Prisma), buildable from a clean checkout with one command.
- **`bash init.sh` → HARNESS GREEN**: Node check, install, prisma generate,
  typecheck (0 errors), lint (clean), **18/18 unit tests**, build — all pass.
- Feature status (`feature_list.json`):
  - feat-001 Scaffold + green harness — **passing**
  - feat-002 Pure pricing rules + tests — **passing**
  - feat-003 Products loader (read) — **passing**
  - feat-004 Polaris UI + live preview — **passing**
  - feat-005 Apply (write) — **code complete, builds; live store demo pending**
  - feat-006 Polish + demo screenshots — pending live store
  - feat-007 Docs + this presentation — **passing**
- A clean commit history that *is* the methodology story (spec → plan →
  feat-001 → feat-002 → route → docs), each commit evidence-backed.

## 5. Difficulties encountered and how they were handled

1. **`create-app` is interactive** — the Shopify CLI scaffolder demands an
   interactive Partner-org selection and login, so it can't run headless.
   → Cloned the official template repo directly (identical code), leaving
   org/store linking as the merchant's manual step.
2. **Dependency version drift** — the template's `^` ranges resolved
   `@shopify/shopify-api` to *two* versions (12.3.0 + 13.1.0), which broke the
   Prisma session-storage `Session` types and failed typecheck.
   → Pinned `@shopify/shopify-api` to 13.1.0 via `overrides`/`resolutions`.
3. **ESLint crash once tests existed** — `@remix-run/eslint-config` pulls in
   `eslint-plugin-jest`, which crashed trying to detect a Jest version on
   `*.test.ts` files (we use Vitest, not Jest).
   → Pinned the jest version in `.eslintrc.cjs` settings.
4. **`node_modules` corruption** — running two `npm install`s concurrently
   corrupted the dependency tree (EPERM/ENOENT on Windows).
   → Learned the lesson: one install at a time; clean reinstall fixed it.
5. **A secret in course material blocked the push** — GitHub secret-scanning
   found a Stripe-key-shaped string inside a course *slide* (`ai-security-slides.html`)
   that had been committed with the docs.
   → Did **not** bypass push protection; purged that file from the entire git
   history and re-pushed cleanly.

## 6. Lessons learned

- **The harness pays for itself.** Because `init.sh` ran the full verify chain,
  each of the bugs above surfaced immediately with a clear message instead of
  hiding until the demo.
- **Evidence-gating prevents "looks done."** Forcing real command output into
  `feature_list.json` kept feat-005 honestly marked *in_progress* (its real gate
  is a live store write) instead of falsely "passing."
- **Curated context beats dumping everything.** Subagents given a one-task brief
  produced focused, reviewable changes and kept the main thread's context clean.
- **Repo-as-spec extends to dependencies and secrets.** Pinning versions and
  keeping secrets out of history are part of the Environment/Guidance subsystems,
  not afterthoughts.

---

## Live demo script (~2 min)

Prerequisite (one time): a Shopify **Partner dev store** with a few products.

```bash
nvm use                 # Node 22
bash init.sh            # prove HARNESS GREEN first (typecheck/lint/test/build)
npm run config:link     # link the app to your Partner org/app  (interactive)
npm run dev             # opens the embedded app in your dev store
```

In the app:
1. Show the product list (loaded via Admin GraphQL).
2. Select 2–3 products.
3. Set **-20%**, toggle **Round to .99** and **Set compare-at to original**.
4. Point out the **before → after** preview updating live.
5. Click **Apply to N products** → success banner (updated / skipped).
6. Open one product in Shopify admin → show the new price + strikethrough
   compare-at "sale" price.

> Capture before/after screenshots into `docs/demo/` — that is the recorded
> evidence for feat-005 / feat-006.

## Where to look in the repo

- Harness: `AGENTS.md`, `init.sh`, `feature_list.json`, `claude-progress.md`, `session-handoff.md`
- Spec & plan: `docs/superpowers/specs/`, `docs/superpowers/plans/`
- Pure logic + tests: `app/lib/pricing.ts`, `app/lib/pricing.test.ts`
- The app route (read + UI + write): `app/routes/app._index.tsx`
- Product / architecture detail: `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`
