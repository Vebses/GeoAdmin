import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrashPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          წაშლილი ჩანაწერები 30 დღის შემდეგ სამუდამოდ წაიშლება
        </p>
        <Button variant="destructive" size="sm">
          <Trash2 size={14} className="mr-1" />
          ნაგვის დაცლა
        </Button>
      </div>

      {/* Placeholder content */}
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            ნაგავი ცარიელია
          </h3>
          <p className="text-xs text-gray-500">
            წაშლილი ჩანაწერები აქ გამოჩნდება.
            ეს გვერდი იმპლემენტირდება Phase 10-ში.
          </p>
        </div>
      </div>
    </div>
  );
}
