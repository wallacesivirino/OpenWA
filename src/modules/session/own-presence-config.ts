/**
 * Per-session `config.markOnlineOnConnect`: whether the account is announced online when the
 * connection opens.
 *
 * WhatsApp suppresses the paired phone's push notifications while any linked device is online, so a
 * 24/7 gateway that announces itself online silences the phone for good (#871). The server-wide
 * BAILEYS_MARK_ONLINE_ON_CONNECT sets what the socket announces on connect; this key overrides it for
 * one session by publishing the global presence right after each open, which needs no reconnect and
 * works on either engine.
 */

/** What the socket announces on connect when the session sets nothing (mirrors baileys-lifecycle). */
export function serverMarkOnlineDefault(): boolean {
  return process.env.BAILEYS_MARK_ONLINE_ON_CONNECT !== 'false';
}

/** The session's own choice, or undefined when it defers to the server default. */
export function configuredMarkOnline(config: Record<string, unknown> | null | undefined): boolean | undefined {
  const value = config?.markOnlineOnConnect;
  return typeof value === 'boolean' ? value : undefined;
}

/** What the session actually does: its own choice, else the server default. */
export function resolveMarkOnline(config: Record<string, unknown> | null | undefined): boolean {
  return configuredMarkOnline(config) ?? serverMarkOnlineDefault();
}
