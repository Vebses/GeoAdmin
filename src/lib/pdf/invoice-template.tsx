import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Rect,
} from '@react-pdf/renderer';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, CurrencyCode } from '@/types';

// Brand palette (matches the Geoassistance Word template)
const RED = '#E8332C';
const BLUE = '#1E5C82';
const LIGHT_BLUE = '#DCE9F5';
const INK = '#1f2937';

// Currency formatting
const currencySymbols: Record<CurrencyCode, string> = {
  GEL: '₾',
  EUR: '€',
  USD: '$',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ------------------------------------------------------------------
// Small stroke icons (lucide-style geometry) drawn with react-pdf SVG
// ------------------------------------------------------------------
interface IconProps {
  size?: number;
  color?: string;
}

const iconDefaults = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function PersonIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="7" r="4" stroke={color} {...iconDefaults} />
      <Path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function PatientIcon({ size = 9, color = RED }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="7" r="4" stroke={color} {...iconDefaults} />
      <Path d="M5 21v-2a7 7 0 0 1 9 -6.7" stroke={color} {...iconDefaults} />
      <Path d="M18 14v6M15 17h6" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function PinIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21.7C17.3 17 20 13 20 9.5a8 8 0 1 0 -16 0c0 3.5 2.7 7.5 8 12.2z" stroke={color} {...iconDefaults} />
      <Circle cx="12" cy="9.5" r="2.8" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function PhoneIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.72-1.11a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z"
        stroke={color}
        {...iconDefaults}
      />
    </Svg>
  );
}

function DocIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} {...iconDefaults} />
      <Path d="M14 2v6h6M9 13h6M9 17h6" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function CalendarIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} {...iconDefaults} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function HashIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function StampIcon({ size = 9, color = BLUE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" stroke={color} {...iconDefaults} />
      <Path d="M9 11.5l2 2 4-4.5" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function BankIcon({ size = 9, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 21h18M4 10h16M6 6.5 12 3l6 3.5M5 10v11M19 10v11M9 14v4M15 14v4" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

function CardIcon({ size = 9, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} {...iconDefaults} />
      <Path d="M2 10h20" stroke={color} {...iconDefaults} />
    </Svg>
  );
}

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'FiraGO',
    color: INK,
    backgroundColor: '#ffffff',
  },
  // Top red rule
  topRule: {
    height: 4,
    backgroundColor: RED,
    marginBottom: 14,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 118,
    height: 52,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 118,
    height: 40,
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 16,
    fontWeight: 700,
    color: RED,
  },
  headerInfo: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 10,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  headerInfoText: {
    fontSize: 7.5,
    color: BLUE,
    marginLeft: 4,
    maxWidth: 230,
    lineHeight: 1.35,
  },
  headerTitleBox: {
    alignItems: 'flex-end',
  },
  headerTitleKa: {
    fontSize: 15,
    fontWeight: 700,
    color: RED,
  },
  headerTitleEn: {
    fontSize: 11,
    fontWeight: 500,
    color: BLUE,
    letterSpacing: 2.5,
    marginTop: 2,
  },
  // Blue rule under header
  headerRule: {
    height: 2.5,
    backgroundColor: BLUE,
    marginTop: 12,
    marginBottom: 18,
  },
  // Two-column panels
  panelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelColumn: {
    width: '48.5%',
  },
  panelHeaderBlue: {
    backgroundColor: BLUE,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  panelHeaderRed: {
    backgroundColor: RED,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  panelHeaderText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  panelBody: {
    backgroundColor: LIGHT_BLUE,
    paddingVertical: 11,
    paddingHorizontal: 10,
    minHeight: 112,
  },
  billToGroup: {
    marginBottom: 10,
  },
  billToLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billToLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: BLUE,
    marginLeft: 5,
  },
  billToValue: {
    fontSize: 9,
    fontWeight: 600,
    color: INK,
    marginLeft: 14,
    marginTop: 3,
  },
  billToValueSub: {
    fontSize: 7.5,
    color: '#4b5563',
    marginLeft: 14,
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: BLUE,
    marginLeft: 5,
    width: 58,
  },
  detailValue: {
    fontSize: 8.5,
    color: INK,
    flex: 1,
  },
  // Services table
  table: {
    marginTop: 18,
  },
  tableHeaderRow: {
    flexDirection: 'row',
  },
  tableHeadCell: {
    backgroundColor: BLUE,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 1.5,
    borderRightColor: '#ffffff',
  },
  tableHeadCellLast: {
    backgroundColor: RED,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeadText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    minHeight: 18,
  },
  tableRowStriped: {
    backgroundColor: LIGHT_BLUE,
  },
  tableCellText: {
    fontSize: 8.5,
    color: INK,
  },
  tableCellRed: {
    fontSize: 8.5,
    fontWeight: 600,
    color: RED,
  },
  colDescription: { width: '55%', paddingHorizontal: 8 },
  colQty: { width: '13%', textAlign: 'center', paddingHorizontal: 8 },
  colUnit: { width: '13%', textAlign: 'right', paddingHorizontal: 8 },
  colAmount: { width: '19%', textAlign: 'right', paddingHorizontal: 8 },
  // Manager + totals
  belowTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  managerLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    color: BLUE,
    marginLeft: 5,
  },
  managerLine: {
    width: 120,
    borderBottomWidth: 0.8,
    borderBottomColor: '#6b7280',
    marginLeft: 5,
    minHeight: 9,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  managerName: {
    fontSize: 8.5,
    color: INK,
    marginBottom: 1,
  },
  totalsBox: {
    width: 200,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  subtotalLabel: {
    fontSize: 8.5,
    fontWeight: 600,
    color: INK,
  },
  subtotalValue: {
    fontSize: 8.5,
    fontWeight: 600,
    color: INK,
  },
  franchiseValue: {
    fontSize: 8.5,
    fontWeight: 600,
    color: RED,
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  totalLabelBox: {
    backgroundColor: BLUE,
    width: '45%',
    paddingVertical: 6,
    justifyContent: 'center',
  },
  totalLabelText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  totalValueBox: {
    backgroundColor: RED,
    width: '55%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  totalValueText: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'right',
  },
  // Bottom band: signature / stamp / bank details
  bottomBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 12,
  },
  signatureBlock: {
    width: 180,
    marginBottom: 16,
  },
  signatureLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8.5,
    fontWeight: 600,
    color: INK,
    marginLeft: 5,
  },
  signatureLine: {
    height: 34,
    borderBottomWidth: 1,
    borderBottomColor: INK,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  signatureImage: {
    width: 110,
    height: 32,
    objectFit: 'contain',
    marginBottom: -2,
  },
  stampBlock: {
    alignItems: 'center',
  },
  stampLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stampLabel: {
    fontSize: 8.5,
    fontWeight: 600,
    color: INK,
    marginLeft: 5,
  },
  stampImage: {
    width: 84,
    height: 84,
    objectFit: 'contain',
  },
  stampPlaceholder: {
    width: 84,
    height: 84,
  },
  bankBox: {
    backgroundColor: BLUE,
    width: 215,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    minHeight: 122,
  },
  bankTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bankName: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#ffffff',
    marginLeft: 5,
  },
  bankDetail: {
    fontSize: 7.5,
    color: '#ffffff',
    marginLeft: 5,
  },
});

export interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  language: 'en' | 'ka';
  logoBase64?: string;
  signatureBase64?: string;
  stampBase64?: string;
}

// The table keeps a fixed minimum number of striped rows so short invoices
// still look like the printed Geoassistance form.
const MIN_TABLE_ROWS = 11;

export function InvoicePDF({
  invoice,
  sender,
  recipient,
  caseData,
  language: _language,
  logoBase64,
  signatureBase64,
  stampBase64,
}: InvoicePDFProps) {
  const currency = invoice.currency as CurrencyCode;
  const symbol = currencySymbols[currency] || currency;

  // PostgREST embeds carry no order guarantee — sort by the user's arrangement
  const services = [...(invoice.services || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  // Calculate totals (prefer stored values, fall back to computing)
  const computedSubtotal = services.reduce(
    (sum, s) => sum + ((s as any).amount || s.total || 0),
    0
  );
  const subtotal = invoice.subtotal || computedSubtotal;
  const franchiseAmount = invoice.franchise_amount || (invoice as any).franchise || 0;
  const total = Math.max(0, invoice.total ?? subtotal - franchiseAmount);

  const managerName =
    caseData.assigned_user?.full_name || invoice.creator?.full_name || '';

  // Get bank account based on currency
  const getBankAccount = () => {
    switch (currency) {
      case 'GEL': return sender.account_gel;
      case 'USD': return sender.account_usd;
      case 'EUR':
      default: return sender.account_eur;
    }
  };

  // Determine image sources - prefer base64 if available
  const logoSrc = logoBase64 || sender.logo_url;
  const signatureSrc = signatureBase64 || sender.signature_url;
  const stampSrc = stampBase64 || sender.stamp_url;

  const addressLine = [sender.address, sender.city, sender.country === 'GE' ? 'Georgia' : sender.country]
    .filter(Boolean)
    .join(', ');

  const emptyRowCount = Math.max(
    0,
    MIN_TABLE_ROWS - services.length - (franchiseAmount > 0 ? 1 : 0)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Red top rule */}
        <View style={styles.topRule} />

        {/* Header: logo / address+phone / bilingual title */}
        <View style={styles.header}>
          {logoSrc ? (
            <Image src={logoSrc} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>{sender.name}</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <View style={styles.headerInfoRow}>
              <PinIcon />
              <Text style={styles.headerInfoText}>{addressLine}</Text>
            </View>
            {sender.phone ? (
              <View style={styles.headerInfoRow}>
                <PhoneIcon />
                <Text style={styles.headerInfoText}>{sender.phone}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitleKa}>ანგარიშ-ფაქტურა</Text>
            <Text style={styles.headerTitleEn}>INVOICE</Text>
          </View>
        </View>

        {/* Blue rule under header */}
        <View style={styles.headerRule} />

        {/* BILL TO + INVOICE DETAILS panels */}
        <View style={styles.panelsRow}>
          {/* Bill To */}
          <View style={styles.panelColumn}>
            <View style={styles.panelHeaderBlue}>
              <Text style={styles.panelHeaderText}>BILL TO</Text>
            </View>
            <View style={styles.panelBody}>
              <View style={styles.billToGroup}>
                <View style={styles.billToLabelRow}>
                  <PersonIcon />
                  <Text style={styles.billToLabel}>Company / Insurance:</Text>
                </View>
                <Text style={styles.billToValue}>{recipient.legal_name || recipient.name}</Text>
                {recipient.id_code ? (
                  <Text style={styles.billToValueSub}>ID: {recipient.id_code}</Text>
                ) : null}
              </View>

              <View style={styles.billToGroup}>
                <View style={styles.billToLabelRow}>
                  <PatientIcon />
                  <Text style={styles.billToLabel}>Patient:</Text>
                </View>
                <Text style={styles.billToValue}>{caseData.patient_name}</Text>
                {caseData.patient_dob ? (
                  <Text style={styles.billToValueSub}>DOB: {formatDate(caseData.patient_dob)}</Text>
                ) : null}
              </View>

              <View style={[styles.billToGroup, { marginBottom: 0 }]}>
                <View style={styles.billToLabelRow}>
                  <DocIcon />
                  <Text style={styles.billToLabel}>Case Reference:</Text>
                </View>
                <Text style={styles.billToValue}>{caseData.case_number}</Text>
              </View>
            </View>
          </View>

          {/* Invoice Details */}
          <View style={styles.panelColumn}>
            <View style={styles.panelHeaderRed}>
              <Text style={styles.panelHeaderText}>INVOICE DETAILS</Text>
            </View>
            <View style={styles.panelBody}>
              <View style={styles.detailRow}>
                <DocIcon />
                <Text style={styles.detailLabel}>Invoice #</Text>
                <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
              </View>
              <View style={styles.detailRow}>
                <CalendarIcon />
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.created_at)}</Text>
              </View>
              <View style={styles.detailRow}>
                <CalendarIcon />
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>{formatDate((invoice as any).due_date)}</Text>
              </View>
              <View style={[styles.detailRow, { marginBottom: 0 }]}>
                <HashIcon />
                <Text style={styles.detailLabel}>Com/ID</Text>
                <Text style={styles.detailValue}>{sender.id_code}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <View style={[styles.tableHeadCell, { width: '55%' }]}>
              <Text style={styles.tableHeadText}>DESCRIPTION</Text>
            </View>
            <View style={[styles.tableHeadCell, { width: '13%' }]}>
              <Text style={[styles.tableHeadText, { textAlign: 'center' }]}>QTY</Text>
            </View>
            <View style={[styles.tableHeadCell, { width: '13%' }]}>
              <Text style={[styles.tableHeadText, { textAlign: 'center' }]}>UNIT</Text>
            </View>
            <View style={[styles.tableHeadCellLast, { width: '19%' }]}>
              <Text style={[styles.tableHeadText, { textAlign: 'center' }]}>AMOUNT</Text>
            </View>
          </View>

          {services.map((service, index) => (
            <View
              key={index}
              wrap={false}
              style={[styles.tableRow, ...(index % 2 === 0 ? [styles.tableRowStriped] : [])]}
            >
              <Text style={[styles.tableCellText, styles.colDescription]}>
                {(service as any).name || service.description}
              </Text>
              <Text style={[styles.tableCellText, styles.colQty]}>
                {service.quantity || 1}
              </Text>
              <Text style={[styles.tableCellText, styles.colUnit]}>
                {(service.unit_price || 0).toFixed(2)}
              </Text>
              <Text style={[styles.tableCellText, styles.colAmount]}>
                {((service as any).amount || service.total || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Franchise row */}
          {franchiseAmount > 0 && (
            <View
              wrap={false}
              style={[
                styles.tableRow,
                ...(services.length % 2 === 0 ? [styles.tableRowStriped] : []),
              ]}
            >
              <Text style={[styles.tableCellRed, styles.colDescription]}>Franchise</Text>
              <Text style={[styles.tableCellText, styles.colQty]}></Text>
              <Text style={[styles.tableCellText, styles.colUnit]}></Text>
              <Text style={[styles.tableCellRed, styles.colAmount]}>
                -{franchiseAmount.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Empty striped filler rows to mimic the printed form */}
          {Array.from({ length: emptyRowCount }).map((_, i) => {
            const rowIndex = services.length + (franchiseAmount > 0 ? 1 : 0) + i;
            return (
              <View
                key={`empty-${i}`}
                wrap={false}
                style={[styles.tableRow, ...(rowIndex % 2 === 0 ? [styles.tableRowStriped] : [])]}
              >
                <Text style={[styles.tableCellText, styles.colDescription]}> </Text>
              </View>
            );
          })}
        </View>

        {/* Manager + totals */}
        <View style={styles.belowTableRow} wrap={false}>
          <View style={styles.managerRow}>
            <PersonIcon />
            <Text style={styles.managerLabel}>Manager:</Text>
            <View style={styles.managerLine}>
              {managerName ? <Text style={styles.managerName}>{managerName}</Text> : null}
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{subtotal.toFixed(2)}</Text>
            </View>
            {franchiseAmount > 0 && (
              <View style={styles.subtotalRow}>
                <Text style={[styles.subtotalLabel, { color: RED }]}>Franchise</Text>
                <Text style={styles.franchiseValue}>-{franchiseAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <View style={styles.totalLabelBox}>
                <Text style={styles.totalLabelText}>TOTAL</Text>
              </View>
              <View style={styles.totalValueBox}>
                <Text style={styles.totalValueText}>
                  {total.toFixed(2)} {symbol}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signature / stamp / bank details */}
        <View style={styles.bottomBand} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLabelRow}>
              <PersonIcon color={INK} />
              <Text style={styles.signatureLabel}>ხელმოწერა / Signature</Text>
            </View>
            <View style={styles.signatureLine}>
              {signatureSrc && <Image src={signatureSrc} style={styles.signatureImage} />}
            </View>
          </View>

          <View style={styles.stampBlock}>
            <View style={styles.stampLabelRow}>
              <StampIcon color={INK} />
              <Text style={styles.stampLabel}>ბეჭედი / Stamp</Text>
            </View>
            {stampSrc ? (
              <Image src={stampSrc} style={styles.stampImage} />
            ) : (
              <View style={styles.stampPlaceholder} />
            )}
          </View>

          <View style={styles.bankBox}>
            <Text style={styles.bankTitle}>BANK DETAILS</Text>
            <View>
              <View style={styles.bankRow}>
                <BankIcon />
                <Text style={styles.bankName}>{sender.bank_name || '-'}</Text>
              </View>
              <View style={styles.bankRow}>
                <CardIcon />
                <Text style={styles.bankDetail}>Account: {getBankAccount() || '-'}</Text>
              </View>
              <View style={[styles.bankRow, { marginBottom: 0 }]}>
                <CardIcon />
                <Text style={styles.bankDetail}>SWIFT: {sender.bank_code || '-'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
