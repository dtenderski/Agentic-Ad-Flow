/**
 * Pure helper that decides whether to block or warn on a push where some
 * ad sets resolved to zero interests. Keeping this logic free of I/O makes
 * it straightforward to unit-test without mocking Express, DB, or Meta APIs.
 */

export interface AdSetResolutionResult {
  id: number;
  name: string;
  /** Interests that were actually resolved (empty = nothing matched). */
  resolved: { id: string; name: string }[];
  /** True when the ad set had interest input data (names or pre-resolved IDs)
   *  before resolution was attempted. False means the ad set carried no
   *  interest data at all in the database. */
  hadInput: boolean;
  /** Number of name-based lookups that threw an error (vs returned null). */
  errorCount: number;
}

export interface InterestGateResult {
  /** When true the caller should abort the push and return the blockError. */
  blocked: boolean;
  blockError?: string;
  /** Non-empty when zero-interest ad sets exist but blocking is not active. */
  warnings: string[];
}

/**
 * Evaluate interest resolution results and return a block/warn decision.
 *
 * @param adsets       Per-ad-set resolution summary from the pre-pass.
 * @param allowZero    When true, zero-interest ad sets produce warnings instead
 *                     of a hard block.  Set from `ALLOW_ZERO_INTEREST_PUSH=true`.
 */
export function checkInterestGate(
  adsets: AdSetResolutionResult[],
  allowZero: boolean
): InterestGateResult {
  const warnings: string[] = [];

  const zeroAdsets = adsets.filter((a) => a.resolved.length === 0);
  if (zeroAdsets.length === 0) {
    return { blocked: false, warnings };
  }

  const descriptions = zeroAdsets.map((a) => {
    if (!a.hadInput) return `"${a.name}" (no interest data)`;
    if (a.errorCount > 0) return `"${a.name}" (lookup errors — possible transient Meta API issue)`;
    return `"${a.name}" (interests not found in Meta's catalogue)`;
  });

  if (!allowZero) {
    return {
      blocked: true,
      blockError:
        `Push blocked: the following ad sets have no resolvable interest targeting — ` +
        descriptions.join(", ") +
        `. Fix interest data or set ALLOW_ZERO_INTEREST_PUSH=true to push with warnings.`,
      warnings: [],
    };
  }

  // Warn-only mode
  for (const desc of descriptions) {
    warnings.push(`Ad set ${desc} has no interest targeting — audience is unrestricted`);
  }
  return { blocked: false, warnings };
}
