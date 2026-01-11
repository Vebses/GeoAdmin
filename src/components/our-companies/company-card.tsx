'use client';

import { Building, Star, Mail, Phone, Globe, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OurCompany } from '@/types';

interface CompanyCardProps {
  company: OurCompany;
  onEdit: (company: OurCompany) => void;
  onDelete: (company: OurCompany) => void;
}

export function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  const hasBank = company.bank_name || company.account_gel || company.account_usd || company.account_eur;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:shadow-gray-100/50 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <Building size={24} className="text-blue-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {company.name}
            </h3>
            {company.is_default && (
              <Badge variant="primary" className="text-[10px] gap-0.5">
                <Star size={10} />
                ძირითადი
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            ID: {company.id_code}
          </p>
          {company.city && (
            <p className="text-xs text-gray-400 mt-0.5">
              {company.city}, {company.country || 'საქართველო'}
            </p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
        {company.email && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail size={12} className="text-gray-400" />
            <a href={`mailto:${company.email}`} className="hover:text-blue-500">
              {company.email}
            </a>
          </div>
        )}
        {company.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={12} className="text-gray-400" />
            <a href={`tel:${company.phone}`} className="hover:text-blue-500">
              {company.phone}
            </a>
          </div>
        )}
        {company.website && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Globe size={12} className="text-gray-400" />
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 truncate"
            >
              {company.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Bank Info */}
      {hasBank && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={12} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-700">
              {company.bank_name}
              {company.bank_code && ` | ${company.bank_code}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {company.account_gel && (
              <Badge variant="outline" className="text-[10px]">GEL ✓</Badge>
            )}
            {company.account_usd && (
              <Badge variant="outline" className="text-[10px]">USD ✓</Badge>
            )}
            {company.account_eur && (
              <Badge variant="outline" className="text-[10px]">EUR ✓</Badge>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => onEdit(company)}
        >
          <Pencil size={12} className="mr-1" />
          რედაქტირება
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(company)}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
