import { describe, it, expect } from "vitest";
import { filterByTitle } from "./filter";

const items = [
  { id: "1", title: "Red Snowboard" },
  { id: "2", title: "Blue Snowboard" },
  { id: "3", title: "Green Hat" },
];

describe("filterByTitle", () => {
  it("returns all items for an empty query", () => {
    expect(filterByTitle(items, "")).toHaveLength(3);
  });

  it("returns all items for a blank/whitespace query", () => {
    expect(filterByTitle(items, "   ")).toHaveLength(3);
  });

  it("matches case-insensitively", () => {
    expect(filterByTitle(items, "snow").map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("trims the query before matching", () => {
    expect(filterByTitle(items, "  hat ").map((i) => i.id)).toEqual(["3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterByTitle(items, "zzz")).toEqual([]);
  });
});
