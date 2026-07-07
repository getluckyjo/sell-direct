#!/usr/bin/env python3
"""Generate the Paysoft technology-partnership brief (one page).

Numbers mirror the CA-reviewed model (docs/dataroom/sold-direct-model.xlsx).
Re-run after model changes:  python3 scripts/partner_brief_paysoft.py
Output: docs/dataroom/partner-brief-paysoft.pdf
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

OUT = 'docs/dataroom/partner-brief-paysoft.pdf'

INK = colors.HexColor('#0f172a')
BODY = colors.HexColor('#334155')
MUTED = colors.HexColor('#64748b')
GREEN = colors.HexColor('#059669')
HAIR = colors.HexColor('#e2e8f0')

s_brand = ParagraphStyle('brand', fontName='Helvetica-Bold', fontSize=13,
                         textColor=INK)
s_conf = ParagraphStyle('conf', fontName='Helvetica', fontSize=8.5,
                        textColor=MUTED, alignment=2)
s_title = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=21,
                         textColor=INK, spaceAfter=2)
s_date = ParagraphStyle('date', fontName='Helvetica', fontSize=10,
                        textColor=MUTED)
s_h = ParagraphStyle('h', fontName='Helvetica-Bold', fontSize=11,
                     textColor=GREEN, spaceBefore=8, spaceAfter=2)
s_p = ParagraphStyle('p', fontName='Helvetica', fontSize=9.2, leading=12.8,
                     textColor=BODY)
s_cell_k = ParagraphStyle('ck', fontName='Helvetica-Bold', fontSize=9,
                          leading=12, textColor=INK)
s_cell_v = ParagraphStyle('cv', fontName='Helvetica', fontSize=9,
                          leading=12, textColor=BODY)
s_foot = ParagraphStyle('foot', fontName='Helvetica', fontSize=7.4,
                        leading=9.6, textColor=MUTED)


def kv_table(rows, key_w=32):
    data = [[Paragraph(k, s_cell_k), Paragraph(v, s_cell_v)] for k, v in rows]
    t = Table(data, colWidths=[key_w * mm, (170 - key_w) * mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, HAIR),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18 * mm,
                        rightMargin=18 * mm, topMargin=13 * mm,
                        bottomMargin=11 * mm)

story = [
    Table(
        [[Paragraph('S O L D&nbsp;&nbsp;D I R E C T', s_brand),
          Paragraph('Confidential — technology partnership brief · Paysoft',
                    s_conf)]],
        colWidths=[85 * mm, 85 * mm],
        style=TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0),
                          ('RIGHTPADDING', (0, 0), (-1, -1), 0)]),
    ),
    Spacer(1, 3 * mm),
    HRFlowable(width='100%', thickness=1.2, color=GREEN),
    Spacer(1, 4 * mm),
    Paragraph("Let's build this together", s_title),
    Paragraph('July 2026 · A conversation starter, not a contract — every '
              'number and every line below is open for discussion.', s_date),

    Paragraph("What we're building", s_h),
    Paragraph(
        'Sold Direct is a WhatsApp-native platform that streamlines private '
        'property sales — 0% commission on the qualifying path, starting in '
        'prime Cape Town. The money comes from bond origination (in-house, '
        'direct with the banks, from Year 2), a 1% facilitation fee, bank '
        'sponsorship and fixed conveyancer panel advertising. Our '
        'CA-reviewed base case runs <b>R6.1m (Y1) → R162.3m (Y5)</b>, '
        'EBITDA-positive in Year 3, with <b>R10m strategic funding '
        'secured</b>. And it’s not a slide deck — the core product is '
        'live: the WhatsApp transaction loop, the deal tracker, an internal '
        'dashboard and two public sites, typed end-to-end and CI-gated with '
        '95 tests green.', s_p),

    Paragraph("Why Paysoft — honestly, it's three fits, not one", s_h),
    kv_table([
        ('Build capacity',
         'Our roadmap is specified, tested and CI-gated — we need senior '
         'delivery capacity, not discovery. Named workstreams ready to start: '
         'WhatsApp go-live hardening, the ooba/bank origination integration, '
         'e-signature, FICA pre-validation, conveyancer/bank status flows, '
         'portal syndication, dashboard buildout.'),
        ('Payments rails',
         'Your DebiCheck/debit-order and bulk-EFT rails are exactly the '
         'collections layer the platform needs: the 1% Flex fee, add-on '
         'services, and recurring conveyancer panel-advertising '
         'subscriptions. We bring transaction volume — 2,900 deals/yr by '
         'Year 5 plus a ~R50k/customer ecosystem menu; you bring the rails '
         'and earn on every movement.'),
        ('ID verification',
         "Paysoft's ID Verify (Home Affairs) slots straight into our FICA "
         'checklist flow — validating identity documents before the '
         'attorneys see them. In our bottleneck research, document rework is '
         'a top transfer-delay driver; this makes it a product feature.'),
    ], key_w=30),

    Paragraph("What we'd love from Paysoft", s_h),
    kv_table([
        ('A small squad', '2–4 developers (a senior/mid blend) for an '
                          'initial six months — technical leadership from '
                          'within the Paysoft team, product direction from '
                          'Johannes and Dean'),
        ('Our way of working', 'In our repository, our CI and our POPIA '
                               'conventions; a weekly demo; “done” '
                               'means deployed and tested'),
        ('A first sprint that shows off',
         'WhatsApp production go-live (Twilio) plus FICA pre-validation '
         'using your own ID Verify — live customer value in weeks, not '
         'quarters'),
    ], key_w=36),

    Paragraph('The deal we have in mind — tweak it, challenge it', s_h),
    kv_table([
        ('Founding equity', '<b>10% of Sold Direct at inception</b>, '
                            'alongside Johannes 30% · Dean 30% · Jan le Roux '
                            '5% (board) · strategic funder 25% (R10m). In '
                            'return, Paysoft backs the build: <b>preferred '
                            'development rates</b> for the platform plus a '
                            '<b>free-development allocation up to a value we '
                            'agree together</b> — and the stake vests as '
                            'that value is delivered. Skin in the game on '
                            'both sides.'),
        ('Paid work too', 'Beyond the free allocation, ongoing work is '
                          'billed at the preferred rate and funded from the '
                          'seed round’s product budget — real revenue '
                          'for Paysoft from day one, over and above the '
                          'equity'),
        ('Partner status', 'Exclusive payments & identity-verification '
                           'partner to the platform, with your standard '
                           'transaction fees on everything that moves — '
                           'collections, payouts and subscriptions across '
                           'the property ecosystem'),
        ('The upside', 'Our base-case model puts 10% at <b>~R68m</b> at a '
                       '~R811m Year-5 exit (8.3% post-Series A). '
                       'Model-grade, happily interrogated.'),
    ], key_w=30),

    Paragraph('Keeping it clean', s_h),
    Paragraph(
        'Because Sunday lunches matter more than cap tables, we’ve '
        'designed this so it never gets awkward: the equity vests against '
        'delivered value, the engagement terms are written down and '
        'arm’s-length, everything is disclosed to our strategic funder '
        'and board, IP sits with Sold Direct, there’s a simple SLA, and '
        'either side can step away on notice. If it ever stops working for '
        'Paysoft, it stops — no hard feelings, no tangled families.', s_p),

    Spacer(1, 3 * mm),
    Paragraph(
        '<b>Next step:</b> coffee with Johannes and Dean and a live '
        'walkthrough — the product on a phone, the model in a spreadsheet, '
        'the codebase on a laptop. Bring every hard question; we’d '
        'rather hear them now.', s_p),

    Spacer(1, 4 * mm),
    HRFlowable(width='100%', thickness=0.6, color=HAIR),
    Spacer(1, 2 * mm),
    Paragraph(
        'All figures are model-grade projections from the Sold Direct '
        'investor data room (July 2026), not audited forecasts. Nothing here '
        'constitutes an offer capable of acceptance; terms subject to '
        'contract and board approval.', s_foot),
]

doc.build(story)
print('wrote', OUT)
