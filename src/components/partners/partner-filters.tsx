'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

interface PartnerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string | null;
  onCategoryChange: (value: string | null) => void;
}

export function PartnerFilters({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
}: PartnerFiltersProps) {
  const { data: categories } = useCategories();
  const hasFilters = search || categoryId;

  const handleClear = () => {
    onSearchChange('');
    onCategoryChange(null);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ძიება სახელით, კოდით..."
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X size={12} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <Select
        value={categoryId || 'all'}
        onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-48 h-9">
          <SelectValue placeholder="ყველა კატეგორია" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ყველა კატეგორია</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                />
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 text-gray-500"
        >
          <X size={14} className="mr-1" />
          გასუფთავება
        </Button>
      )}
    </div>
  );
}
