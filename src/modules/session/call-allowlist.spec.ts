import { isCallerAllowed, normalizeAllowlist, toDigits } from './call-allowlist';

describe('call allowlist', () => {
  it('reduces any typed format to digits', () => {
    expect(toDigits('+55 27 99929-1186')).toBe('5527999291186');
    expect(toDigits('5527999291186@c.us')).toBe('5527999291186');
  });

  it('de-duplicates and drops entries with no digits', () => {
    expect(normalizeAllowlist(['+55 27 99929-1186', '5527999291186', '  ', 'abc'])).toEqual(['5527999291186']);
  });

  it('matches the caller regardless of how the number was typed', () => {
    expect(isCallerAllowed('5527999291186@c.us', ['5527999291186'])).toBe(true);
  });

  // The failure this rule exists for: typing the number as it is dialled locally, without the
  // country code the caller always arrives with.
  it('matches an entry that omits the country code', () => {
    expect(isCallerAllowed('5527999291186@c.us', ['27999291186'])).toBe(true);
  });

  it('does not match a different number', () => {
    expect(isCallerAllowed('5527999291186@c.us', ['5511988887777'])).toBe(false);
  });

  it('refuses to treat a short entry as a wildcard', () => {
    expect(isCallerAllowed('5527999291186@c.us', ['1186'])).toBe(false);
  });

  // Regression: a privacy id is opaque, so suffix matching once let an unlisted @lid caller
  // through purely because the listed number happened to end with the same digits.
  it('never allows a privacy-id caller, even on a digit coincidence', () => {
    expect(isCallerAllowed('999291186@lid', ['5527999291186'])).toBe(false);
    expect(isCallerAllowed('5527999291186@lid', ['5527999291186'])).toBe(false);
  });

  it('is inert without a usable list or caller', () => {
    expect(isCallerAllowed('5527999291186@c.us', undefined)).toBe(false);
    expect(isCallerAllowed('5527999291186@c.us', [])).toBe(false);
    expect(isCallerAllowed('', ['5527999291186'])).toBe(false);
  });
});
