// Pure, framework-free product filtering used by the BulkPrice route.
// Kept separate from Shopify/Remix so it can be unit-tested in isolation.

export function filterByTitle<T extends { title: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (q === "") return items;
  return items.filter((item) => item.title.toLowerCase().includes(q));
}
