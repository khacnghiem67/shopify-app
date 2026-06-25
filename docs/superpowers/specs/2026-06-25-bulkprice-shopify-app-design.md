# BulkPrice — Shopify Bulk Price Editor — Design Spec

- **Date:** 2026-06-25
- **Author:** brainstormed with Claude Code
- **Status:** Approved (pending written-spec review)
- **Course context:** Final project for the "Harness Design, Team Adoption & Cross-Model"
  course (`docs/index (1).html`, final slide). The grade rewards **clear logic + a
  working demo + visible Harness/AI methodology**, not app size.

## 1. Goal

An embedded Shopify admin app that lets a merchant bulk-edit product prices with a
few clicks. It exists primarily as a vehicle to demonstrate the course's **Harness
Engineering** methodology (5 subsystems, evidence-gated "done", TDD/verification,
planning, guardrails) on a real, demoable Shopify app.

## 2. Demo story (the thing we show the team)

> Merchant opens the app → selects a few products → picks a rule (e.g. **−20%**) →
> toggles **"round to .99"** and **"set compare-at to original price"** → sees a
> live **before → after** preview table → clicks **Apply** → prices update in
> Shopify, and the products now show a strikethrough "sale" price.

~30 seconds, highly visual.

## 3. Architecture

Built on the **official Shopify Remix app template** (`shopify app init`):
Remix + Polaris + App Bridge + Prisma (session storage) + local `@shopify/cli`
dev-dependency. Runs via `npm run dev` (`shopify app dev`) against a Partner dev
store. No global Shopify CLI install required.

We add three focused pieces on top of the template:

| Unit | File | Responsibility | Depends on |
|---|---|---|---|
| Pricing core | `app/lib/pricing.ts` | Pure price math + rule composition. **Zero Shopify deps.** | nothing |
| App UI | `app/routes/app._index.tsx` (UI portion) | Polaris page: product list, rule form, preview, Apply | `pricing.ts`, Polaris |
| Data I/O | `app/routes/app._index.tsx` (loader/action) | Admin GraphQL read + write | Shopify Admin API |

Rationale for the split: the pricing logic is isolated and pure so it can be unit
tested without a running store — this is the concrete "verification before done"
showcase. The route owns Shopify I/O so the core stays framework-free.

## 4. Core logic — `app/lib/pricing.ts`

Pure, framework-free functions. Money handled carefully (Shopify prices are
strings; we parse to number, compute, and format back to 2-decimal strings).

```
type Rule = {
  operation: "percentage";        // YAGNI: only percentage for now
  percent: number;                // e.g. -20 means -20%
  roundTo99: boolean;
  setCompareAtToOriginal: boolean;
};

applyPercentage(price: number, percent: number): number
roundTo99(price: number): number            // rule: floor(price) + 0.99  (23.40 -> 23.99, 23.00 -> 23.99)
computeNewPrice(price: number, rule: Rule): number   // percentage then optional round
buildVariantUpdate(variant, rule): { id, price, compareAtPrice? }
```

Guard rules (each gets a test):
- New price is never `<= 0`; if math would produce that, clamp to a minimum (e.g.
  `0.01`) — documented behavior, not silent.
- Always round monetary output to 2 decimals.
- `roundTo99`: map any price to the nearest sensible `*.99` ending (rule: take
  `floor(price)` then `+ 0.99`; if that is `>= price` keep it, else `ceil`).
  Exact rounding rule is pinned by tests so it is unambiguous.
- `setCompareAtToOriginal`: when true and the new price is **lower** than the
  original, set `compareAtPrice = original`; otherwise leave compare-at unchanged.
- Parsing: non-numeric / missing price is skipped (not crashed) and surfaced in the
  result summary.

## 5. UI — `app/routes/app._index.tsx`

Polaris components: `Page` → `Card` containing:
- Product `ResourceList` / `IndexTable` with checkbox selection (titles + current
  price, loaded from Shopify).
- Rule form: `Select` (operation) · `TextField` (percent, numeric) · two
  `Checkbox` toggles (round to .99, set compare-at).
- Live **before → after** preview table computed client-side from `pricing.ts`.
- `Button` "Apply to N products" → submits the Remix `action` → success `Banner` /
  Polaris toast with a summary (`updated: N, skipped: M`).

## 6. Data flow (Admin GraphQL)

- **Loader (read):** `products(first: 50)` → `{ id, title, variants(first:10){ id,
  price, compareAtPrice } }`. Returned to the UI.
- **Action (write):** parse selected product/variant ids + rule from the form →
  compute updates via `pricing.ts` → call `productVariantsBulkUpdate` (grouped per
  product) → aggregate results → return `{ updated, skipped, errors }`.

## 7. Harness mapping (the graded methodology)

| Subsystem | Artifact in this repo |
|---|---|
| **Guidance** | `AGENTS.md` / `CLAUDE.md` (rewritten for this app), `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` |
| **Tools / Environment** | `init.sh` (real: install → typecheck → lint → test → build), `.nvmrc`, `.env.example`, `.claude/settings.json` permissions/guardrails |
| **State** | `feature_list.json` (real DAG, evidence field), `claude-progress.md` |
| **Feedback** | `init.sh` verify chain + Vitest unit tests; evidence required before a feature is `passing` |
| **Lifecycle** | `session-handoff.md`, clean-state rule, end-of-session routine |

## 8. Feature DAG (`feature_list.json`)

```
feat-001  Scaffold Shopify Remix app + wire init.sh green        deps: []
feat-002  pricing.ts pure functions + Vitest tests (TDD)         deps: [001]
feat-003  Products loader (Admin GraphQL read) on app._index     deps: [001]
feat-004  Polaris UI: product list + rule form + preview         deps: [002, 003]
feat-005  Apply action (productVariantsBulkUpdate write)         deps: [004]
feat-006  Polish + capture demo evidence (screenshots/log)       deps: [005]
feat-007  Docs + handoff + docs/PRESENTATION.md (6 answers)      deps: [006]
```

One active feature at a time; a feature becomes `passing` only with recorded
evidence (verify output).

## 9. Verification (`init.sh`)

`init.sh` runs, in order, from a clean checkout:
1. Check Node version against `.nvmrc`.
2. `npm install`.
3. `npm run typecheck` (or `tsc --noEmit`).
4. `npm run lint`.
5. `npm run test` (Vitest — pricing unit tests).
6. `npm run build`.

All green = environment ready. The Apply-to-store path is verified manually in the
demo (needs a live dev store) and that evidence (screenshots / action log) is
recorded in `feat-005`/`feat-006`.

## 10. Deliverables (course submission)

- Repo / source code (this repo).
- `docs/PRESENTATION.md` — short demo script answering the six end-of-course
  questions, for presenting to the team:
  1. What is the app's goal?
  2. Which course knowledge was applied?
  3. How did AI help during the build?
  4. What results were achieved?
  5. Difficulties encountered and how they were handled?
  6. Lessons learned.
- `docs/WORKFLOW-AI.md` (optional, can merge into PRESENTATION.md) — note on the
  AI/Harness workflow used.

## 11. Scope / non-goals (YAGNI)

**In:** percentage rule, round-to-.99, set-compare-at, product selection, preview,
apply, unit tests, the harness artifacts, the presentation doc.

**Out (explicitly):** fixed-amount/absolute rules, tag/collection filters,
scheduling, undo/history, billing, multi-currency edge cases, pagination beyond the
first 50 products, bulk operations via Shopify `bulkOperationRunMutation`.

## 12. Risks

- **Live store needed for the write path.** Mitigation: pricing logic + UI + preview
  are fully testable without a store; only the final Apply needs the dev store, and
  that is the manual demo step.
- **Shopify CLI / Partner auth friction.** Mitigation: template ships local CLI;
  `init.sh` does not depend on store auth (it stops at build), so the harness stays
  green even before a store is connected.
- **Money rounding ambiguity.** Mitigation: rounding behavior is pinned by explicit
  unit tests so it is unambiguous and reviewable.
