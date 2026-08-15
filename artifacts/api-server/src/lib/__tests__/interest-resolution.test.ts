/**
 * Tests for resolveInterests() — the function that turns raw interest names
 * and pre-resolved objects into the final { id, name }[] list Meta expects.
 *
 * Covers:
 *   - All names unresolvable → empty resolved list + zero errorCount
 *   - All names resolvable → full resolved list
 *   - Mixed → only matched names included
 *   - Pre-resolved interests pass through without API calls
 *   - Combined pre-resolved + name-based, capped at 5 total
 *   - Search API errors counted in errorCount, interest skipped (no throw)
 */

import { describe, it, expect, vi } from "vitest";
import { resolveInterests } from "../meta-ads";

type SearchFn = (query: string) => Promise<{ id: string; name: string; audienceSize?: number } | null>;

describe("resolveInterests", () => {
  it("returns empty resolved list when all interest names fail to resolve", async () => {
    const searchFn: SearchFn = vi.fn().mockResolvedValue(null);

    const { resolved, errorCount } = await resolveInterests(["gaming", "fitness"], [], searchFn);
    expect(resolved).toHaveLength(0);
    expect(errorCount).toBe(0); // null = "not found", not an error
  });

  it("returns all resolved interests when names match successfully", async () => {
    const searchFn: SearchFn = vi.fn()
      .mockResolvedValueOnce({ id: "1", name: "Gaming" })
      .mockResolvedValueOnce({ id: "2", name: "Fitness" });

    const { resolved } = await resolveInterests(["gaming", "fitness"], [], searchFn);
    expect(resolved).toHaveLength(2);
    expect(resolved.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("skips unresolvable names and includes only successful ones", async () => {
    const searchFn: SearchFn = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "2", name: "Fitness" });

    const { resolved } = await resolveInterests(["gaming", "fitness"], [], searchFn);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe("2");
  });

  it("passes pre-resolved interests through without calling the search function", async () => {
    const searchFn: SearchFn = vi.fn();
    const preResolved = [
      { id: "10", name: "Technology" },
      { id: "11", name: "Travel" },
    ];

    const { resolved } = await resolveInterests([], preResolved, searchFn);
    expect(resolved).toHaveLength(2);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it("combines pre-resolved and name-based interests, capped at 5 total", async () => {
    const preResolved = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
      { id: "4", name: "D" },
    ];
    const searchFn: SearchFn = vi.fn().mockResolvedValueOnce({ id: "5", name: "E" });

    const { resolved } = await resolveInterests(["e", "f"], preResolved, searchFn);
    expect(resolved).toHaveLength(5);
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith("e");
  });

  it("increments errorCount for API errors and skips the failing interest", async () => {
    const searchFn: SearchFn = vi.fn()
      .mockRejectedValueOnce(new Error("Meta API timeout"))
      .mockResolvedValueOnce({ id: "2", name: "Fitness" });

    const { resolved, errorCount } = await resolveInterests(["gaming", "fitness"], [], searchFn);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe("2");
    expect(errorCount).toBe(1);
  });
});
