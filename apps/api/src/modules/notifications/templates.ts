/**
 * Approved WhatsApp template registry. Each key maps to a Twilio Content SID
 * (`HX…`) via env — the `TEMPLATE_<KEY>` lines printed by
 * `scripts/twilio-templates.mjs`. A missing SID means "not approved/configured
 * yet"; callers then fall back to plain session text, so the app works before
 * approvals land and upgrades to templates the moment the env is set.
 */

export const TEMPLATE_KEYS = [
  'welcome_consent',
  'prequal_invite',
  'prequal_result',
  'otp_status',
  'bond_approved',
  'fica_checklist',
  'compliance_certs',
  'transfer_status',
  'reengagement',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export type TemplateConfig = Partial<Record<TemplateKey, string>>;

export function loadTemplateConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TemplateConfig {
  const config: TemplateConfig = {};
  for (const key of TEMPLATE_KEYS) {
    const sid = env[`TEMPLATE_${key.toUpperCase()}`];
    if (sid) config[key] = sid;
  }
  return config;
}
