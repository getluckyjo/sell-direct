#!/usr/bin/env python3
"""Regenerate the board-invitation one-pager for Jan le Roux.

Numbers mirror the CA-reviewed model (docs/dataroom/sold-direct-model.xlsx):
update the model first, then re-run:  python3 scripts/board_invitation_jan.py
Output: docs/dataroom/board-invitation-jan.pdf
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = 'docs/dataroom/board-invitation-jan.pdf'

INK = colors.HexColor('#0f172a')
BODY = colors.HexColor('#334155')
MUTED = colors.HexColor('#64748b')
GREEN = colors.HexColor('#059669')
HAIR = colors.HexColor('#e2e8f0')

s_brand = ParagraphStyle('brand', fontName='Helvetica-Bold', fontSize=13,
                         textColor=INK)
s_conf = ParagraphStyle('conf', fontName='Helvetica', fontSize=8.5,
                        textColor=MUTED, alignment=2)
s_title = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=24,
                         textColor=INK, spaceAfter=2)
s_date = ParagraphStyle('date', fontName='Helvetica', fontSize=10,
                        textColor=MUTED)
s_h = ParagraphStyle('h', fontName='Helvetica-Bold', fontSize=11.5,
                     textColor=GREEN, spaceBefore=10, spaceAfter=3)
s_p = ParagraphStyle('p', fontName='Helvetica', fontSize=9.6, leading=13.6,
                     textColor=BODY)
s_cell_k = ParagraphStyle('ck', fontName='Helvetica-Bold', fontSize=9.4,
                          leading=12.5, textColor=INK)
s_cell_v = ParagraphStyle('cv', fontName='Helvetica', fontSize=9.4,
                          leading=12.5, textColor=BODY)
s_foot = ParagraphStyle('foot', fontName='Helvetica', fontSize=7.6,
                        leading=10, textColor=MUTED)


def kv_table(rows):
    data = [[Paragraph(k, s_cell_k), Paragraph(v, s_cell_v)] for k, v in rows]
    t = Table(data, colWidths=[34 * mm, 136 * mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, HAIR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18 * mm,
                        rightMargin=18 * mm, topMargin=14 * mm,
                        bottomMargin=12 * mm)

story = [
    Table(
        [[Paragraph('S O L D&nbsp;&nbsp;D I R E C T', s_brand),
          Paragraph('Confidential — for Jan le Roux', s_conf)]],
        colWidths=[100 * mm, 70 * mm],
        style=TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0),
                          ('RIGHTPADDING', (0, 0), (-1, -1), 0)]),
    ),
    Spacer(1, 3 * mm),
    HRFlowable(width='100%', thickness=1.2, color=GREEN),
    Spacer(1, 5 * mm),
    Paragraph('Board invitation', s_title),
    Paragraph('July 2026', s_date),

    Paragraph('One more build', s_h),
    Paragraph(
        "Jan — you built the machine that became SA's largest bond originator, "
        "and then you built the organisation that speaks for the industry "
        "itself. Sold Direct is where we believe that industry goes next, and "
        "we would rather build it with your judgement in the room than read "
        "your critique of it afterwards. This is a board invitation — five "
        "percent, non-executive, one more build.", s_p),

    Paragraph('What Sold Direct is', s_h),
    Paragraph(
        "A 0%-commission, WhatsApp-native way to sell property — launching in "
        "prime Cape Town, broadening into the upper market as the brand "
        "scales. Monetisation is legally clean and will look familiar: bond "
        "origination (via a multi-bank originator in Year 1, then in-house, "
        "direct with the banks, from Year 2 at ~1.5%), a 1% facilitation fee "
        "on cash deals, a bank headline sponsorship, and fixed conveyancer "
        "panel advertising — no referral fees, with the 30–40% panel discount "
        "passed to the consumer. Roughly R52–71k per deal without charging "
        "the seller a cent of commission. And it is positioned deliberately "
        "alongside the industry, not against it: we serve the segment that "
        "chooses to sell privately, we employ registered practitioners, and "
        "there is not one anti-agent line in our marketing "
        "(solddirect.co.za/compliance).", s_p),

    Paragraph('Why you — specifically', s_h),
    Paragraph(
        "Our single biggest revenue line from Year 2 is taking origination "
        "in-house under our own bank aggregation agreements. You wrote the "
        "playbook for that industry. Beyond origination: your principal "
        "registration anchors our PPRA licensing from day one, your name "
        "signals to banks and investors that this is a serious operation, and "
        "your four decades of judgement keeps a young founding team honest. "
        "The structure is deliberately non-executive — board cadence, not "
        "client hours — and we know it has to sit carefully alongside your "
        "current commitments. We'll respect whatever shape that requires.",
        s_p),

    Paragraph('The numbers (base case, model-grade — CA-reviewed)', s_h),
    kv_table([
        ('Revenue ramp', 'R6.1m (Y1) → R162.3m (Y5)'),
        ('Profitability', 'EBITDA-positive Y3 · ~17% margin by Y5 (base), '
                          '~37% aggressive · 27% tax modelled — numbers built '
                          'to survive diligence'),
        ('Capital', 'Breakeven on ~R7.5m · R10m strategic funding secured '
                    'against 20% · runway check: minimum cash position +R5.5m '
                    '— the seed alone covers the trough'),
        ('Valuation frame', 'R40m pre / R50m post at founding · Y5 EV '
                            'R649–974m (4–6× revenue)'),
    ]),

    Paragraph('The offer', s_h),
    kv_table([
        ('Equity', '5% — board allocation, vesting over the service period. '
                   'Working founders: Johannes 25% · Wilhelm 25% · Dean 25% · '
                   'Strategic funder 20% (R10m)'),
        ('Role', 'Non-executive director · registered principal for the '
                 "firm's PPRA licence · origination and bank-relationship "
                 'counsel'),
        ('Upside', 'Base-case model: 5% is worth ~R34m at the ~R811m Year-5 '
                   'exit (4.2% post-Series A)'),
    ]),

    Spacer(1, 4 * mm),
    Paragraph(
        '<b>Next step:</b> an hour with the three of us — full data room, '
        'live model, and the WhatsApp journey demo. Bring the hard questions; '
        "the model was built to be interrogated, and we'd value nothing more "
        'than your red pen.', s_p),

    Spacer(1, 5 * mm),
    HRFlowable(width='100%', thickness=0.6, color=HAIR),
    Spacer(1, 2 * mm),
    Paragraph(
        'All figures are model-grade projections from the Sold Direct '
        'investor data room (July 2026), not audited forecasts. Equity '
        'subject to board and shareholder agreements; nothing here '
        'constitutes financial advice.', s_foot),
]

doc.build(story)
print('wrote', OUT)
