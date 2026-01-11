'use client';

import { Pencil, Trash2, Shield, Phone, Building2, Truck, Pill, Stethoscope, Briefcase, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CategoryWithCount } from '@/types';

interface CategoryCardProps {
  category: CategoryWithCount;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
}

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  'phone-call': Phone,
  'building-2': Building2,
  truck: Truck,
  pill: Pill,
  stethoscope: Stethoscope,
  briefcase: Briefcase,
  folder: Folder,
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const Icon = iconMap[category.icon || 'folder'] || Folder;
  const canDelete = !category.is_system && (category.partners_count || 0) === 0;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-gray-100/50 transition-all duration-200',
        'group cursor-pointer'
      )}
      onClick={() => onEdit(category)}
    >
      <div className="flex items-start gap-3">
        {/* Icon with color */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <Icon
            size={20}
            style={{ color: category.color || '#6366f1' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {category.name}
            </h3>
            {category.is_system && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                სისტემური
              </span>
            )}
          </div>
          {category.name_en && (
            <p className="text-xs text-gray-400 mt-0.5">{category.name_en}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {category.partners_count || 0} პარტნიორი
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
        >
          <Pencil size={12} className="mr-1" />
          რედაქტირება
        </Button>
        {!category.is_system && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 text-xs',
              canDelete 
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
                : 'text-gray-300 cursor-not-allowed'
            )}
            disabled={!canDelete}
            onClick={(e) => {
              e.stopPropagation();
              if (canDelete) onDelete(category);
            }}
          >
            <Trash2 size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
