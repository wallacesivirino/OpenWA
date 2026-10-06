import {
  normalizeRejectMessage,
  REJECT_REPLY_COOLDOWN_MS,
  resetRejectReplyCooldown,
  shouldReplyToRejectedCaller,
} from './call-reject-reply';

describe('call reject reply', () => {
  beforeEach(() => resetRejectReplyCooldown());

  it('trims the message and treats blank as disabled', () => {
    expect(normalizeRejectMessage('  Ligue normalmente.  ')).toBe('Ligue normalmente.');
    expect(normalizeRejectMessage('   ')).toBeNull();
    expect(normalizeRejectMessage(undefined)).toBeNull();
    expect(normalizeRejectMessage(42)).toBeNull();
  });

  it('replies to the first rejected call', () => {
    expect(shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000)).toBe(true);
  });

  // The failure this exists for: a rejected caller redialling and getting the text every time.
  it('stays quiet when the same caller redials inside the window', () => {
    shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000);
    expect(shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000 + 60_000)).toBe(false);
  });

  it('replies again once the window has passed', () => {
    shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000);
    expect(shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000 + REJECT_REPLY_COOLDOWN_MS)).toBe(true);
  });

  it('keeps the window per session and per caller', () => {
    shouldReplyToRejectedCaller('s1', '5527999998888@c.us', 1_000);
    expect(shouldReplyToRejectedCaller('s2', '5527999998888@c.us', 2_000)).toBe(true);
    expect(shouldReplyToRejectedCaller('s1', '5511988887777@c.us', 2_000)).toBe(true);
  });
});
