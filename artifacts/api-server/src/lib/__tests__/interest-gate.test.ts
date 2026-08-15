/**
 * Route-level interest gate tests.
 *
 * `checkInterestGate` encapsulates the block/warn decision that the push route
 * makes after resolving ad-set interests.  Testing it as a pure function covers
 * the exact enforcement behaviour the route exposes without requiring HTTP /
 * DB / Meta API mocks.
 *
 * Scenarios covered:
 *   1. All ad sets resolve interests → no block, no warnings (push proceeds)
 *   2. An ad set resolves to zero interests (catalogue miss) → blocked by default
 *   3. An ad set resolves to zero interests but ALLOW_ZERO_INTEREST_PUSH → warn only
 *   4. An ad set resolves to zero due to API error → blocked, message mentions API error
 *   5. Ad set had no interest data at all → blocked, message mentions missing data
 *   6. Mixed: some resolve, one zero → only zero one is flagged
 */

import { describe, it, expect } from "vitest";
import { checkInterestGate, type AdSetResolutionResult } from "../interest-gate";

function makeAdset(
  overrides: Partial<AdSetResolutionResult> & { name: string }
): AdSetResolutionResult {
  return {
    id: 1,
    resolved: [],
    hadInput: true,
    errorCount: 0,
    ...overrides,
  };
}

describe("checkInterestGate — default block mode", () => {
  it("allows push when all ad sets have resolved interests", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [{ id: "1", name: "Gaming" }] }),
      makeAdset({ name: "Set B", resolved: [{ id: "2", name: "Fitness" }] }),
    ];
    const result = checkInterestGate(adsets, false);
    expect(result.blocked).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("blocks when an ad set resolves to zero interests (catalogue miss)", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [], hadInput: true, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, false);
    expect(result.blocked).toBe(true);
    expect(result.blockError).toMatch(/Push blocked/);
    expect(result.blockError).toMatch(/Set A/);
    expect(result.blockError).toMatch(/not found in Meta/);
  });

  it("block message mentions API error when errorCount > 0", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [], hadInput: true, errorCount: 2 }),
    ];
    const result = checkInterestGate(adsets, false);
    expect(result.blocked).toBe(true);
    expect(result.blockError).toMatch(/API issue/);
  });

  it("block message mentions missing data when hadInput is false", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [], hadInput: false, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, false);
    expect(result.blocked).toBe(true);
    expect(result.blockError).toMatch(/no interest data/);
  });

  it("only flags zero-interest ad sets, not successfully-resolved ones", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ id: 1, name: "Set A", resolved: [{ id: "1", name: "Gaming" }] }),
      makeAdset({ id: 2, name: "Set B", resolved: [], hadInput: true, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, false);
    expect(result.blocked).toBe(true);
    expect(result.blockError).not.toMatch(/Set A/);
    expect(result.blockError).toMatch(/Set B/);
  });
});

describe("checkInterestGate — warn-only mode (ALLOW_ZERO_INTEREST_PUSH=true)", () => {
  it("does not block when zero-interest ad sets exist in warn mode", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [], hadInput: true, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, true);
    expect(result.blocked).toBe(false);
    expect(result.blockError).toBeUndefined();
  });

  it("includes a warning per zero-interest ad set", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [], hadInput: true, errorCount: 0 }),
      makeAdset({ name: "Set B", resolved: [], hadInput: false, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, true);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.some((w) => w.includes("Set A"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("Set B"))).toBe(true);
  });

  it("does not warn about ad sets that resolved interests successfully", () => {
    const adsets: AdSetResolutionResult[] = [
      makeAdset({ name: "Set A", resolved: [{ id: "1", name: "Gaming" }] }),
      makeAdset({ name: "Set B", resolved: [], hadInput: true, errorCount: 0 }),
    ];
    const result = checkInterestGate(adsets, true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Set B");
  });
});
