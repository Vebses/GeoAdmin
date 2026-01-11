import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          სისტემის მომხმარებლები
        </p>
        <Button size="sm">
          <Plus size={14} className="mr-1" />
          ახალი მომხმარებელი
        </Button>
      </div>

      {/* Placeholder content */}
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            მომხმარებლების მოდული
          </h3>
          <p className="text-xs text-gray-500">
            ეს გვერდი იმპლემენტირდება Phase 8-ში.
            მომხმარებლების მართვა, როლები და უფლებები.
          </p>
        </div>
      </div>
    </div>
  );
}
