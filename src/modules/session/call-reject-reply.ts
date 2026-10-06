/**
 * The courtesy message sent to a caller right after their call was auto-rejected
 * (`config.autoRejectCallsMessage`), e.g. "this number does not take WhatsApp calls, please call
 * the regular line".
 *
 * A rejected caller often redials straight away, and every attempt is a new `call.received`. One
 * message per attempt would flood them, so a caller gets it at most once per window per session.
 * The window lives here, in module state, because the call path (SessionEngineLeafEvents) is
 * deliberately stateless; losing it on a restart only means one extra message, which is harmless.
 */

/** A caller hears the message at most once in this window, per session. */
export const REJECT_REPLY_COOLDOWN_MS = 10 * 60 * 1000;

/** Above this many remembered callers, expired entries are swept so the map cannot grow forever. */
const SWEEP_ABOVE = 500;

const lastReply = new Map<string, number>();

/** Stored form of the message: trimmed; anything blank (or not a string) means "send nothing". */
export function normalizeRejectMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text : null;
}

/**
 * Whether this caller should get the message now. Records the reply when it says yes, so call it
 * only when you are about to send.
 */
export function shouldReplyToRejectedCaller(sessionId: string, from: string, now = Date.now()): boolean {
  const key = `${sessionId}|${from}`;
  const last = lastReply.get(key);
  if (last !== undefined && now - last < REJECT_REPLY_COOLDOWN_MS) return false;
  if (lastReply.size > SWEEP_ABOVE) {
    for (const [k, t] of lastReply) {
      if (now - t >= REJECT_REPLY_COOLDOWN_MS) lastReply.delete(k);
    }
  }
  lastReply.set(key, now);
  return true;
}

/** Test seam: forget every remembered caller. */
export function resetRejectReplyCooldown(): void {
  lastReply.clear();
}
