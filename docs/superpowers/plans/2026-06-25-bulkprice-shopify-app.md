# BulkPrice Shopify App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an embedded Shopify admin app that bulk-edits product prices (percentage change + round-to-.99 + set-compare-at), while wiring the repo's AI-harness (Guidance / Environment / State / Feedback / Lifecycle) so the whole build is evidence-gated and demoable.

**Architecture:** Official Shopify Remix template (Remix + Polaris + App Bridge + Prisma). All price math lives in a pure, Shopify-free module `app/lib/pricing.ts` (unit-tested with Vitest). The single route `app/routes/app._index.tsx` owns Shopify I/O: a loader reads products via Admin GraphQL `products`, an action writes prices via `productVariantsBulkUpdate`. The harness files at repo root (`AGENTS.md`, `feature_list.json`, `init.sh`, etc.) are rewritten from placeholders to describe this real app.

**Tech Stack:** Node 22, npm, Remix, @shopify/shopify-app-remix, @shopify/polaris, Prisma (SQLite sessions), Vitest, TypeScript, Shopify Admin GraphQL API 2026-04.

## Global Constraints

- Node version: **22.x** (current machine: v22.16.0). Pin in `.nvmrc` and check in `init.sh`.
- Shopify CLI is the **local** dev-dependency (`@shopify/cli`); never require a global install.
- Admin API version: **2026-04** (the validated version). Keep `shopify.app.toml` / GraphQL consistent with it.
- Required access scope: **`write_products`** (implies read). Must appear in app scopes.
- Pricing logic in `app/lib/pricing.ts` MUST have **zero** imports from Shopify/Remix/Polaris — it is pure and unit-tested.
- Money values from Shopify are **strings** (e.g. `"15.99"`); parse to number, compute, format back to a 2-decimal string before sending.
- A feature is `passing` only with **recorded evidence** (real command output) in `feature_list.json` / `claude-progress.md`. One active feature at a time.
- `init.sh` must stay green **without** a connected store (it stops at `build`; the store-write path is a manual demo step).
- The two Admin GraphQL operations below are already schema-validated (API 2026-04) — use them verbatim:

```graphql
# READ (loader)
query GetProducts {
  products(first: 50) {
    edges {
      node {
        id
        title
        variants(first: 10) {
          edges { node { id price compareAtPrice } }
        }
      }
    }
  }
}
```

```graphql
# WRITE (action)
mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price compareAtPrice }
    userErrors { field message }
  }
}
```

`ProductVariantsBulkInput` fields used: `id` (ID), `price` (Money/string), `compareAtPrice` (Money/string|null).

---

## File Structure

| Path | Created/Modified | Responsibility |
|---|---|---|
| `app/` (whole template) | Created by `shopify app init` (feat-001) | Remix app scaffold |
| `app/lib/pricing.ts` | Create (feat-002) | Pure price math + rule composition |
| `app/lib/pricing.test.ts` | Create (feat-002) | Vitest unit tests for pricing |
| `app/routes/app._index.tsx` | Modify template default (feat-003/004/005) | Loader (read), UI, action (write) |
| `vitest.config.ts` | Create (feat-002) | Vitest config |
| `init.sh` | Modify (feat-001) | Real install + verify chain |
| `.nvmrc` | Create (feat-001) | Pin Node 22 |
| `AGENTS.md`, `CLAUDE.md` | Modify (feat-001) | Harness guidance for this app |
| `feature_list.json` | Modify (feat-001, updated each feature) | Real feature DAG + evidence |
| `claude-progress.md`, `session-handoff.md` | Modify (ongoing) | State + lifecycle |
| `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` | Create (feat-001) | Detail docs AGENTS.md links to |
| `docs/PRESENTATION.md` | Create (feat-007) | 6-question demo script |

> Note on the template's GraphQL typegen: the Shopify Remix template runs `graphql-codegen`. If typed `admin.graphql` causes friction, the operations above still run as plain strings. Keep the query/mutation as string constants in the route.

---

## Task 1: Scaffold the Shopify Remix app + make `init.sh` green

**Files:**
- Create: `app/**` (via CLI), `.nvmrc`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`
- Modify: `init.sh`, `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `claude-progress.md`

**Interfaces:**
- Produces: a runnable Remix app with `package.json` scripts `dev`, `build`, `lint`; a `typecheck`/`test` script we add; `init.sh` that installs and verifies.

- [ ] **Step 1: Scaffold the template into a temp dir, then move it into repo root**

The CLI refuses a non-empty dir, so scaffold beside the repo and copy the app in.
Run (from repo parent):

```bash
cd /c/Users/buidi/Desktop
npm init @shopify/app@latest -- --template remix --flavor typescript --name bulkprice-tmp
```

When prompted, pick: Remix, TypeScript, and "Start with Polaris". This creates `bulkprice-tmp/`.

- [ ] **Step 2: Copy the scaffolded app files into the repo (keep our harness files)**

```bash
cd /c/Users/buidi/Desktop/bulkprice-tmp
# copy everything except git metadata into the repo
cp -r app extensions prisma public 2>/dev/null .  # ignore missing dirs
cp package.json package-lock.json tsconfig.json vite.config.* remix.config.* shopify.app.toml shopify.web.toml .eslintrc* .graphqlrc* env.d.ts /c/Users/buidi/Desktop/shopify-app/ 2>/dev/null || true
```

If any path differs (template versions vary), list `bulkprice-tmp` contents and copy the equivalent app/config files manually. The goal: repo root now has the Remix `app/`, `package.json`, `tsconfig.json`, vite config, `shopify.app.toml`, `prisma/`.

- [ ] **Step 3: Verify the app installs and builds**

```bash
cd /c/Users/buidi/Desktop/shopify-app
npm install
npm run build
```

Expected: install completes; `npm run build` (remix vite build) succeeds. If `npm run lint` exists, run it too.

- [ ] **Step 4: Add `.nvmrc` and `typecheck`/`test` scripts**

`.nvmrc`:
```
22
```

In `package.json` `"scripts"`, ensure these exist (add if missing):
```json
"typecheck": "tsc --noEmit",
"test": "vitest run"
```

- [ ] **Step 5: Replace `init.sh` with the real verify chain**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

step() { printf '\n==> %s\n' "$1"; }

step "1/6 Check Node 22"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" != "22" ]; then
  echo "Need Node 22 (see .nvmrc); got $(node -v)" >&2; exit 1
fi
echo "Node $(node -v) OK"

step "2/6 npm install"
npm install

step "3/6 Prisma generate + migrate (SQLite sessions)"
npm run setup || npx prisma generate

step "4/6 Typecheck"
npm run typecheck

step "5/6 Test (Vitest)"
npm run test

step "6/6 Build"
npm run build

echo ""
echo "================ HARNESS GREEN ================"
echo "Env ready. To run against a dev store: npm run dev"
```

> `npm run setup` is the template's Prisma script; if it doesn't exist, the `|| npx prisma generate` fallback runs. Lint is intentionally not gating in init.sh if the template's lint is noisy on generated files; if `npm run lint` is clean, add it as a step.

- [ ] **Step 6: Rewrite `AGENTS.md` and `CLAUDE.md` for this app**

`AGENTS.md` must state: project = BulkPrice Shopify app; tech stack (fixed) = Remix + Polaris + Prisma, Node 22, Admin API 2026-04, scope `write_products`; startup = `nvm use; bash init.sh`; one feature at a time; DONE requires evidence; link to `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`. Keep it ~80 lines (map, not manual). `CLAUDE.md` stays a thin stub pointing to `AGENTS.md`.

- [ ] **Step 7: Write `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`**

`docs/PRODUCT.md`: the demo story, the three rules (percentage, round-to-.99, set-compare-at), the selection→preview→apply use case (copy from the design spec §2, §4).
`docs/ARCHITECTURE.md`: the file structure table above, the loader/action data flow (§5, §6), and the two GraphQL operations.

- [ ] **Step 8: Replace `feature_list.json` with the real DAG**

Use status legend `not_started|in_progress|blocked|passing`. Features feat-001..feat-007 exactly as in design spec §8, each with `verification` steps and empty `evidence`. Set feat-001 `in_progress`.

- [ ] **Step 9: Run `init.sh` and capture evidence**

```bash
bash init.sh
```

Expected: ends with `HARNESS GREEN`. Paste the output into feat-001 `evidence` and set feat-001 `passing`. Update `claude-progress.md`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat-001: scaffold Shopify Remix app + real init.sh harness"
```

---

## Task 2: `pricing.ts` pure functions + Vitest tests (TDD)

**Files:**
- Create: `app/lib/pricing.ts`, `app/lib/pricing.test.ts`, `vitest.config.ts`

**Interfaces:**
- Produces (consumed by Task 4 & 5):
  - `type Rule = { operation: "percentage"; percent: number; roundTo99: boolean; setCompareAtToOriginal: boolean }`
  - `applyPercentage(price: number, percent: number): number`
  - `roundTo99(price: number): number`
  - `computeNewPrice(price: number, rule: Rule): number`
  - `parseMoney(value: string | null | undefined): number | null`
  - `formatMoney(value: number): string`
  - `buildVariantUpdate(variant: { id: string; price: string; compareAtPrice: string | null }, rule: Rule): { id: string; price: string; compareAtPrice: string | null } | null`  (returns `null` if price unparseable → caller counts it as skipped)

- [ ] **Step 1: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["app/**/*.test.ts"], environment: "node" },
});
```

Install Vitest if not present: `npm i -D vitest`.

- [ ] **Step 2: Write the failing tests** (`app/lib/pricing.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import {
  applyPercentage,
  roundTo99,
  computeNewPrice,
  parseMoney,
  formatMoney,
  buildVariantUpdate,
  type Rule,
} from "./pricing";

const base: Rule = { operation: "percentage", percent: 0, roundTo99: false, setCompareAtToOriginal: false };

describe("parseMoney/formatMoney", () => {
  it("parses a money string", () => expect(parseMoney("15.99")).toBe(15.99));
  it("returns null for junk", () => expect(parseMoney("abc")).toBeNull());
  it("returns null for null", () => expect(parseMoney(null)).toBeNull());
  it("formats to 2 decimals", () => expect(formatMoney(15.9)).toBe("15.90"));
  it("rounds half up to 2 decimals", () => expect(formatMoney(15.005)).toBe("15.01"));
});

describe("applyPercentage", () => {
  it("decreases by 20%", () => expect(applyPercentage(100, -20)).toBeCloseTo(80));
  it("increases by 10%", () => expect(applyPercentage(50, 10)).toBeCloseTo(55));
});

describe("roundTo99", () => {
  it("23.40 -> 23.99", () => expect(roundTo99(23.4)).toBeCloseTo(23.99));
  it("23.00 -> 23.99", () => expect(roundTo99(23)).toBeCloseTo(23.99));
});

describe("computeNewPrice", () => {
  it("percentage then round", () =>
    expect(computeNewPrice(100, { ...base, percent: -20, roundTo99: true })).toBeCloseTo(80.99));
  it("never returns <= 0 (clamps to 0.01)", () =>
    expect(computeNewPrice(10, { ...base, percent: -100 })).toBe(0.01));
});

describe("buildVariantUpdate", () => {
  const variant = { id: "gid://shopify/ProductVariant/1", price: "100.00", compareAtPrice: null };

  it("sets new price string", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: -20 });
    expect(out).toEqual({ id: variant.id, price: "80.00", compareAtPrice: null });
  });

  it("sets compareAt to original when discounting and toggle on", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: -20, setCompareAtToOriginal: true });
    expect(out).toEqual({ id: variant.id, price: "80.00", compareAtPrice: "100.00" });
  });

  it("does NOT set compareAt when price goes up", () => {
    const out = buildVariantUpdate(variant, { ...base, percent: 10, setCompareAtToOriginal: true });
    expect(out).toEqual({ id: variant.id, price: "110.00", compareAtPrice: null });
  });

  it("returns null when price is unparseable", () => {
    expect(buildVariantUpdate({ ...variant, price: "abc" }, base)).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npx vitest run app/lib/pricing.test.ts`
Expected: FAIL — `Cannot find module './pricing'`.

- [ ] **Step 4: Implement `app/lib/pricing.ts`**

```ts
export type Rule = {
  operation: "percentage";
  percent: number;
  roundTo99: boolean;
  setCompareAtToOriginal: boolean;
};

const MIN_PRICE = 0.01;

export function parseMoney(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: number): string {
  // round half up to 2 decimals, avoiding float artifacts
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function applyPercentage(price: number, percent: number): number {
  return price * (1 + percent / 100);
}

export function roundTo99(price: number): number {
  return Math.floor(price) + 0.99;
}

export function computeNewPrice(price: number, rule: Rule): number {
  let next = price;
  if (rule.operation === "percentage") next = applyPercentage(next, rule.percent);
  if (rule.roundTo99) next = roundTo99(next);
  if (next <= 0) next = MIN_PRICE;
  return next;
}

export function buildVariantUpdate(
  variant: { id: string; price: string; compareAtPrice: string | null },
  rule: Rule,
): { id: string; price: string; compareAtPrice: string | null } | null {
  const original = parseMoney(variant.price);
  if (original === null) return null;

  const newPrice = computeNewPrice(original, rule);
  let compareAtPrice: string | null = variant.compareAtPrice;

  if (rule.setCompareAtToOriginal && newPrice < original) {
    compareAtPrice = formatMoney(original);
  }

  return { id: variant.id, price: formatMoney(newPrice), compareAtPrice };
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `npx vitest run app/lib/pricing.test.ts`
Expected: PASS (all suites green). Also run `npm run typecheck` → no errors.

- [ ] **Step 6: Update state + commit**

Set feat-002 `passing` with the Vitest output pasted into `evidence`. Update `claude-progress.md`.

```bash
git add app/lib/pricing.ts app/lib/pricing.test.ts vitest.config.ts package.json feature_list.json claude-progress.md
git commit -m "feat-002: pure pricing rules + Vitest tests (TDD)"
```

---

## Task 3: Products loader (Admin GraphQL read)

**Files:**
- Modify: `app/routes/app._index.tsx`

**Interfaces:**
- Consumes: Shopify Remix `authenticate.admin(request)` → `admin.graphql`.
- Produces: loader returns `{ products: Array<{ id: string; title: string; variantId: string; price: string; compareAtPrice: string | null }> }` (flattened to first variant per product for the simple demo).

- [ ] **Step 1: Replace the loader in `app/routes/app._index.tsx`**

Keep the template's imports for `authenticate` (usually `../shopify.server`). Replace/add the loader:

```ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

const GET_PRODUCTS = `#graphql
  query GetProducts {
    products(first: 50) {
      edges {
        node {
          id
          title
          variants(first: 10) {
            edges { node { id price compareAtPrice } }
          }
        }
      }
    }
  }`;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const res = await admin.graphql(GET_PRODUCTS);
  const json = await res.json();
  const products = json.data.products.edges.map((e: any) => {
    const node = e.node;
    const v = node.variants.edges[0]?.node;
    return {
      id: node.id,
      title: node.title,
      variantId: v?.id ?? "",
      price: v?.price ?? "0.00",
      compareAtPrice: v?.compareAtPrice ?? null,
    };
  });
  return { products };
}
```

- [ ] **Step 2: Render a minimal list to prove the read works**

Temporarily render titles + prices inside the existing Polaris `Page` (full UI comes in Task 4):

```tsx
export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.title} — {p.price}</li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS. (Live data is verified in the demo; here we prove it compiles and the loader shape is correct.)

- [ ] **Step 4: Manual read check (if a dev store is connected) — optional evidence**

```bash
npm run dev
```
Open the app in the dev store; confirm product titles + prices list. Screenshot → feat-003 evidence. If no store yet, record "compiles; live read deferred to demo" and keep feat-003 `passing` on the typecheck/build evidence (read path is exercised again in Task 5 demo).

- [ ] **Step 5: Update state + commit**

```bash
git add app/routes/app._index.tsx feature_list.json claude-progress.md
git commit -m "feat-003: products loader via Admin GraphQL"
```

---

## Task 4: Polaris UI — selection, rule form, live preview

**Files:**
- Modify: `app/routes/app._index.tsx`

**Interfaces:**
- Consumes: `useLoaderData` products (Task 3); `Rule`, `computeNewPrice`, `parseMoney`, `formatMoney` from `app/lib/pricing.ts` (Task 2).
- Produces: form state (selected ids, percent, toggles) and a Remix `<Form method="post">` posting to the Task 5 action.

- [ ] **Step 1: Build the Polaris page with selection + rule form + preview**

```tsx
import { useState, useMemo } from "react";
import { Form } from "@remix-run/react";
import {
  Page, Card, IndexTable, TextField, Checkbox, Button, Text, useIndexResourceState,
} from "@shopify/polaris";
import { computeNewPrice, parseMoney, formatMoney, type Rule } from "../lib/pricing";

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const [percent, setPercent] = useState("-20");
  const [roundTo99, setRoundTo99] = useState(true);
  const [setCompareAt, setSetCompareAt] = useState(true);

  const resourceIds = useMemo(() => products.map((p) => ({ id: p.id })), [products]);
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(resourceIds);

  const rule: Rule = {
    operation: "percentage",
    percent: Number(percent) || 0,
    roundTo99,
    setCompareAtToOriginal: setCompareAt,
  };

  const rows = products.map((p, i) => {
    const orig = parseMoney(p.price) ?? 0;
    const next = formatMoney(computeNewPrice(orig, rule));
    const selected = selectedResources.includes(p.id);
    return (
      <IndexTable.Row id={p.id} key={p.id} position={i} selected={selected}>
        <IndexTable.Cell><Text as="span">{p.title}</Text></IndexTable.Cell>
        <IndexTable.Cell>{p.price}</IndexTable.Cell>
        <IndexTable.Cell>{selected ? next : "—"}</IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page title="BulkPrice — bulk price editor">
      <Card>
        <TextField label="Percentage change (%)" type="number" value={percent}
          onChange={setPercent} autoComplete="off" />
        <Checkbox label="Round to .99" checked={roundTo99} onChange={setRoundTo99} />
        <Checkbox label="Set compare-at to original (show sale)" checked={setCompareAt}
          onChange={setSetCompareAt} />
        <IndexTable
          resourceName={{ singular: "product", plural: "products" }}
          itemCount={products.length}
          selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
          onSelectionChange={handleSelectionChange}
          headings={[{ title: "Product" }, { title: "Current" }, { title: "New" }]}
        >
          {rows}
        </IndexTable>
        <Form method="post">
          <input type="hidden" name="rule" value={JSON.stringify(rule)} />
          <input type="hidden" name="ids" value={JSON.stringify(selectedResources)} />
          <Button submit variant="primary" disabled={selectedResources.length === 0}>
            {`Apply to ${selectedResources.length} products`}
          </Button>
        </Form>
      </Card>
    </Page>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS. Fix any Polaris prop type errors the compiler reports (e.g. `selectedItemsCount` union).

- [ ] **Step 3: Manual UI check (optional, if store connected)**

`npm run dev` → confirm: table renders, selecting rows shows new prices in the "New" column, toggles change the preview live. Screenshot → feat-004 evidence.

- [ ] **Step 4: Update state + commit**

```bash
git add app/routes/app._index.tsx feature_list.json claude-progress.md
git commit -m "feat-004: Polaris UI with selection, rule form, live preview"
```

---

## Task 5: Apply action (`productVariantsBulkUpdate` write)

**Files:**
- Modify: `app/routes/app._index.tsx`

**Interfaces:**
- Consumes: `buildVariantUpdate` from `app/lib/pricing.ts`; the loader's products (to map id → variantId); `admin.graphql` mutation.
- Produces: action returns `{ updated: number; skipped: number; errors: string[] }`; UI shows a Polaris `Banner`/toast from `useActionData`.

- [ ] **Step 1: Add the action to `app/routes/app._index.tsx`**

```ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { buildVariantUpdate, type Rule } from "../lib/pricing";

const BULK_UPDATE = `#graphql
  mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }`;

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const rule = JSON.parse(String(form.get("rule"))) as Rule;
  const ids = JSON.parse(String(form.get("ids"))) as string[];

  // re-read products so we have variant ids + current prices (don't trust client)
  const res = await admin.graphql(GET_PRODUCTS);
  const data = (await res.json()).data;
  const byId = new Map<string, any>(data.products.edges.map((e: any) => [e.node.id, e.node]));

  let updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const productId of ids) {
    const node = byId.get(productId);
    const v = node?.variants.edges[0]?.node;
    if (!v) { skipped++; continue; }
    const upd = buildVariantUpdate({ id: v.id, price: v.price, compareAtPrice: v.compareAtPrice }, rule);
    if (!upd) { skipped++; continue; }

    const r = await admin.graphql(BULK_UPDATE, {
      variables: { productId, variants: [{ id: upd.id, price: upd.price, compareAtPrice: upd.compareAtPrice }] },
    });
    const out = (await r.json()).data.productVariantsBulkUpdate;
    if (out.userErrors?.length) errors.push(`${node.title}: ${out.userErrors[0].message}`);
    else updated++;
  }

  return { updated, skipped, errors };
}
```

- [ ] **Step 2: Show the result Banner in the component**

Add near the top of the returned `<Page>`:

```tsx
const actionData = useActionData<typeof action>();
// ...
{actionData && (
  <Banner tone={actionData.errors.length ? "warning" : "success"}>
    Updated {actionData.updated}, skipped {actionData.skipped}
    {actionData.errors.length ? ` — errors: ${actionData.errors.join("; ")}` : ""}
  </Banner>
)}
```

(Import `Banner` from `@shopify/polaris`, `useActionData` from `@remix-run/react`.)

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: End-to-end demo against a dev store (the real evidence)**

```bash
npm run dev
```
In the dev store app: select products → percent `-20`, round-to-.99 on, compare-at on → Apply → confirm success Banner. Then open one product in Shopify admin and confirm the new price + strikethrough compare-at. Capture screenshots (before/after) → feat-005 evidence.

> Requires the dev store to have products and the app installed with `write_products` scope. If scope is missing, add `write_products` to `shopify.app.toml` scopes and re-run `npm run deploy` / reinstall.

- [ ] **Step 5: Update state + commit**

```bash
git add app/routes/app._index.tsx feature_list.json claude-progress.md
git commit -m "feat-005: apply prices via productVariantsBulkUpdate"
```

---

## Task 6: Polish + capture demo evidence

**Files:**
- Modify: `app/routes/app._index.tsx` (minor), `feature_list.json`, `claude-progress.md`
- Create: `docs/demo/` (screenshots)

**Interfaces:** none new.

- [ ] **Step 1: UX polish**

Add a confirmation guard (disable Apply while submitting via `useNavigation().state`), and an empty-state message when `products.length === 0`. Keep it minimal.

- [ ] **Step 2: Re-run full verification**

Run: `bash init.sh`
Expected: `HARNESS GREEN`.

- [ ] **Step 3: Capture the demo**

Save before/after screenshots to `docs/demo/`. Record the end-to-end run output. These are feat-006 evidence.

- [ ] **Step 4: Update state + commit**

```bash
git add -A
git commit -m "feat-006: polish + demo evidence"
```

---

## Task 7: Docs, handoff, and the presentation file

**Files:**
- Create: `docs/PRESENTATION.md`
- Modify: `session-handoff.md`, `claude-progress.md`, `feature_list.json`, `README.md`

**Interfaces:** none.

- [ ] **Step 1: Write `docs/PRESENTATION.md` answering the six course questions**

Structure (fill with the real, final content from this build — not placeholders):

```markdown
# BulkPrice — Demo & Presentation

## 1. App goal
What BulkPrice does and the merchant problem it solves (bulk price changes / running a sale in a few clicks).

## 2. Course knowledge applied
- Harness Engineering: 5 subsystems mapped to repo files (table).
- Planning & delegation: brainstorming → spec → plan → task-by-task execution.
- Prompt/context engineering: AGENTS.md as source of truth; docs/ links.
- Verification & testing: TDD on pricing.ts; init.sh evidence gate.
- Guardrails: .claude/settings.json permissions; one-feature-at-a-time; evidence before "passing".

## 3. How AI helped
Where Claude Code drove: scaffolding, writing the pure pricing module test-first,
authoring + schema-validating the Admin GraphQL, wiring the harness, keeping state.

## 4. Results
Working embedded app; N passing unit tests; init.sh green; live demo updates prices
+ compare-at in the dev store. (Insert real numbers/screenshots.)

## 5. Difficulties & how handled
e.g. template scaffolding into a non-empty repo; Polaris prop types; money-as-string
parsing; store/scope setup. How each was resolved.

## 6. Lessons learned
What the harness bought us; what you'd do differently next time.

## Demo script (live, ~2 min)
Step-by-step click path for presenting to the team.
```

- [ ] **Step 2: Update `session-handoff.md`, `claude-progress.md`, `README.md`, and `feature_list.json`**

Mark feat-007 `passing`. README: short "what this is + how to run" for the repo link submission.

- [ ] **Step 3: Final verification + clean state**

Run: `bash init.sh && git status --short`
Expected: `HARNESS GREEN`; no stray uncommitted files (no `.env`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat-007: docs, handoff, and presentation"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** §1 goal → Task 1/AGENTS; §2 demo → Task 5 Step 4 + Task 7; §3 architecture → File Structure + Task 1; §4 pricing core → Task 2; §5 UI → Task 4; §6 data flow → Task 3 (read) + Task 5 (write); §7 harness map → Task 1; §8 DAG → all tasks; §9 init.sh → Task 1 Step 5; §10 deliverables → Task 7; §11 scope → Global Constraints; §12 risks → noted in Tasks 3/5 optional-store steps. No gaps.
- **Placeholder scan:** code provided for every code step; the only "fill in real content" is `docs/PRESENTATION.md` body, which is inherently post-implementation reporting (structure given).
- **Type consistency:** `Rule`, `buildVariantUpdate`, `computeNewPrice`, `parseMoney`, `formatMoney`, `GET_PRODUCTS`, `BULK_UPDATE` names match across Tasks 2→3→4→5. Loader product shape (`{id,title,variantId,price,compareAtPrice}`) consistent.
- **GraphQL:** both operations schema-validated against API 2026-04 before writing the plan.
