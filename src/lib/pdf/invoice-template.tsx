import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, CurrencyCode } from '@/types';

// Translations - using English for Helvetica compatibility
const translations = {
  en: {
    invoice: 'INVOICE',
    date: 'Date',
    case: 'Case',
    to: 'Bill To',
    patient: 'Patient',
    patientId: 'Patient ID',
    idCode: 'ID Code',
    service: 'Service',
    qty: 'Qty',
    unitPrice: 'Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    franchise: 'Franchise',
    total: 'Total Due',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    swift: 'SWIFT',
    account: 'Account',
    signature: 'Signature',
    stamp: 'Seal',
  },
  ka: {
    invoice: 'INVOICE',
    date: 'Date',
    case: 'Case',
    to: 'Bill To',
    patient: 'Patient',
    patientId: 'Patient ID',
    idCode: 'ID Code',
    service: 'Service',
    qty: 'Qty',
    unitPrice: 'Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    franchise: 'Franchise',
    total: 'Total Due',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    swift: 'SWIFT',
    account: 'Account',
    signature: 'Signature',
    stamp: 'Seal',
  },
};

// Currency formatting
const currencySymbols: Record<CurrencyCode, string> = {
  GEL: 'GEL',
  EUR: 'EUR',
  USD: 'USD',
};

function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = currencySymbols[currency] || currency;
  return `${amount.toFixed(2)} ${symbol}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Compact styles for single page
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  companyInfo: {
    maxWidth: 200,
  },
  logo: {
    width: 80,
    height: 35,
    objectFit: 'contain',
    marginBottom: 5,
  },
  logoPlaceholder: {
    width: 80,
    height: 30,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  // Invoice info
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#3b82f6',
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 5,
  },
  invoiceMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  // Parties section
  partiesSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  partyBox: {
    flex: 1,
    paddingRight: 15,
  },
  partyLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
  },
  // Services table
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4,
  },
  tableFranchiseRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingVertical: 4,
    backgroundColor: '#fef2f2',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: 600,
  },
  tableCellRed: {
    fontSize: 8,
    fontWeight: 600,
    color: '#dc2626',
  },
  // Column widths
  colNum: { width: '6%' },
  colService: { width: '54%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colAmount: { width: '15%', textAlign: 'right' },
  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  totalsBox: {
    width: 160,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#111827',
  },
  totalLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 8,
    fontWeight: 600,
  },
  totalRedValue: {
    fontSize: 8,
    fontWeight: 600,
    color: '#dc2626',
  },
  totalLabelFinal: {
    fontSize: 10,
    fontWeight: 700,
  },
  totalValueFinal: {
    fontSize: 10,
    fontWeight: 700,
    color: '#3b82f6',
  },
  // Bank Details
  bankSection: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  bankTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 4,
  },
  bankGrid: {
    flexDirection: 'row',
  },
  bankItem: {
    flex: 1,
    marginRight: 10,
  },
  bankLabel: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 1,
  },
  bankValue: {
    fontSize: 8,
    fontWeight: 600,
  },
  // Signatures - compact
  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 15,
    marginTop: 5,
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 80,
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginBottom: 3,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  signatureImage: {
    width: 70,
    height: 25,
    objectFit: 'contain',
  },
  signatureLabel: {
    fontSize: 7,
    color: '#9ca3af',
  },
  stampBox: {
    alignItems: 'center',
  },
  stampPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampImage: {
    width: 40,
    height: 40,
    objectFit: 'contain',
  },
  stampText: {
    fontSize: 6,
    color: '#9ca3af',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

export interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
  sender: OurCompany;
  recipient: Partner;
  caseData: CaseWithRelations;
  language: 'en' | 'ka';
}

export function InvoicePDF({ invoice, sender, recipient, caseData, language }: InvoicePDFProps) {
  const t = translations[language];
  const currency = invoice.currency as CurrencyCode;
  
  // Parse services
  const services = invoice.services || [];
  
  // Calculate totals
  const subtotal = services.reduce((sum, s) => sum + ((s as any).amount || s.total || 0), 0);
  const franchiseAmount = (invoice as any).franchise || 0;
  const total = subtotal - franchiseAmount;
  
  // Get bank account based on currency
  const getBankAccount = () => {
    switch (currency) {
      case 'GEL': return sender.account_gel;
      case 'USD': return sender.account_usd;
      case 'EUR': 
      default: return sender.account_eur;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Company Info */}
          <View style={styles.companyInfo}>
            {sender.logo_url ? (
              <Image src={sender.logo_url} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{sender.name?.substring(0, 3).toUpperCase() || 'GEO'}</Text>
              </View>
            )}
            <Text style={styles.companyName}>{sender.legal_name || sender.name}</Text>
            <Text style={styles.companyDetail}>{t.idCode}: {sender.id_code}</Text>
            <Text style={styles.companyDetail}>{sender.address}</Text>
            <Text style={styles.companyDetail}>{sender.city}, {sender.country}</Text>
            <Text style={styles.companyDetail}>{sender.email}</Text>
            <Text style={styles.companyDetail}>{sender.phone}</Text>
          </View>
          
          {/* Invoice Info */}
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>{t.invoice}</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>{t.date}: {formatDate(invoice.created_at)}</Text>
            <Text style={styles.invoiceMeta}>{t.case}: {caseData.case_number}</Text>
          </View>
        </View>
        
        {/* Parties Section */}
        <View style={styles.partiesSection}>
          {/* Bill To */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{t.to}</Text>
            <Text style={styles.partyName}>{recipient.legal_name || recipient.name}</Text>
            {recipient.id_code && (
              <Text style={styles.partyDetail}>{t.idCode}: {recipient.id_code}</Text>
            )}
            {recipient.address && (
              <Text style={styles.partyDetail}>{recipient.address}</Text>
            )}
            {(recipient.city || recipient.country) && (
              <Text style={styles.partyDetail}>
                {[recipient.city, recipient.country].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          
          {/* Patient Info */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>{t.patient}</Text>
            <Text style={styles.partyName}>{caseData.patient_name}</Text>
            {caseData.patient_id && (
              <Text style={styles.partyDetail}>{t.patientId}: {caseData.patient_id}</Text>
            )}
          </View>
        </View>
        
        {/* Services Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colService]}>{t.service}</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>{t.qty}</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>{t.unitPrice}</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>{t.amount}</Text>
          </View>
          
          {/* Service Rows */}
          {services.map((service, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNum]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.tableCell, styles.colService]}>
                {(service as any).name || service.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {service.quantity || 1}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCurrency(service.unit_price || 0, currency)}
              </Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>
                {formatCurrency((service as any).amount || service.total || 0, currency)}
              </Text>
            </View>
          ))}
          
          {/* Franchise Row */}
          {franchiseAmount > 0 && (
            <View style={styles.tableFranchiseRow}>
              <Text style={[styles.tableCell, styles.colNum]}></Text>
              <Text style={[styles.tableCellRed, styles.colService]}>{t.franchise}</Text>
              <Text style={[styles.tableCell, styles.colQty]}></Text>
              <Text style={[styles.tableCell, styles.colPrice]}></Text>
              <Text style={[styles.tableCellRed, styles.colAmount]}>
                -{formatCurrency(franchiseAmount, currency)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.subtotal}</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text>
            </View>
            {franchiseAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.franchise}</Text>
                <Text style={styles.totalRedValue}>-{formatCurrency(franchiseAmount, currency)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>{t.total}</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(total, currency)}</Text>
            </View>
          </View>
        </View>
        
        {/* Bank Details */}
        <View style={styles.bankSection}>
          <Text style={styles.bankTitle}>{t.bankDetails}</Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>{t.bank}</Text>
              <Text style={styles.bankValue}>{sender.bank_name || '-'}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>{t.swift}</Text>
              <Text style={styles.bankValue}>{sender.bank_code || '-'}</Text>
            </View>
            <View style={[styles.bankItem, { flex: 2 }]}>
              <Text style={styles.bankLabel}>{t.account} ({currency})</Text>
              <Text style={styles.bankValue}>{getBankAccount() || '-'}</Text>
            </View>
          </View>
        </View>
        
        {/* Signatures */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {sender.signature_url && (
                <Image src={sender.signature_url} style={styles.signatureImage} />
              )}
            </View>
            <Text style={styles.signatureLabel}>{t.signature}</Text>
          </View>
          
          <View style={styles.stampBox}>
            {sender.stamp_url ? (
              <Image src={sender.stamp_url} style={styles.stampImage} />
            ) : (
              <View style={styles.stampPlaceholder}>
                <Text style={styles.stampText}>{t.stamp}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {sender.name} • {sender.email} • {sender.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
