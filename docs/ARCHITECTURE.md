# Architecture — BulkPrice

## Overview
Built on the official **Shopify Remix app template** (Remix 2 + Polaris 12 + App
Bridge + `@shopify/shopify-app-remix` + Prisma SQLite session storage). We add a
pure pricing module and turn the index route into the bulk price editor.

```
shopify-app/
├── AGENTS.md / CLAUDE.md          # Guidance (source of truth + Claude stub)
├── init.sh                        # Feedback + Environment: install + verify chain
├── .nvmrc                         # Environment: Node 22
├── package.json                   # Environment: scripts (build/dev/typecheck/test/lint)
├── shopify.app.toml               # Shopify app config (scope: write_products)
├── prisma/                        # Session storage schema + migration
├── feature_list.json              # State: feature DAG + evidence
├── claude-progress.md             # State: session log
├── session-handoff.md             # Lifecycle: restart bridge
├── docs/                          # PRODUCT.md, ARCHITECTURE.md, PRESENTATION.md, demo/
└── app/
    ├── shopify.server.ts          # Shopify app config; exports `authenticate`
    ├── db.server.ts               # Prisma client
    ├── lib/
    │   ├── pricing.ts             # PURE price math (no Shopify/Remix imports)
    │   └── pricing.test.ts        # Vitest unit tests
    └── routes/
        └── app._index.tsx         # loader (read) + UI + action (write)
```

## Layers
- **Pricing core** (`app/lib/pricing.ts`): pure functions. Parse/format money,
  apply percentage, round-to-.99, compose the rule, build a per-variant update.
  Zero framework imports → unit-testable without a running store. This is the
  feature with the highest verification ROI.
- **Route** (`app/routes/app._index.tsx`): owns all Shopify I/O.
  - **loader** → Admin GraphQL `products` query (read).
  - **action** → Admin GraphQL `productVariantsBulkUpdate` mutation (write).
  - **component** → Polaris UI: product selection, rule form, live preview, Apply.

## Data flow
```
Browser (Polaris UI)
   │  select products + set rule
   ▼
loader: products(first: 50) ──► Shopify Admin API ──► product list to UI
   │
   │  Apply (POST form: rule + selected ids)
   ▼
action: for each product → buildVariantUpdate(pricing.ts)
        → productVariantsBulkUpdate ──► Shopify Admin API
        → aggregate { updated, skipped, errors } ──► success banner
```

## Admin GraphQL operations (schema-validated, API 2026-04)
```graphql
# READ
query GetProducts {
  products(first: 50) {
    edges { node { id title variants(first: 10) { edges { node { id price compareAtPrice } } } } }
  }
}

# WRITE
mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price compareAtPrice }
    userErrors { field message }
  }
}
```
`ProductVariantsBulkInput` fields used: `id`, `price` (Money string), `compareAtPrice`.
The running app uses the library's configured API version (`ApiVersion.January25`);
these operations are stable across versions.

## Auth & runtime
`app/shopify.server.ts` configures `shopifyApp(...)` and exports `authenticate`.
Routes call `authenticate.admin(request)` to get an `admin.graphql` client.
Sessions persist in SQLite via Prisma. Running against a store (`npm run dev`)
requires linking to a Partner org/dev store — a manual demo step.
