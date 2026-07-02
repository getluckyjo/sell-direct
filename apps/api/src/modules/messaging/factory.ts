import type { MessagingAdapter } from './types';
import {
  WhatsAppCloudAdapter,
  loadWhatsAppConfigFromEnv,
} from './whatsapp-cloud';
import { TwilioWhatsAppAdapter, loadTwilioConfigFromEnv } from './twilio';

export type BspName = 'meta' | 'twilio';

/** Which BSP the API talks WhatsApp through — set `WHATSAPP_BSP=twilio` to switch. */
export function selectedBsp(env: NodeJS.ProcessEnv = process.env): BspName {
  return (env.WHATSAPP_BSP ?? 'meta').toLowerCase() === 'twilio'
    ? 'twilio'
    : 'meta';
}

/**
 * Build the messaging adapter for the configured BSP. Business logic depends
 * only on the `MessagingAdapter` interface, so switching providers is one env
 * var — no code change.
 */
export function createMessagingAdapter(
  env: NodeJS.ProcessEnv = process.env,
): MessagingAdapter {
  if (selectedBsp(env) === 'twilio') {
    return new TwilioWhatsAppAdapter(loadTwilioConfigFromEnv(env));
  }
  return new WhatsAppCloudAdapter(loadWhatsAppConfigFromEnv(env));
}

/** The number outbound messages are sent from (for persistence records). */
export function senderNumber(env: NodeJS.ProcessEnv = process.env): string {
  return selectedBsp(env) === 'twilio'
    ? (env.TWILIO_WHATSAPP_FROM ?? '')
    : (env.WHATSAPP_PHONE_NUMBER_ID ?? '');
}
