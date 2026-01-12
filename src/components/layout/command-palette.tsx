'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Building2,
  Settings,
  Trash2,
  Plus,
  User,
  Tag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: typeof LayoutDashboard;
  action: () => void;
  keywords?: string[];
  group: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Open with Ctrl/Cmd + K
  useKeyboardShortcut(['mod+k'], () => setIsOpen(true), { ignoreInputs: false });

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', title: 'დეშბორდი', icon: LayoutDashboard, action: () => router.push('/dashboard'), group: 'ნავიგაცია', keywords: ['dashboard', 'home'] },
    { id: 'nav-cases', title: 'ქეისები', icon: FileText, action: () => router.push('/cases'), group: 'ნავიგაცია', keywords: ['cases', 'საქმეები'] },
    { id: 'nav-invoices', title: 'ინვოისები', icon: Receipt, action: () => router.push('/invoices'), group: 'ნავიგაცია', keywords: ['invoices', 'ფაქტურები'] },
    { id: 'nav-partners', title: 'პარტნიორები', icon: Users, action: () => router.push('/partners'), group: 'ნავიგაცია', keywords: ['partners'] },
    { id: 'nav-companies', title: 'ჩვენი კომპანიები', icon: Building2, action: () => router.push('/our-companies'), group: 'ნავიგაცია', keywords: ['companies', 'კომპანიები'] },
    { id: 'nav-categories', title: 'კატეგორიები', icon: Tag, action: () => router.push('/categories'), group: 'ნავიგაცია', keywords: ['categories'] },
    { id: 'nav-trash', title: 'ნაგავი', icon: Trash2, action: () => router.push('/trash'), group: 'ნავიგაცია', keywords: ['trash', 'deleted'] },
    { id: 'nav-profile', title: 'პროფილი', icon: User, action: () => router.push('/profile'), group: 'ნავიგაცია', keywords: ['profile', 'settings'] },
    { id: 'nav-settings', title: 'პარამეტრები', icon: Settings, action: () => router.push('/settings'), group: 'ნავიგაცია', keywords: ['settings'] },
    
    // Actions
    { id: 'action-new-case', title: 'ახალი ქეისი', description: 'შექმენით ახალი ქეისი', icon: Plus, action: () => router.push('/cases?new=true'), group: 'მოქმედებები', keywords: ['new', 'create', 'case'] },
    { id: 'action-new-invoice', title: 'ახალი ინვოისი', description: 'შექმენით ახალი ინვოისი', icon: Plus, action: () => router.push('/invoices?new=true'), group: 'მოქმედებები', keywords: ['new', 'create', 'invoice'] },
    { id: 'action-new-partner', title: 'ახალი პარტნიორი', description: 'დაამატეთ ახალი პარტნიორი', icon: Plus, action: () => router.push('/partners?new=true'), group: 'მოქმედებები', keywords: ['new', 'create', 'partner'] },
  ];

  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter(cmd => {
        const searchLower = search.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
        setIsOpen(false);
      }
    }
  }, [filteredCommands, selectedIndex]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 max-w-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="მოძებნეთ ბრძანება..."
            className="border-0 focus-visible:ring-0 h-12 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              შედეგები არ მოიძებნა
            </div>
          ) : (
            Object.entries(groupedCommands).map(([group, items]) => (
              <div key={group} className="mb-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                  {group}
                </div>
                {items.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{cmd.title}</div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
              ნავიგაცია
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
              გახსნა
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">⌘K</kbd>
            გახსნა/დახურვა
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
