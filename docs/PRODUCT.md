# Product — BulkPrice

## Goal
Let a Shopify merchant change prices on many products at once, safely and
visibly, in a few clicks — e.g. run a 20%-off sale and show a strikethrough
"compare-at" price.

## User
- **Merchant / store admin** (the only user). The app is embedded in the Shopify
  admin and authenticated via Shopify OAuth; access scope `write_products`.

## Demo story (the thing we show)
1. Open BulkPrice in the Shopify admin.
2. The product list loads (title + current price).
3. Select a few products.
4. Set the rule: percentage change (e.g. **-20**), toggle **Round to .99**,
   toggle **Set compare-at to original**.
5. The **before → after** preview updates live for the selected rows.
6. Click **Apply to N products** → prices update in Shopify → success banner with
   `updated` / `skipped` counts. The products now show a strikethrough sale price.

## Price rules (the testable core)
| Rule | Behavior |
|---|---|
| Percentage change | New price = price × (1 + percent/100). Negative = discount. |
| Round to .99 | New price = floor(price) + 0.99 (e.g. 23.40 → 23.99). Optional toggle. |
| Set compare-at to original | When discounting (new < original) and toggle on, compare-at = original price → strikethrough sale. |

## Business rules / guards
- A computed price is never ≤ 0; it clamps to a minimum of 0.01 (documented, not silent).
- Money is rounded to 2 decimals and sent as a string (Shopify Money format).
- A product whose price cannot be parsed is **skipped**, not crashed, and counted
  in the result summary.

## Definition of product-complete (for the demo, feat-005)
Select products → apply -20% with round-to-.99 and compare-at → Apply → the
selected products show the new price + strikethrough compare-at in the Shopify
admin. Evidence: before/after screenshots + the action's updated/skipped summary.

## Out of scope (YAGNI)
Fixed-amount/absolute rules, tag/collection filters, scheduling, undo/history,
billing, multi-currency edge cases, pagination beyond the first 50 products.
