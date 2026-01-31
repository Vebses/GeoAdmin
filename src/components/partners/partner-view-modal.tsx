'use client';

import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Hash,
  Briefcase,
  Receipt,
  Pencil,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import type { PartnerWithRelations } from '@/types';

interface PartnerViewModalProps {
  partner: PartnerWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (partner: PartnerWithRelations) => void;
}

// Info row component
function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  external = false
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  href?: string;
  external?: boolean;
}) {
  if (!value) return null;

  const content = (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5 break-words">{value}</p>
      </div>
      {href && external && (
        <ExternalLink size={12} className="text-gray-400 flex-shrink-0 mt-2" />
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="block hover:bg-gray-50 rounded-lg transition-colors -mx-2 px-2"
      >
        {content}
      </a>
    );
  }

  return content;
}

// Stats card component
function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'blue' | 'emerald' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} />
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

export function PartnerViewModal({
  partner,
  isOpen,
  onClose,
  onEdit
}: PartnerViewModalProps) {
  if (!isOpen || !partner) return null;

  const fullAddress = [partner.address, partner.city, partner.country]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${partner.category?.color || '#6366f1'}15` }}
              >
                <Building2
                  size={22}
                  style={{ color: partner.category?.color || '#6366f1' }}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{partner.name}</h2>
                {partner.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 mt-0.5"
                    style={{
                      borderColor: partner.category.color || '#6366f1',
                      color: partner.category.color || '#6366f1'
                    }}
                  >
                    {partner.category.name}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={Briefcase}
                label="ქეისები"
                value={partner.cases_count || 0}
                color="blue"
              />
              <StatCard
                icon={Receipt}
                label="ინვოისები"
                value={partner.invoices_count || 0}
                color="emerald"
              />
              <StatCard
                icon={FileText}
                label="თანხა"
                value={formatCurrency(partner.total_amount || 0, 'GEL')}
                color="purple"
              />
            </div>

            {/* Business Info */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">ბიზნეს ინფორმაცია</h3>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <InfoRow
                  icon={Building2}
                  label="იურიდიული სახელი"
                  value={partner.legal_name}
                />
                <InfoRow
                  icon={Hash}
                  label="საიდენტიფიკაციო კოდი"
                  value={partner.id_code}
                />
              </div>
            </div>

            {/* Contact Info */}
            {(partner.email || partner.phone || partner.website) && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">საკონტაქტო ინფორმაცია</h3>
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <InfoRow
                    icon={Mail}
                    label="ელ-ფოსტა"
                    value={partner.email}
                    href={partner.email ? `mailto:${partner.email}` : undefined}
                  />
                  <InfoRow
                    icon={Phone}
                    label="ტელეფონი"
                    value={partner.phone}
                    href={partner.phone ? `tel:${partner.phone}` : undefined}
                  />
                  <InfoRow
                    icon={Globe}
                    label="ვებგვერდი"
                    value={partner.website}
                    href={partner.website || undefined}
                    external
                  />
                </div>
              </div>
            )}

            {/* Address */}
            {fullAddress && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">მისამართი</h3>
                <div className="bg-gray-50 rounded-xl p-3">
                  <InfoRow
                    icon={MapPin}
                    label="მისამართი"
                    value={fullAddress}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            {partner.notes && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">შენიშვნები</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{partner.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Button variant="ghost" size="sm" onClick={onClose}>
              დახურვა
            </Button>
            <Button size="sm" onClick={() => onEdit(partner)}>
              <Pencil size={14} className="mr-1" />
              რედაქტირება
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
