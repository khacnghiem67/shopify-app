import { useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Page,
  Card,
  IndexTable,
  TextField,
  Checkbox,
  Button,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  useIndexResourceState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  buildVariantUpdate,
  computeNewPrice,
  parseMoney,
  formatMoney,
  type Rule,
} from "../lib/pricing";

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

const BULK_UPDATE = `#graphql
  mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }`;

type ProductRow = {
  id: string;
  title: string;
  variantId: string;
  price: string;
  compareAtPrice: string | null;
};

function firstVariant(node: any): any | undefined {
  return node?.variants?.edges?.[0]?.node;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const res = await admin.graphql(GET_PRODUCTS);
  const json: any = await res.json();
  const products: ProductRow[] = (json.data?.products?.edges ?? []).map(
    (edge: any) => {
      const node = edge.node;
      const v = firstVariant(node);
      return {
        id: node.id,
        title: node.title,
        variantId: v?.id ?? "",
        price: v?.price ?? "0.00",
        compareAtPrice: v?.compareAtPrice ?? null,
      };
    },
  );
  return { products };
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const rule = JSON.parse(String(form.get("rule"))) as Rule;
  const ids = JSON.parse(String(form.get("ids"))) as string[];

  // Re-read products server-side so we use trusted variant ids + current prices.
  const res = await admin.graphql(GET_PRODUCTS);
  const data: any = (await res.json()).data;
  const byId = new Map<string, any>(
    (data?.products?.edges ?? []).map((e: any) => [e.node.id, e.node]),
  );

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const productId of ids) {
    const node = byId.get(productId);
    const v = firstVariant(node);
    if (!v) {
      skipped++;
      continue;
    }
    const upd = buildVariantUpdate(
      { id: v.id, price: v.price, compareAtPrice: v.compareAtPrice },
      rule,
    );
    if (!upd) {
      skipped++;
      continue;
    }
    const r = await admin.graphql(BULK_UPDATE, {
      variables: {
        productId,
        variants: [
          { id: upd.id, price: upd.price, compareAtPrice: upd.compareAtPrice },
        ],
      },
    });
    const out: any = (await r.json()).data?.productVariantsBulkUpdate;
    if (out?.userErrors?.length) {
      errors.push(`${node.title}: ${out.userErrors[0].message}`);
    } else {
      updated++;
    }
  }

  return { updated, skipped, errors };
}

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [percent, setPercent] = useState("-20");
  const [roundTo99, setRoundTo99] = useState(true);
  const [setCompareAt, setSetCompareAt] = useState(true);

  const resourceIds = useMemo(
    () => products.map((p) => ({ id: p.id })),
    [products],
  );
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(resourceIds);

  const rule: Rule = {
    operation: "percentage",
    percent: Number(percent) || 0,
    roundTo99,
    setCompareAtToOriginal: setCompareAt,
  };

  const rows = products.map((p, index) => {
    const selected = selectedResources.includes(p.id);
    const orig = parseMoney(p.price) ?? 0;
    const next = selected ? formatMoney(computeNewPrice(orig, rule)) : "—";
    return (
      <IndexTable.Row id={p.id} key={p.id} position={index} selected={selected}>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {p.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{p.price}</IndexTable.Cell>
        <IndexTable.Cell>{next}</IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page>
      <TitleBar title="BulkPrice — bulk price editor" />
      <BlockStack gap="500">
        {actionData && (
          <Banner tone={actionData.errors.length ? "warning" : "success"}>
            Updated {actionData.updated}, skipped {actionData.skipped}
            {actionData.errors.length
              ? ` — errors: ${actionData.errors.join("; ")}`
              : ""}
          </Banner>
        )}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Pricing rule
            </Text>
            <InlineStack gap="400" align="start" blockAlign="center">
              <TextField
                label="Percentage change (%)"
                type="number"
                value={percent}
                onChange={setPercent}
                autoComplete="off"
              />
              <Checkbox
                label="Round to .99"
                checked={roundTo99}
                onChange={setRoundTo99}
              />
              <Checkbox
                label="Set compare-at to original (show sale)"
                checked={setCompareAt}
                onChange={setSetCompareAt}
              />
            </InlineStack>

            {products.length === 0 ? (
              <Text as="p" variant="bodyMd" tone="subdued">
                No products found in this store. Add a product in Shopify admin,
                then reload.
              </Text>
            ) : (
              <IndexTable
                resourceName={{ singular: "product", plural: "products" }}
                itemCount={products.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Product" },
                  { title: "Current price" },
                  { title: "New price" },
                ]}
              >
                {rows}
              </IndexTable>
            )}

            <Form method="post">
              <input type="hidden" name="rule" value={JSON.stringify(rule)} />
              <input
                type="hidden"
                name="ids"
                value={JSON.stringify(selectedResources)}
              />
              <Button
                submit
                variant="primary"
                loading={isSubmitting}
                disabled={selectedResources.length === 0}
              >
                {`Apply to ${selectedResources.length} product${
                  selectedResources.length === 1 ? "" : "s"
                }`}
              </Button>
            </Form>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
