import type { DealStage } from '@sell-direct/shared';
import type { TemplateKey } from '../notifications/templates';

/** What the notifier needs to message the parties about a stage change. */
export interface StageNotifyContext {
  /** Listing title / address shown in messages. */
  property: string;
  buyerPhone: string;
  sellerPhone?: string;
  /** Optional human note from the operator (overrides the default sentence). */
  note?: string;
  /** bond_granted extras (from the transition request, if known). */
  bank?: string;
  amountZar?: string;
}

export interface StageNotification {
  to: string;
  /** Approved template to use when configured; text is the session fallback. */
  templateKey?: TemplateKey;
  variables?: Record<string, string>;
  text: string;
}

/**
 * Map a deal-stage transition to the WhatsApp updates each party should get.
 * Pure — no I/O — so the journey messaging is unit-testable on its own.
 *
 * Template variables mirror docs/whatsapp-templates.md exactly:
 *   otp_status(1=property, 2=sentence) · bond_approved(1,2=bank,3=amount) ·
 *   fica_checklist(1,2=party) · compliance_certs(1) · transfer_status(1,2,3).
 */
export function buildStageNotifications(
  to: DealStage,
  ctx: StageNotifyContext,
): StageNotification[] {
  const both = (n: Omit<StageNotification, 'to'>): StageNotification[] => {
    const out: StageNotification[] = [{ ...n, to: ctx.buyerPhone }];
    if (ctx.sellerPhone) out.push({ ...n, to: ctx.sellerPhone });
    return out;
  };
  const transfer = (
    stage: string,
    detail: string,
  ): Omit<StageNotification, 'to'> => ({
    templateKey: 'transfer_status',
    variables: { '1': ctx.property, '2': stage, '3': detail },
    text: `📌 Transfer update for ${ctx.property}: ${stage}. ${detail}`,
  });

  switch (to) {
    case 'offer_otp': {
      const sentence =
        ctx.note ?? 'an Offer to Purchase is being prepared for signature';
      return both({
        templateKey: 'otp_status',
        variables: { '1': ctx.property, '2': sentence },
        text: `📄 Update on ${ctx.property}: ${sentence}. Reply here to respond.`,
      });
    }

    case 'bond_application':
      return [
        {
          to: ctx.buyerPhone,
          ...transfer(
            'Bond application submitted',
            ctx.note ??
              'Your application is with the banks — we’ll let you know the moment there’s a decision.',
          ),
        },
      ];

    case 'bond_granted': {
      const out: StageNotification[] = [];
      if (ctx.bank && ctx.amountZar) {
        out.push({
          to: ctx.buyerPhone,
          templateKey: 'bond_approved',
          variables: {
            '1': ctx.property,
            '2': ctx.bank,
            '3': ctx.amountZar,
          },
          text:
            `🏦 Your home loan for ${ctx.property} has been approved by ${ctx.bank} ` +
            `for ${ctx.amountZar}. Next we'll start the transfer with the conveyancing attorneys.`,
        });
      } else {
        // Bank/amount unknown → generic transfer update instead of a template
        // with blank variables (WhatsApp rejects empty substitutions).
        out.push({
          to: ctx.buyerPhone,
          ...transfer(
            'Home loan approved',
            ctx.note ??
              'Next we start the transfer with the conveyancing attorneys.',
          ),
        });
      }
      if (ctx.sellerPhone) {
        out.push({
          to: ctx.sellerPhone,
          ...transfer(
            'Buyer’s home loan approved',
            'The transfer now moves to the conveyancing attorneys.',
          ),
        });
      }
      return out;
    }

    case 'documents_fica': {
      const fica = (party: string): Omit<StageNotification, 'to'> => ({
        templateKey: 'fica_checklist',
        variables: { '1': ctx.property, '2': party },
        text:
          `To keep your transfer of ${ctx.property} moving, please send ${party}’s FICA ` +
          'documents: ID, proof of residence (≤3 months), and proof of source of funds. ' +
          'Reply with photos here — they’re stored securely.',
      });
      const out: StageNotification[] = [
        { to: ctx.buyerPhone, ...fica('the buyer') },
      ];
      if (ctx.sellerPhone)
        out.push({ to: ctx.sellerPhone, ...fica('the seller') });
      return out;
    }

    case 'clearance': {
      const out: StageNotification[] = [];
      if (ctx.sellerPhone) {
        out.push({
          to: ctx.sellerPhone,
          templateKey: 'compliance_certs',
          variables: { '1': ctx.property },
          text:
            `🔧 For ${ctx.property} we now arrange the compliance certificates (electrical, ` +
            "plumbing, gas, electric fence, beetle). We'll book inspectors and keep you posted — " +
            'no action needed yet.',
        });
      }
      out.push({
        to: ctx.buyerPhone,
        ...transfer(
          'Clearance & guarantees in progress',
          ctx.note ?? 'Rates clearance and bank guarantees are being arranged.',
        ),
      });
      return out;
    }

    case 'lodgement':
      return both(
        transfer(
          'Lodged at the Deeds Office',
          ctx.note ?? 'Registration usually follows in 7–10 working days.',
        ),
      );

    case 'registered':
      return both(
        transfer(
          'Registered 🎉',
          ctx.note ?? 'Ownership is now transferred — congratulations!',
        ),
      );

    case 'cancelled':
      // Sensitive — keep it plain text (in practice sent in-session by an agent).
      return both({
        text:
          `Update on ${ctx.property}: the transaction has been cancelled. ` +
          (ctx.note ?? 'Reply here and we’ll help with next steps.'),
      });

    // enquiry is the entry stage — no transition lands here, nothing to send.
    case 'enquiry':
    default:
      return [];
  }
}
