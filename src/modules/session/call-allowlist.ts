/**
 * Digits-only comparison for the auto-reject allowlist.
 *
 * An operator types a number the way they read it — `+55 27 99929-1186`, `(27) 99929-1186`, or
 * pasted straight out of a webhook as `5527999291186@c.us`. Matching those literally would fail in
 * ways that look like the feature is broken, so both sides are reduced to their digits first.
 */
export function toDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Stored form of the list: digits only, de-duplicated, empties dropped. */
export function normalizeAllowlist(values: string[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const d = toDigits(v);
    if (d) seen.add(d);
  }
  return [...seen];
}

/**
 * Whether this caller is exempt from auto-reject.
 *
 * NOTE: a caller hidden behind a WhatsApp privacy id (`@lid`) carries no phone number, so its
 * digits can never match a listed number and it WILL be rejected. That is a limitation of the
 * identity WhatsApp hands us, not of the comparison.
 */
export function isCallerAllowed(from: string, allowlist: unknown): boolean {
  if (!Array.isArray(allowlist) || allowlist.length === 0) return false;
  const raw = String(from);
  // A privacy id is an opaque identifier, NOT a phone number, so its digits carry no relation to
  // any listed number — and the suffix rule below would happily match one by coincidence, letting
  // an unlisted caller through. Refused outright; the UI hint states this.
  if (raw.includes('@lid')) return false;
  const caller = toDigits(raw);
  if (!caller) return false;
  return allowlist.some(entry => {
    const listed = toDigits(String(entry));
    if (!listed) return false;
    if (listed === caller) return true;
    // Country-code tolerance. A caller always arrives fully qualified (`5527999291186`), but the
    // natural thing to type is the number as it is dialled locally (`27999291186`) — an exact
    // comparison would silently never match, and the operator would only find out by losing a
    // call. So a shorter entry matches when it is the tail of the caller, or vice versa.
    //
    // The 8-digit floor is what keeps that from becoming a wildcard: without it a 4-digit entry
    // would exempt every caller ending in those digits. The residual risk is a rare false ALLOW
    // (an unwanted call rings through), never a false reject.
    const [short, long] = listed.length <= caller.length ? [listed, caller] : [caller, listed];
    return short.length >= 8 && long.endsWith(short);
  });
}
