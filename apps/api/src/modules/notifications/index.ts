import type { MessagingAdapter } from '../messaging';
import type { MessageRepository } from '../messaging';
import type { ReplyOptions } from '../messaging';

export * from './templates';
export * from './opt-out';

export interface SendOptions {
  /** Send an approved template (Twilio Content SID / Meta template name). */
  templateId?: string;
  variables?: Record<string, string>;
  /**
   * Tappable reply options. Rendered natively where the provider supports it,
   * degraded to a keyword list where it does not — either way the flow works,
   * because every option id is a keyword the flows already parse.
   */
  interactive?: ReplyOptions;
}

/**
 * Outbound messaging seam. Flows call `notify.send(...)` to reply or push an
 * update; the notifier sends via the WhatsApp adapter and persists the outbound
 * message. Keeping this behind an interface means flows never touch a BSP.
 */
export interface Notifier {
  send(to: string, text: string, opts?: SendOptions): Promise<void>;
}

/**
 * A notifier backed by the messaging adapter + repository.
 *
 * `fromNumber` is recorded on the persisted outbound row (our display number).
 * A send failure is surfaced to the caller (the dispatcher logs & swallows it
 * so a delivery hiccup never fails the inbound webhook ack).
 */
export function createNotifier(
  adapter: MessagingAdapter,
  repository: MessageRepository,
  fromNumber: string,
): Notifier {
  return {
    async send(to, text, opts) {
      const result = await adapter.send({
        to,
        text,
        templateId: opts?.templateId,
        variables: opts?.variables,
        interactive: opts?.interactive,
      });
      await repository.recordOutbound({
        to,
        from: fromNumber,
        text,
        interactive: opts?.interactive,
        waMessageId: result.waMessageId,
      });
    },
  };
}
