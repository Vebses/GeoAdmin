'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { registerFonts } from './fonts';
import type { InvoiceWithRelations, OurCompany, Partner, CaseWithRelations, CurrencyCode } from '@/types';

// Register fonts
registerFonts();

// Translations
const translations = {
  en: {
    invoice: 'INVOICE',
    date: 'Date',
    case: 'Case',
    from: 'From',
    to: 'Bill To',
    patient: 'Patient',
    patientId: 'Patient ID',
    idCode: 'ID Code',
    service: 'Service Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    franchise: 'Franchise (Deductible)',
    total: 'Total Due',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    swift: 'SWIFT/BIC',
    account: 'Account',
    signature: 'Authorized Signature',
    stamp: 'Company Seal',
    footer: 'Thank you for your business',
  },
  ka: {
    invoice: 'ინვოისი',
    date: 'თარიღი',
    case: 'ქეისი',
    from: 'გამომგზავნი',
    to: 'ადრესატი',
    patient: 'პაციენტი',
    patientId: 'პირადი №',
    idCode: 'საიდ. კოდი',
    service: 'სერვისის აღწერა',
    qty: 'რაოდ.',
    unitPrice: 'ფასი',
    amount: 'თანხა',
    subtotal: 'ჯამი',
    franchise: 'ფრანშიზა',
    total: 'სულ გადასახდელი',
    bankDetails: 'საბანკო რეკვიზიტები',
    bank: 'ბანკი',
    swift: 'SWIFT/BIC',
    account: 'ანგარიში',
    signature: 'ხელმოწერა',
    stamp: 'ბეჭედი',
    footer: 'გმადლობთ თანამშრომლობისთვის',
  },
};

// Currency formatting
const currencySymbols: Record<CurrencyCode, string> = {
  GEL: '₾',
  EUR: '€',
  USD: '$',
};

function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = currencySymbols[currency] || currency;
  return `${amount.toFixed(2)} ${symbol}`;
}

function formatDate(dateStr: string, language: 'en' | 'ka'): string {
  const date = new Date(dateStr);
  if (language === 'ka') {
    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'FiraGO',
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  // Header accent
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#3b82f6',
  },
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
  },
  companyInfo: {
    maxWidth: 220,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 100,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: '#111827',
  },
  companyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  // Invoice info (right side)
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 600,
    color: '#3b82f6',
    marginBottom: 8,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  invoiceMetaLabel: {
    color: '#9ca3af',
  },
  // Parties section
  partiesSection: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  partyBox: {
    flex: 1,
    paddingRight: 20,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  // Services table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableFranchiseRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 500,
    color: '#111827',
  },
  tableCellRed: {
    fontSize: 10,
    fontWeight: 500,
    color: '#dc2626',
  },
  // Column widths
  colNum: { width: '8%' },
  colService: { width: '52%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colAmount: { width: '15%', textAlign: 'right' },
  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#111827',
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#111827',
  },
  totalLabelFinal: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
  },
  totalValueFinal: {
    fontSize: 14,
    fontWeight: 700,
    color: '#3b82f6',
  },
  totalRedValue: {
    fontSize: 10,
    color: '#dc2626',
  },
  // Bank details
  bankSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  bankTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bankGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  bankItem: {
    flex: 1,
  },
  bankLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  bankValue: {
    fontSize: 10,
    fontWeight: 500,
    color: '#111827',
  },
  // Signatures
  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    marginBottom: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  signatureImage: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#9ca3af',
  },
  stampBox: {
    alignItems: 'center',
  },
  stampPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampImage: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  stampText: {
    fontSize: 7,
    color: '#93c5fd',
    textAlign: 'center',
  },
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  footerCompany: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 4,
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
  const subtotal = services.reduce((sum, s) => sum + (s.total || 0), 0);
  const franchiseAmount = invoice.franchise_amount || 0;
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
        {/* Header accent bar */}
        <View style={styles.headerAccent} fixed />
        
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
            <Text style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaLabel}>{t.date}: </Text>
              {formatDate(invoice.created_at, language)}
            </Text>
            <Text style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaLabel}>{t.case}: </Text>
              {caseData.case_number}
            </Text>
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
                {service.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {service.quantity || 1}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCurrency(service.unit_price || 0, currency)}
              </Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>
                {formatCurrency(service.total || 0, currency)}
              </Text>
            </View>
          ))}
          
          {/* Franchise Row (if applicable) */}
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
              <Text style={styles.bankValue}>{sender.bank_name}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>{t.swift}</Text>
              <Text style={styles.bankValue}>{sender.bank_code}</Text>
            </View>
            <View style={[styles.bankItem, { flex: 2 }]}>
              <Text style={styles.bankLabel}>{t.account} ({currency})</Text>
              <Text style={styles.bankValue}>{getBankAccount()}</Text>
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
          <Text style={styles.footerText}>{t.footer}</Text>
          <Text style={styles.footerCompany}>
            {sender.name} • {sender.email} • {sender.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDF;
